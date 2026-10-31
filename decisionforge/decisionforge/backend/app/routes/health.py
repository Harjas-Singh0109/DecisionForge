from typing import Literal

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from ..llm.client import LLMError

router = APIRouter()


@router.get("/health")
async def health(request: Request):
    llm = await request.app.state.llm.health()
    ok = llm["reachable"] and llm["model_available"]
    return {
        "status": "ok" if ok else "degraded",
        "llm": llm,
        "decisions_loaded": sorted(request.app.state.decisions),
    }


class _SelfTest(BaseModel):
    larger: Literal[3, 7]
    reason: str


@router.post("/llm/selftest")
async def llm_selftest(request: Request):
    """Checks the model can return schema-valid JSON, and how long it takes."""
    try:
        result, seconds = await request.app.state.llm.timed_chat_json(
            system="You answer with JSON only.",
            user="Which number is larger, 3 or 7? Give the larger number and a one-sentence reason.",
            schema_model=_SelfTest,
        )
    except LLMError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    return {"ok": result.larger == 7, "seconds": seconds, "output": result.model_dump()}
