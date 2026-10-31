import asyncio
import json

import httpx
import pytest
from pydantic import BaseModel

from app.llm.client import LLMError, LLMStructuredError, OllamaClient


class Out(BaseModel):
    answer: int


def make_client(handler) -> OllamaClient:
    return OllamaClient("http://ollama.test", "qwen2.5:3b", transport=httpx.MockTransport(handler))


def reply(text: str) -> httpx.Response:
    return httpx.Response(200, json={"message": {"role": "assistant", "content": text}})


def run(coro):
    return asyncio.run(coro)


def test_valid_json_first_try():
    client = make_client(lambda req: reply('{"answer": 7}'))
    out = run(client.chat_json(system="s", user="u", schema_model=Out))
    assert out.answer == 7


def test_sends_schema_as_format_constraint():
    seen = {}

    def handler(req):
        seen.update(json.loads(req.content))
        return reply('{"answer": 1}')

    run(make_client(handler).chat_json(system="s", user="u", schema_model=Out))
    assert seen["format"]["properties"]["answer"]["type"] == "integer"
    assert seen["stream"] is False and seen["model"] == "qwen2.5:3b"


def test_retries_with_error_feedback_then_succeeds():
    calls = []

    def handler(req):
        body = json.loads(req.content)
        calls.append(body["messages"])
        return reply("not json at all") if len(calls) == 1 else reply('{"answer": 3}')

    out = run(make_client(handler).chat_json(system="s", user="u", schema_model=Out))
    assert out.answer == 3 and len(calls) == 2
    assert "not valid" in calls[1][-1]["content"]  # the error was fed back to the model


def test_gives_up_after_retries():
    client = make_client(lambda req: reply('{"answer": "oops"}'))
    with pytest.raises(LLMStructuredError):
        run(client.chat_json(system="s", user="u", schema_model=Out, retries=1))


def test_http_error_becomes_llm_error():
    client = make_client(lambda req: httpx.Response(500, text="boom"))
    with pytest.raises(LLMError):
        run(client.chat_json(system="s", user="u", schema_model=Out))


def test_health_reports_model_availability():
    ok = make_client(lambda req: httpx.Response(200, json={"models": [{"name": "qwen2.5:3b"}]}))
    assert run(ok.health()) == {"reachable": True, "model": "qwen2.5:3b", "model_available": True,
                                "installed_models": ["qwen2.5:3b"], "error": None}
    missing = make_client(lambda req: httpx.Response(200, json={"models": [{"name": "llama3:8b"}]}))
    h = run(missing.health())
    assert h["reachable"] and not h["model_available"]


def test_health_when_ollama_down():
    def handler(req):
        raise httpx.ConnectError("refused")

    h = run(make_client(handler).health())
    assert not h["reachable"] and h["error"]
