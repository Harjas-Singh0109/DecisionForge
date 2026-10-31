import httpx
from fastapi.testclient import TestClient

from app.llm.client import OllamaClient
from app.main import create_app


def _client(llm_handler) -> TestClient:
    llm = OllamaClient("http://ollama.test", "qwen2.5:3b", transport=httpx.MockTransport(llm_handler))
    return TestClient(create_app(llm))


def _ollama(req: httpx.Request) -> httpx.Response:
    if req.url.path == "/api/tags":
        return httpx.Response(200, json={"models": [{"name": "qwen2.5:3b"}]})
    return httpx.Response(200, json={"message": {"content": '{"larger": 7, "reason": "7 > 3"}'}})


def test_health_and_selftest():
    with _client(_ollama) as c:
        h = c.get("/health").json()
        assert h["status"] == "ok" and "nuclear_vs_solar_india" in h["decisions_loaded"]
        t = c.post("/llm/selftest").json()
        assert t["ok"] is True and t["output"]["larger"] == 7


def test_health_degraded_when_ollama_down():
    def down(req):
        raise httpx.ConnectError("refused")

    with _client(down) as c:
        assert c.get("/health").json()["status"] == "degraded"
        assert c.post("/llm/selftest").status_code == 503


def test_decision_endpoints():
    with _client(_ollama) as c:
        did = "nuclear_vs_solar_india"
        assert c.get("/decisions").json()[0]["id"] == did
        assert c.get(f"/decisions/{did}").json()["title"]
        assert c.get("/decisions/nope").status_code == 404

        s = c.post(f"/decisions/{did}/score", json={}).json()
        assert s["winner"] in ("nuclear", "solar") and s["all_sourced"] is False

        bad = c.post(f"/decisions/{did}/score", json={"weights": {"ghost": 1}})
        assert bad.status_code == 422

        sc = c.post(f"/decisions/{did}/scenario",
                    json={"scenario_variables": {"storage_cost": 30}}).json()
        assert "explanation" in sc and sc["unsourced_effects"]

        be = c.post(f"/decisions/{did}/breakeven", json={}).json()
        assert len(be) == 5


def test_homepage_served():
    with _client(_ollama) as c:
        assert c.get("/").status_code == 200
