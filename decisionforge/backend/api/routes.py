import asyncio
import json
import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Response
from fastapi.responses import StreamingResponse
from backend.database import crud
from backend.api.schemas import CreateInvestigationRequest, RecalculateScoresRequest, SimulateScenarioRequest
from backend.services.orchestrator import orchestrator
from backend.decision.scoring import calculate_baseline_scores, DEFAULT_CRITERIA
from backend.decision.scenarios import simulate_scenario, get_preset_scenarios
from backend.decision.analysis import generate_adaptive_analysis
from backend.reports.pdf_generator import generate_pdf_report
from backend.services.llm_service import LLMService

router = APIRouter(prefix="/api")
logger = logging.getLogger("decisionforge.api")
llm = LLMService()

@router.get("/system/status")
def get_system_status():
    ollama_info = llm.check_health()
    return {
        "status": "healthy",
        "system": "DECISIONFORGE Autonomous Decision Intelligence Platform",
        "llm": ollama_info,
        "search_engine": "GDELT 2.0 & Verified Research Pipeline"
    }

@router.post("/investigations/seed-demo")
def seed_demo_endpoint():
    from backend.data.seeds import seed_demo_data
    seed_demo_data()
    return {"status": "ok", "message": "Demo investigations successfully initialized"}

@router.get("/investigations")
def list_investigations():
    return crud.list_investigations()

@router.post("/investigations/detect-context")
def detect_investigation_context(req: Dict[str, str]):
    question = req.get("question", "")
    return llm.detect_context(question)

@router.post("/investigations")
async def create_investigation(req: CreateInvestigationRequest):
    # Auto-detect context if topic or geographical scope were omitted
    detected = llm.detect_context(req.question)
    final_topic = req.topic.strip() if req.topic and req.topic.strip() else detected["topic"]
    final_geo = req.geographical_scope.strip() if req.geographical_scope and req.geographical_scope.strip() else detected["geographical_scope"]
    final_time = req.time_horizon.strip() if req.time_horizon and req.time_horizon.strip() else detected["time_horizon"]

    inv_id = crud.create_investigation(
        question=req.question.strip(),
        topic=final_topic,
        geographical_scope=final_geo,
        time_horizon=final_time
    )
    crud.init_agents_for_investigation(inv_id)
    return {
        "id": inv_id, 
        "status": "draft", 
        "topic": final_topic,
        "geographical_scope": final_geo,
        "time_horizon": final_time,
        "message": "Investigation registered"
    }

@router.get("/investigations/{inv_id}")
def get_investigation(inv_id: str):
    inv = crud.get_investigation(inv_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    return inv

@router.delete("/investigations/{inv_id}")
def delete_investigation(inv_id: str):
    crud.delete_investigation(inv_id)
    return {"status": "deleted", "id": inv_id}

@router.post("/investigations/{inv_id}/start")
async def start_investigation(inv_id: str):
    inv = crud.get_investigation(inv_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    orchestrator.start_investigation(inv_id)
    return {"status": "started", "investigation_id": inv_id}

@router.post("/investigations/{inv_id}/cancel")
async def cancel_investigation(inv_id: str):
    success = orchestrator.cancel_investigation(inv_id)
    return {"status": "cancelled" if success else "not_running"}

@router.get("/investigations/{inv_id}/status")
def get_investigation_status(inv_id: str):
    inv = crud.get_investigation(inv_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    agents = crud.get_agents(inv_id)
    return {
        "investigation": inv,
        "agents": agents
    }

@router.get("/investigations/{inv_id}/agents")
def get_investigation_agents(inv_id: str):
    agents = crud.get_agents(inv_id)
    return agents

@router.get("/investigations/{inv_id}/evidence")
def get_investigation_evidence(inv_id: str):
    return crud.get_evidence_network(inv_id)

@router.get("/investigations/{inv_id}/decision")
def get_investigation_decision(inv_id: str):
    inv = crud.get_investigation(inv_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    alternatives = crud.get_alternatives(inv_id)
    scores = crud.get_scores(inv_id)
    
    # Group scores by alternative
    grouped = {}
    for s in scores:
        alt_name = s["alternative_name"]
        if alt_name not in grouped:
            grouped[alt_name] = []
        grouped[alt_name].append(s)

    return {
        "recommendation": inv.get("recommendation"),
        "reasoning": inv.get("recommendation_reasoning") or inv.get("summary"),
        "alternatives": alternatives,
        "scores": scores,
        "grouped_scores": grouped,
        "default_criteria": DEFAULT_CRITERIA
    }

@router.get("/investigations/{inv_id}/analysis")
def get_investigation_adaptive_analysis(inv_id: str):
    inv = crud.get_investigation(inv_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    alternatives = crud.get_alternatives(inv_id)
    network = crud.get_evidence_network(inv_id)
    scores = crud.get_scores(inv_id)
    
    return generate_adaptive_analysis(
        investigation=inv,
        alternatives=alternatives,
        claims=network.get("claims", []),
        sources=network.get("sources", []),
        scores=scores
    )

@router.post("/investigations/{inv_id}/decision/recalculate")
def recalculate_scores(inv_id: str, req: RecalculateScoresRequest):
    alternatives = crud.get_alternatives(inv_id)
    network = crud.get_evidence_network(inv_id)
    
    recalc = calculate_baseline_scores(alternatives, req.criteria, network["claims"])
    
    # Save newly calculated scores
    crud.clear_scores(inv_id)
    for alt_res in recalc["results"]:
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
            
    crud.update_investigation_status(
        inv_id,
        status="completed",
        recommendation=recalc["preferred_alternative"],
        reasoning=recalc["recommendation"] + " " + recalc["reasoning"]
    )
    
    return recalc

@router.post("/investigations/{inv_id}/scenario")
def run_scenario(inv_id: str, req: SimulateScenarioRequest):
    alternatives = crud.get_alternatives(inv_id)
    network = crud.get_evidence_network(inv_id)
    baseline = calculate_baseline_scores(alternatives, DEFAULT_CRITERIA, network["claims"])
    
    scenario_result = simulate_scenario(baseline, req.assumptions)
    crud.save_scenario(inv_id, req.scenario_name, req.assumptions, scenario_result)
    
    return scenario_result

@router.get("/investigations/{inv_id}/scenarios")
def list_scenarios(inv_id: str):
    scenarios = crud.get_scenarios(inv_id)
    presets = get_preset_scenarios()
    return {
        "saved_scenarios": scenarios,
        "presets": presets
    }

@router.get("/investigations/{inv_id}/report")
def get_report_json(inv_id: str):
    inv = crud.get_investigation(inv_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    alternatives = crud.get_alternatives(inv_id)
    scores = crud.get_scores(inv_id)
    network = crud.get_evidence_network(inv_id)
    scenarios = crud.get_scenarios(inv_id)
    agents = crud.get_agents(inv_id)
    
    return {
        "investigation": inv,
        "alternatives": alternatives,
        "scores": scores,
        "evidence_network": network,
        "scenarios": scenarios,
        "agents": agents
    }

@router.get("/investigations/{inv_id}/export")
def export_pdf_report(inv_id: str):
    try:
        pdf_buffer = generate_pdf_report(inv_id)
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=decisionforge_report_{inv_id}.pdf"}
        )
    except Exception as e:
        logger.error(f"PDF export failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Could not generate PDF: {str(e)}")

@router.get("/events/{inv_id}")
async def event_stream(inv_id: str):
    """Server-Sent Events endpoint for real-time frontend updates."""
    queue = orchestrator.subscribe_events(inv_id)

    async def stream():
        try:
            # Yield initial connection heartbeat
            yield f"data: {json.dumps({'type': 'connected', 'investigation_id': inv_id})}\n\n"
            while True:
                msg = await queue.get()
                yield f"data: {json.dumps(msg)}\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            orchestrator.unsubscribe_events(inv_id, queue)

    return StreamingResponse(stream(), media_type="text/event-stream")
