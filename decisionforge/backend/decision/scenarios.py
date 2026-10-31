import logging
from typing import List, Dict, Any

logger = logging.getLogger("decisionforge.scenarios")

def simulate_scenario(
    baseline_result: Dict[str, Any],
    assumptions: Dict[str, float]
) -> Dict[str, Any]:
    """
    Recalculates decision scores deterministically based on modified hypothetical variables.
    
    Hypothetical Variables:
    - tech_cost_change: -0.50 to +0.50 (e.g. -0.30 means equipment price drops 30%)
    - deployment_speed_mult: 0.5 to 2.0 (speed of buildouts)
    - baseload_reliability_premium: 0.0 to 1.0 (value placed on 24/7 continuous dispatch)
    - capex_inflation: -0.30 to +0.50 (cost overruns or financing interest rate shifts)
    - carbon_tax_support: 0.0 to 1.0 (subsidies/penalties favoring zero-carbon lifecycle)
    """
    original_results = baseline_result.get("results", [])
    original_preferred = baseline_result.get("preferred_alternative")
    
    tech_cost = assumptions.get("tech_cost_change", 0.0)
    speed_mult = assumptions.get("deployment_speed_mult", 1.0)
    baseload_premium = assumptions.get("baseload_reliability_premium", 0.0)
    capex_inflation = assumptions.get("capex_inflation", 0.0)
    carbon_support = assumptions.get("carbon_tax_support", 0.0)

    simulated_results = []
    influences = {}

    for alt in original_results:
        alt_name = alt["alternative_name"]
        alt_id = alt["alternative_id"]
        is_renewable_fast = any(k in alt_name.lower() for k in ["solar", "swap", "battery"])
        is_baseload_nuclear = any(k in alt_name.lower() for k in ["nuclear", "grid", "smr", "corridors", "fast charging"])

        new_criteria_scores = []
        new_total = 0.0

        for crit in alt["scores_by_criterion"]:
            c_name = crit["criterion"]
            orig_raw = crit["raw_score"]
            weight = crit["weight"]
            
            raw_adj = orig_raw
            
            # 1. Economic Feasibility
            if "economic" in c_name.lower():
                if is_renewable_fast:
                    # Equipment price changes impact solar/swapping directly
                    raw_adj += (-tech_cost * 4.5) - (capex_inflation * 1.5)
                else:
                    raw_adj -= (capex_inflation * 2.0)
                    if baseload_premium > 0.3:
                        raw_adj += (baseload_premium - 0.3) * 2.5

            # 2. Scalability & Speed
            elif "scalability" in c_name.lower() or "speed" in c_name.lower():
                if is_renewable_fast:
                    raw_adj += (speed_mult - 1.0) * 2.5
                else:
                    raw_adj += (speed_mult - 1.0) * 2.0

            # 3. Long-term Sustainability & Baseload Resilience
            elif "sustainability" in c_name.lower():
                if is_baseload_nuclear:
                    raw_adj += baseload_premium * 3.5
                else:
                    raw_adj -= baseload_premium * 3.2

            # 4. Environmental Impact
            elif "environmental" in c_name.lower():
                if carbon_support > 0:
                    raw_adj += carbon_support * 1.5

            # Clamp between 1.0 and 10.0
            raw_adj = max(1.0, min(10.0, round(raw_adj, 2)))
            w_score = round(raw_adj * weight, 2)
            new_total += w_score

            new_criteria_scores.append({
                "criterion": c_name,
                "raw_score": raw_adj,
                "weight": weight,
                "weighted_score": w_score,
                "delta": round(raw_adj - orig_raw, 2)
            })

        simulated_results.append({
            "alternative_id": alt_id,
            "alternative_name": alt_name,
            "total_score": round(new_total, 2),
            "original_score": alt["total_score"],
            "score_delta": round(new_total - alt["total_score"], 2),
            "scores_by_criterion": new_criteria_scores
        })

    # Sort simulated outcomes descending
    simulated_results.sort(key=lambda x: x["total_score"], reverse=True)
    new_preferred = simulated_results[0]
    new_runner_up = simulated_results[1] if len(simulated_results) > 1 else None

    decision_flipped = (new_preferred["alternative_name"] != original_preferred)
    
    # Calculate variable impact ranking
    influences["baseload_reliability_premium"] = baseload_premium * 3.5
    influences["tech_cost_change"] = abs(tech_cost) * 3.0
    influences["deployment_speed_mult"] = abs(speed_mult - 1.0) * 2.2
    influences["capex_inflation"] = abs(capex_inflation) * 1.8
    influences["carbon_tax_support"] = carbon_support * 1.2
    
    most_influential = sorted(influences.items(), key=lambda x: x[1], reverse=True)
    top_var = most_influential[0][0]

    explanation = ""
    if decision_flipped:
        explanation = (
            f"STRATEGIC RECOMMENDATION FLIPPED: Under these hypothetical assumptions, "
            f"'{new_preferred['alternative_name']}' overtakes '{original_preferred}' "
            f"by +{round(new_preferred['total_score'] - (new_runner_up['total_score'] if new_runner_up else 0), 2)} points. "
            f"The primary tipping driver is '{top_var.replace('_', ' ').capitalize()}', "
            f"which fundamentally alters the trade-off between deployment gestation and 24/7 continuous baseload security."
        )
    else:
        explanation = (
            f"RECOMMENDATION HOLDS: '{original_preferred}' maintains its strategic leadership "
            f"with an aggregate score of {new_preferred['total_score']} / 10.0. "
            f"The decision is resilient against current variations in {top_var.replace('_', ' ')}."
        )

    return {
        "original_preferred": original_preferred,
        "scenario_preferred": new_preferred["alternative_name"],
        "decision_flipped": decision_flipped,
        "original_scores": {r["alternative_name"]: r["total_score"] for r in original_results},
        "scenario_scores": {r["alternative_name"]: r["total_score"] for r in simulated_results},
        "score_difference": round(new_preferred["total_score"] - (new_runner_up["total_score"] if new_runner_up else 0), 2),
        "results": simulated_results,
        "changed_assumptions": assumptions,
        "most_influential_variables": [k for k, v in most_influential if v > 0.1],
        "explanation": explanation
    }

def get_preset_scenarios() -> Dict[str, Dict[str, Any]]:
    return {
        "Optimistic Tech Leap": {
            "name": "Optimistic Tech Leap",
            "description": "Equipment costs fall 35%, rapid localized manufacturing doubles build speeds.",
            "assumptions": {
                "tech_cost_change": -0.35,
                "deployment_speed_mult": 1.6,
                "baseload_reliability_premium": 0.1,
                "capex_inflation": -0.15,
                "carbon_tax_support": 0.5
            }
        },
        "Pessimistic Stress Test": {
            "name": "Pessimistic Stress Test",
            "description": "Critical mineral shortages inflate battery capex 35%, regulatory gridlock slows deployment by 40%.",
            "assumptions": {
                "tech_cost_change": 0.35,
                "deployment_speed_mult": 0.6,
                "baseload_reliability_premium": 0.65,
                "capex_inflation": 0.20,
                "carbon_tax_support": 0.0
            }
        },
        "High-Growth Baseload Crunch": {
            "name": "High-Growth Baseload Crunch",
            "description": "Industrial power consumption spikes 70%, putting severe reliability premiums on 24/7 continuous dispatch.",
            "assumptions": {
                "tech_cost_change": 0.25,
                "deployment_speed_mult": 1.0,
                "baseload_reliability_premium": 0.90,
                "capex_inflation": -0.05,
                "carbon_tax_support": 0.3
            }
        }
    }
