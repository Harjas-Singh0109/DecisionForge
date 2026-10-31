from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class CreateInvestigationRequest(BaseModel):
    question: str
    topic: Optional[str] = None
    geographical_scope: Optional[str] = "National"
    time_horizon: Optional[str] = "10 Years"

class RecalculateScoresRequest(BaseModel):
    criteria: List[Dict[str, Any]]

class SimulateScenarioRequest(BaseModel):
    scenario_name: Optional[str] = "Custom Simulation"
    assumptions: Dict[str, float]
