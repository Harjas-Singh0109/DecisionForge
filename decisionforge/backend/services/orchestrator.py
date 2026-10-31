import asyncio
import logging
import json
from typing import Dict, Any, List, Optional
from backend.database import crud
from backend.services.llm_service import LLMService
from backend.research.source_manager import SourceManager
from backend.decision.scoring import calculate_baseline_scores, DEFAULT_CRITERIA
from backend.decision.scenarios import get_preset_scenarios

logger = logging.getLogger("decisionforge.orchestrator")

class InvestigationOrchestrator:
    def __init__(self):
        self.llm = LLMService()
        self.active_tasks: Dict[str, asyncio.Task] = {}
        self.event_queues: Dict[str, List[asyncio.Queue]] = {}

    def subscribe_events(self, inv_id: str) -> asyncio.Queue:
        if inv_id not in self.event_queues:
            self.event_queues[inv_id] = []
        q = asyncio.Queue()
        self.event_queues[inv_id].append(q)
        return q

    def unsubscribe_events(self, inv_id: str, q: asyncio.Queue):
        if inv_id in self.event_queues and q in self.event_queues[inv_id]:
            self.event_queues[inv_id].remove(q)

    async def broadcast_event(self, inv_id: str, event_type: str, data: Dict[str, Any]):
        msg = {"type": event_type, "data": data}
        if inv_id in self.event_queues:
            for q in list(self.event_queues[inv_id]):
                await q.put(msg)

    async def run_investigation(self, inv_id: str):
        print(f"[ORCH] Starting run_investigation for {inv_id}", flush=True)
        inv = crud.get_investigation(inv_id)
        if not inv:
            print("[ORCH] Investigation not found!", flush=True)
            return

        crud.update_investigation_status(inv_id, "in_progress")
        crud.init_agents_for_investigation(inv_id)
        print("[ORCH] Init agents complete", flush=True)
        await self.broadcast_event(inv_id, "investigation_started", {"investigation_id": inv_id})

        source_mgr = SourceManager(inv_id)
        question = inv["question"]
        topic = inv.get("topic")
        geo = inv.get("geographical_scope")
        time_h = inv.get("time_horizon")

        try:
            # 1. RESEARCH PLANNER AGENT
            print("[ORCH] Running Research Planner...", flush=True)
            await self._run_agent(
                inv_id, "Research Planner", "Analyzing strategic decision framing and generating research tasks...",
                status_during="planning"
            )
            # Clear any previously generated alternatives to prevent duplication on restart
            crud.clear_alternatives(inv_id)
            plan = self.llm.generate_plan(question, topic, geo, time_h)
            print("[ORCH] Planner generated plan successfully", flush=True)
            
            # Save alternatives with deduplication
            alt_map = {}
            for alt_data in plan.get("alternatives", []):
                alt_name = alt_data["name"].strip()
                if alt_name and alt_name not in alt_map:
                    alt_id = crud.add_alternative(inv_id, alt_name, alt_data.get("description"))
                    alt_map[alt_name] = alt_id

            alternatives = crud.get_alternatives(inv_id)
            crud.update_agent_status(
                inv_id, "Research Planner", "completed",
                current_task="Decision decomposed into competitive hypotheses and criteria.",
                output=json.dumps(plan, indent=2),
                findings_count=len(plan.get("research_tasks", []))
            )
            await self.broadcast_event(inv_id, "agent_updated", {"agent_name": "Research Planner", "status": "completed"})
            await asyncio.sleep(0.5)

            # 2. SPECIALIST RESEARCH AGENTS
            specialists = [
                ("Literature Research Agent", "literature", "academic papers & peer-reviewed lifecycle studies"),
                ("Data Research Agent", "data", "LCOE tariffs, capital expenditure, and empirical metrics"),
                ("Market Research Agent", "market", "commercial vendor maturity, supply chains, and deployment"),
                ("Impact Research Agent", "impact", "long-term environmental lifecycle and regulatory policy")
            ]

            all_claims = []
            for agent_name, agent_key, task_desc in specialists:
                print(f"[ORCH] Running specialist: {agent_name}...", flush=True)
                await self._run_agent(inv_id, agent_name, f"Retrieving verified sources for {task_desc}...", status_during="researching")
                
                # Fetch sources for this specialty
                search_query = f"{question} {agent_key}"
                sources = source_mgr.search_and_ingest(search_query, agent_type=agent_key, max_sources=3)
                
                # Generate findings & claims
                claims_data = self.llm.generate_findings(agent_name, task_desc, alternatives, sources)
                print(f"[ORCH] Specialist {agent_name} generated {len(claims_data)} claims", flush=True)
                
                for c in claims_data:
                    alt_id = alt_map.get(c.get("alternative_name")) or (alternatives[0]["id"] if alternatives else None)
                    c_id = crud.add_claim(
                        inv_id=inv_id,
                        claim_text=c["claim_text"],
                        alternative_id=alt_id,
                        quality="Unverified source",
                        verification_status="pending",
                        explanation=c.get("confidence_note"),
                        agent_origin=agent_name
                    )
                    
                    # Connect claim with source evidence link
                    src = next((s for s in sources if s.get("url") == c.get("source_url")), (sources[0] if sources else None))
                    if src:
                        crud.add_evidence(
                            claim_id=c_id,
                            source_id=src["id"],
                            relationship_type="supporting",
                            supporting_excerpt=c.get("supporting_excerpt"),
                            verification_notes=c.get("confidence_note")
                        )
                    c["id"] = c_id
                    c["source_id"] = src["id"] if src else None
                    all_claims.append(c)

                crud.update_agent_status(
                    inv_id, agent_name, "completed",
                    current_task=f"Synthesized evidence from {len(sources)} validated source documents.",
                    output=json.dumps(claims_data, indent=2),
                    findings_count=len(claims_data)
                )
                await self.broadcast_event(inv_id, "agent_updated", {"agent_name": agent_name, "status": "completed"})
                await asyncio.sleep(0.5)

            # 3. CRITIC AGENT (Acts as devil's advocate, challenges assumptions)
            await self._run_agent(inv_id, "Critic Agent", "Stress-testing findings, challenging unstated premises, and surfacing counter-evidence...", status_during="challenging")
            all_sources = source_mgr.get_all_sources()
            critique = self.llm.generate_critique(alternatives, all_claims, all_sources)
            
            # Add counter-evidence as claims
            for ce in critique.get("counter_evidence", []):
                alt_id = alt_map.get(ce.get("alternative")) or (alternatives[0]["id"] if alternatives else None)
                c_id = crud.add_claim(
                    inv_id=inv_id,
                    claim_text=ce["point"],
                    alternative_id=alt_id,
                    quality="Contradictory evidence",
                    verification_status="disputed",
                    explanation="Identified by Critic Agent as an unaddressed systemic vulnerability.",
                    agent_origin="Critic Agent"
                )
                if all_sources:
                    crud.add_evidence(
                        claim_id=c_id,
                        source_id=all_sources[0]["id"],
                        relationship_type="contradicting",
                        supporting_excerpt=ce["point"],
                        verification_notes="Critic stress-test finding."
                    )

            crud.update_agent_status(
                inv_id, "Critic Agent", "completed",
                current_task=f"Surfaced {len(critique.get('counter_evidence', []))} counter-claims and challenged {len(critique.get('challenged_assumptions', []))} assumptions.",
                output=json.dumps(critique, indent=2),
                findings_count=len(critique.get("counter_evidence", [])) + len(critique.get("challenged_assumptions", []))
            )
            await self.broadcast_event(inv_id, "agent_updated", {"agent_name": "Critic Agent", "status": "completed"})
            await asyncio.sleep(0.5)

            # 4. EVIDENCE VERIFICATION AGENT
            await self._run_agent(inv_id, "Evidence Verification Agent", "Cross-checking citations against primary source texts...", status_during="verifying")
            network = crud.get_evidence_network(inv_id)
            verifications = self.llm.verify_claims(network["claims"], network["sources"])
            for v in verifications:
                crud.update_claim_verification(
                    claim_id=v["claim_id"],
                    quality=v["quality"],
                    verification_status=v["verification_status"],
                    explanation=v["explanation"]
                )

            crud.update_agent_status(
                inv_id, "Evidence Verification Agent", "completed",
                current_task=f"Audited {len(verifications)} claims. Assigned verified support & insufficient evidence labels.",
                output=json.dumps(verifications, indent=2),
                findings_count=len(verifications)
            )
            await self.broadcast_event(inv_id, "agent_updated", {"agent_name": "Evidence Verification Agent", "status": "completed"})
            await asyncio.sleep(0.5)

            # 5. CONTRADICTION FINDER
            await self._run_agent(inv_id, "Contradiction Finder", "Detecting methodological discrepancies and divergent findings...", status_during="analyzing")
            contradictions = self.llm.find_contradictions(network["claims"], network["sources"])
            crud.update_agent_status(
                inv_id, "Contradiction Finder", "completed",
                current_task=f"Mapped {len(contradictions)} core evidentiary divergences without forcing premature consensus.",
                output=json.dumps(contradictions, indent=2),
                findings_count=len(contradictions)
            )
            await self.broadcast_event(inv_id, "agent_updated", {"agent_name": "Contradiction Finder", "status": "completed"})
            await asyncio.sleep(0.5)

            # 6. DECISION ENGINE (Deterministic Python MCDA)
            await self._run_agent(inv_id, "Decision Engine", "Computing deterministic multi-criteria weights and sensitivity baselines...", status_during="analyzing")
            decision_eval = calculate_baseline_scores(alternatives, DEFAULT_CRITERIA, network["claims"])
            
            # Save scores to database
            crud.clear_scores(inv_id)
            for alt_res in decision_eval["results"]:
                a_id = alt_res["alternative_id"]
                for sc in alt_res["scores_by_criterion"]:
                    crud.save_score(
                        inv_id=inv_id,
                        alt_id=a_id,
                        criterion=sc["criterion"],
                        raw_score=sc["raw_score"],
                        weight=sc["weight"],
                        weighted_score=sc["weighted_score"],
                        explanation=sc["explanation"]
                    )

            # Save preset scenarios into DB for instant recall
            presets = get_preset_scenarios()
            for p_name, p_data in presets.items():
                crud.save_scenario(inv_id, p_name, p_data["assumptions"], p_data)

            crud.update_agent_status(
                inv_id, "Decision Engine", "completed",
                current_task=f"Recommendation formulated: {decision_eval['preferred_alternative']}.",
                output=json.dumps(decision_eval, indent=2),
                findings_count=len(decision_eval["results"])
            )
            await self.broadcast_event(inv_id, "agent_updated", {"agent_name": "Decision Engine", "status": "completed"})

            # Mark investigation completed
            crud.update_investigation_status(
                inv_id=inv_id,
                status="completed",
                summary=f"Synthesized evidence from {len(all_sources)} validated references across {len(alternatives)} alternatives.",
                recommendation=decision_eval["preferred_alternative"],
                reasoning=decision_eval["recommendation"] + " " + decision_eval["reasoning"]
            )
            await self.broadcast_event(inv_id, "investigation_completed", {"investigation_id": inv_id, "recommendation": decision_eval["preferred_alternative"]})

        except asyncio.CancelledError:
            crud.update_investigation_status(inv_id, "cancelled")
            await self.broadcast_event(inv_id, "investigation_cancelled", {"investigation_id": inv_id})
        except Exception as e:
            logger.error(f"Investigation {inv_id} encountered fatal error: {e}", exc_info=True)
            crud.update_investigation_status(inv_id, "failed")
            await self.broadcast_event(inv_id, "investigation_failed", {"investigation_id": inv_id, "error": str(e)})

    async def _run_agent(self, inv_id: str, agent_name: str, task_desc: str, status_during: str = "researching"):
        crud.update_agent_status(inv_id, agent_name, status_during, current_task=task_desc)
        await self.broadcast_event(inv_id, "agent_updated", {"agent_name": agent_name, "status": status_during, "task": task_desc})
        await asyncio.sleep(0.4)

    def start_investigation(self, inv_id: str):
        if inv_id in self.active_tasks and not self.active_tasks[inv_id].done():
            return
        
        loop = getattr(self, "loop", None)
        try:
            current_loop = asyncio.get_running_loop()
        except RuntimeError:
            current_loop = None

        if current_loop:
            task = current_loop.create_task(self.run_investigation(inv_id))
            self.active_tasks[inv_id] = task
        elif loop and loop.is_running():
            future = asyncio.run_coroutine_threadsafe(self.run_investigation(inv_id), loop)
            self.active_tasks[inv_id] = future
        else:
            new_loop = asyncio.get_event_loop()
            task = new_loop.create_task(self.run_investigation(inv_id))
            self.active_tasks[inv_id] = task

    def cancel_investigation(self, inv_id: str) -> bool:
        if inv_id in self.active_tasks and not self.active_tasks[inv_id].done():
            self.active_tasks[inv_id].cancel()
            return True
        return False

# Global orchestrator singleton
orchestrator = InvestigationOrchestrator()
