"""Central settings. Override any value with an environment variable."""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings:
    ollama_url: str = os.getenv("OLLAMA_URL", "http://localhost:11434")
    ollama_model: str = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")
    llm_timeout: float = float(os.getenv("LLM_TIMEOUT", "120"))
    decisions_dir: Path = Path(os.getenv("DECISIONS_DIR", BASE_DIR / "data" / "decisions"))
    static_dir: Path = BASE_DIR / "static"


settings = Settings()
