"""DecisionForge backend entry point.  Run:  uvicorn app.main:app --reload"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from .config import settings
from .decisions import load_decisions
from .llm.client import OllamaClient
from .routes import decisions, health


def create_app(llm: OllamaClient | None = None) -> FastAPI:
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.decisions = load_decisions()  # fail fast on a broken config
        app.state.llm = llm or OllamaClient(settings.ollama_url, settings.ollama_model,
                                            settings.llm_timeout)
        yield
        await app.state.llm.aclose()

    app = FastAPI(title="DecisionForge", version="0.1.0", lifespan=lifespan)
    app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"],
                       allow_methods=["*"], allow_headers=["*"])
    app.include_router(health.router)
    app.include_router(decisions.router)

    @app.get("/", include_in_schema=False)
    async def index():
        return FileResponse(settings.static_dir / "index.html")

    return app


app = create_app()
