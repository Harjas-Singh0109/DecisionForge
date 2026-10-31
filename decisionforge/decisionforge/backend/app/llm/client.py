"""Async Ollama client.

Small models (Qwen2.5 3B) break JSON formats often, so every agent call goes through
`chat_json`, which:
  1. sends the Pydantic JSON schema to Ollama as the `format` constraint,
  2. validates the reply with Pydantic,
  3. on failure, feeds the error back to the model and retries.
"""
from __future__ import annotations

import json
import time
from typing import TypeVar

import httpx
from pydantic import BaseModel, ValidationError

T = TypeVar("T", bound=BaseModel)


class LLMError(Exception):
    """Ollama is unreachable or returned an error."""


class LLMStructuredError(LLMError):
    """The model never produced output matching the requested schema."""


class OllamaClient:
    def __init__(
        self,
        base_url: str,
        model: str,
        timeout: float = 120.0,
        transport: httpx.AsyncBaseTransport | None = None,
    ):
        self.model = model
        self._http = httpx.AsyncClient(base_url=base_url, timeout=timeout, transport=transport)

    async def aclose(self) -> None:
        await self._http.aclose()

    # ------------------------------------------------------------ health --
    async def health(self) -> dict:
        """Is Ollama reachable, and is the configured model pulled?"""
        try:
            r = await self._http.get("/api/tags", timeout=5.0)
            r.raise_for_status()
        except (httpx.HTTPError, OSError) as exc:
            return {"reachable": False, "model": self.model, "model_available": False,
                    "installed_models": [], "error": str(exc) or exc.__class__.__name__}
        names = [m.get("name", "") for m in r.json().get("models", [])]
        wanted = self.model.lower()
        available = any(n.lower() == wanted or n.lower() == f"{wanted}:latest" for n in names)
        return {"reachable": True, "model": self.model, "model_available": available,
                "installed_models": names, "error": None}

    # -------------------------------------------------------------- chat --
    async def chat_json(
        self,
        *,
        system: str,
        user: str,
        schema_model: type[T],
        retries: int = 2,
        temperature: float = 0.2,
        num_ctx: int = 4096,
    ) -> T:
        """Ask the model for JSON matching `schema_model`; validate; retry with feedback."""
        messages = [{"role": "system", "content": system}, {"role": "user", "content": user}]
        last_error = "unknown error"
        for attempt in range(retries + 1):
            payload = {
                "model": self.model,
                "messages": messages,
                "stream": False,
                "format": schema_model.model_json_schema(),
                "options": {"temperature": temperature, "num_ctx": num_ctx},
            }
            try:
                r = await self._http.post("/api/chat", json=payload)
                r.raise_for_status()
                content = r.json()["message"]["content"]
            except (httpx.HTTPError, KeyError, ValueError) as exc:
                raise LLMError(f"Ollama request failed: {exc}") from exc

            try:
                return schema_model.model_validate(json.loads(content))
            except (json.JSONDecodeError, ValidationError) as exc:
                last_error = str(exc)
                messages = messages + [
                    {"role": "assistant", "content": content},
                    {"role": "user", "content": (
                        "Your reply was not valid for the required JSON schema. "
                        f"Problem: {last_error[:500]}\n"
                        "Reply again with ONLY corrected JSON matching the schema."
                    )},
                ]
        raise LLMStructuredError(
            f"No valid structured output after {retries + 1} attempts: {last_error[:300]}"
        )

    async def timed_chat_json(self, **kwargs) -> tuple[BaseModel, float]:
        """chat_json plus wall-clock seconds (useful for latency checks)."""
        t0 = time.perf_counter()
        result = await self.chat_json(**kwargs)
        return result, round(time.perf_counter() - t0, 2)
