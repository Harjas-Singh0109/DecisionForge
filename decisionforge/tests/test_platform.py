import pytest
from backend.database import crud, db
from backend.decision.scoring import calculate_baseline_scores, normalize_weights, DEFAULT_CRITERIA
from backend.decision.scenarios import simulate_scenario, get_preset_scenarios
from backend.reports.pdf_generator import generate_pdf_report
from backend.services.llm_service import LLMService

@pytest.fixture(autouse=True)
def setup_database():
    db.init_db()

def test_weight_normalization():
    criteria = [
        {"name": "A", "weight": 50},
        {"name": "B", "weight": 50}
    ]
    normalized = normalize_weights(criteria)
    total = sum(c["weight"] for c in normalized)
    assert abs(total - 1.0) < 0.001
    assert normalized[0]["weight"] == 0.5

def test_deterministic_scoring():
    alts = [
        {"id": "alt_1", "name": "Solar Energy with Battery Storage"},
        {"id": "alt_2", "name": "Nuclear Power Expansion"}
    ]
    res = calculate_baseline_scores(alts, DEFAULT_CRITERIA)
    assert res["preferred_alternative"] is not None
    assert len(res["results"]) == 2
    assert res["results"][0]["total_score"] > 0

def test_scenario_simulation_and_flipping():
    alts = [
        {"id": "alt_1", "name": "Solar Energy with Battery Storage"},
        {"id": "alt_2", "name": "Nuclear Power Expansion"}
    ]
    baseline = calculate_baseline_scores(alts, DEFAULT_CRITERIA)
    
    # High baseload crunch scenario puts extreme premium on nuclear baseload
    assumptions = {
        "tech_cost_change": 0.1,
        "deployment_speed_mult": 0.8,
        "baseload_reliability_premium": 0.95,
        "capex_inflation": 0.1,
        "carbon_tax_support": 0.2
    }
    scenario_res = simulate_scenario(baseline, assumptions)
    assert "scenario_preferred" in scenario_res
    assert "explanation" in scenario_res
    assert len(scenario_res["results"]) == 2

def test_pdf_generation():
    from backend.data.seeds import seed_demo_data
    seed_demo_data()
    buf = generate_pdf_report("demo-india-energy-2035")
    assert buf is not None
    assert len(buf.getvalue()) > 1000

def test_llm_service_health():
    llm = LLMService()
    health = llm.check_health()
    assert health["status"] in ["online", "offline"]
    assert "engine" in health

def test_adaptive_analysis_archetype_detection():
    from backend.decision.analysis import detect_topic_archetype, generate_adaptive_analysis
    assert detect_topic_archetype("Should India prioritize nuclear energy or solar energy?", "Clean Energy") == "energy_infrastructure"
    assert detect_topic_archetype("Should hospital adopt open-source local clinical models or cloud APIs?", "Healthcare") == "science_clinical"
    assert detect_topic_archetype("Should we prioritize drone swarm interceptors or lasers?", "Defense") == "defense_geopolitics"
    assert detect_topic_archetype("Should SaaS startup pursue self-serve PLG or enterprise sales?", "Business") == "business_startup"

    # Test analysis generator returns full structure
    inv = {
        "question": "Should India prioritize nuclear energy or solar energy?",
        "topic": "Clean Energy",
        "geographical_scope": "National",
        "time_horizon": "10 Years"
    }
    alts = [{"id": "alt_1", "name": "Solar PV"}, {"id": "alt_2", "name": "Nuclear"}]
    res = generate_adaptive_analysis(inv, alts, [], [], [])
    assert res["archetype"] == "energy_infrastructure"
    assert len(res["key_metrics"]) > 0
    assert len(res["radar_dimensions"]) > 0
    assert "analytical_breakdown" in res
