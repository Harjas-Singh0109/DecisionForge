import logging
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import HOST, PORT, DEBUG
from backend.database.db import init_db
from backend.data.seeds import seed_demo_data
from backend.api.routes import router

import asyncio
from backend.services.orchestrator import orchestrator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("decisionforge")

@asynccontextmanager
async def lifespan(app: FastAPI):
    orchestrator.loop = asyncio.get_running_loop()
    logger.info("Initializing DECISIONFORGE Database...")
    init_db()
    logger.info("Seeding benchmark demo investigations...")
    seed_demo_data()
    logger.info("DECISIONFORGE Autonomous Decision Intelligence Platform is Ready.")
    yield

app = FastAPI(
    title="DECISIONFORGE API",
    description="Autonomous AI Decision Intelligence Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
def root():
    return {
        "platform": "DECISIONFORGE",
        "tagline": "Don't just find answers. Discover what would change your mind.",
        "status": "online",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=HOST, port=PORT, reload=DEBUG)
