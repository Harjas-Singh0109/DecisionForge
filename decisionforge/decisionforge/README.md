# DecisionForge: backend (steps 1-3)

Built so far: Ollama client with schema-validated JSON and retry, decision config loader,
deterministic scoring engine, scenario + breakeven engine, REST API, plain test page.
Not built yet: retrieval, agents, critic, evidence checker, orchestrator, report.

## Run (Windows 11, PowerShell)

```powershell
# one-time
ollama pull qwen2.5:3b
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

# every time
ollama serve            # skip if the Ollama app is already running
uvicorn app.main:app --reload
```

Open http://localhost:8000 (test page) or http://localhost:8000/docs (API explorer).

## Verify it works

1. `python -m pytest -q` : all tests should pass (no Ollama needed).
2. Test page, section 1: health should say "Ollama connected, model qwen2.5:3b ready".
3. Click "Run LLM JSON self-test": confirms the model returns schema-valid JSON, and shows latency.
   If this fails or is slow, we need to know BEFORE building the agents.
4. Move the assumption sliders, click "Compare with baseline" and "What would change the answer?".

## Important: the numbers are placeholders

Every value in `data/decisions/nuclear_vs_solar.yaml` is illustrative and flagged
`provenance: placeholder`. The API and test page warn about this on every result.
Replace them with sourced values during research (set `provenance: sourced` and add `source_ids`).

## How scoring works

- score(option, dimension) = linear map of the metric from `worst` (0) to `best` (100), clamped
- total = sum(normalised weight x score)
- assumption sliders are % changes; metric' = metric x (1 + sum(elasticity x slider / 100))
- breakeven = for each slider, the nearest value at which the winner changes (None = no flip in range)

## Config

Environment variables: OLLAMA_URL (default http://localhost:11434), OLLAMA_MODEL (default qwen2.5:3b),
LLM_TIMEOUT (default 120), DECISIONS_DIR.

## Add another decision

Copy `data/decisions/nuclear_vs_solar.yaml`, change the contents, restart. No code changes.
