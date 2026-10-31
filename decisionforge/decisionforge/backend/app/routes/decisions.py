from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from ..engine import scenario as scenario_engine
from ..engine.scoring import InputError, score
from ..schemas import Breakeven, Decision, ScenarioResult, ScoreResult

router = APIRouter(prefix="/decisions")


class ScoreRequest(BaseModel):
    weights: dict[str, float] | None = None
    variables: dict[str, float] | None = None


class ScenarioRequest(BaseModel):
    weights: dict[str, float] | None = None
    baseline_variables: dict[str, float] | None = None
    scenario_variables: dict[str, float] | None = None


def _get(request: Request, decision_id: str) -> Decision:
    decision = request.app.state.decisions.get(decision_id)
    if decision is None:
        raise HTTPException(status_code=404, detail=f"Unknown decision '{decision_id}'")
    return decision


@router.get("")
async def list_decisions(request: Request):
    return [{"id": d.id, "title": d.title, "question": d.question}
            for d in request.app.state.decisions.values()]


@router.get("/{decision_id}", response_model=Decision)
async def get_decision(decision_id: str, request: Request):
    return _get(request, decision_id)


@router.post("/{decision_id}/score", response_model=ScoreResult)
async def post_score(decision_id: str, body: ScoreRequest, request: Request):
    decision = _get(request, decision_id)
    try:
        return score(decision, body.weights, body.variables)
    except InputError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@router.post("/{decision_id}/scenario", response_model=ScenarioResult)
async def post_scenario(decision_id: str, body: ScenarioRequest, request: Request):
    decision = _get(request, decision_id)
    try:
        return scenario_engine.compare(decision, body.weights, body.baseline_variables,
                                       body.scenario_variables)
    except InputError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@router.post("/{decision_id}/breakeven", response_model=list[Breakeven])
async def post_breakeven(decision_id: str, body: ScoreRequest, request: Request):
    decision = _get(request, decision_id)
    try:
        return scenario_engine.breakeven(decision, body.weights, body.variables)
    except InputError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
