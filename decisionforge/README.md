# DECISIONFORGE
### Autonomous AI Decision Intelligence Platform
> *"Don't just find answers. Discover what would change your mind."*

---

## 1. Executive Summary

**DECISIONFORGE** is an autonomous AI-powered decision intelligence platform that transforms complex real-world dilemmas into structured, evidence-audited, and adaptable strategic decisions.

Unlike generic conversational chatbots that deliver superficial or agreeable answers, DECISIONFORGE deploys an ensemble of **specialized autonomous research agents** that independently investigate competing alternatives, actively challenge their own findings through an adversarial **Critic Agent**, verify empirical claims against retrieved source documents, evaluate trade-offs with deterministic multi-criteria decision analysis (MCDA), and simulate hypothetical scenarios to discover what assumptions would flip the final recommendation.

---

## 2. Key Architecture & The Multi-Agent Pipeline

```
                       USER QUESTION
                             │
                             ▼
                   RESEARCH PLANNER AGENT
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
    LITERATURE AGENT    DATA AGENT      MARKET AGENT
   (Peer-reviewed)     (LCOE/Capex)    (Vendor/Scale)
            │                │                │
            └────────────────┼────────────────┘
                             ▼
                    IMPACT RESEARCH AGENT
                   (Environmental/Lifecycle)
                             │
                             ▼
                     CRITIC AGENT ★
              (Adversarial Stress-Testing)
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   EVIDENCE VERIFICATION            CONTRADICTION FINDER
   (Text-to-Claim Audit)          (Methodological Splits)
            │                                 │
            └────────────────┬────────────────┘
                             ▼
                    DECISION ENGINE ★
               (Deterministic MCDA Scoring)
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
    EVIDENCE GRAPH                     SCENARIO LAB ★
  (@xyflow/react Graph)         ("What Would Change Our Mind?")
            │                                 │
            └────────────────┬────────────────┘
                             ▼
                 INTERACTIVE REPORT & PDF
```

### The 9 Autonomous Agents
1. **Research Planner Agent**: Interprets the user's question, decomposes it into competing alternatives (e.g. *Solar + Storage* vs. *Nuclear PHWRs*), defines initial research hypotheses, and establishes evaluation criteria.
2. **Literature Research Agent**: Searches peer-reviewed publications, institutional whitepapers, and scientific lifecycle assessments.
3. **Data Research Agent**: Gathers verifiable empirical metrics, capital expenditure statistics, LCOE auction tariffs, and capacity factors.
4. **Market Research Agent**: Investigates commercial adoption speed, private capital liquidity, and supply chain bottlenecks.
5. **Impact Research Agent**: Evaluates operational carbon emissions, land footprint, water consumption, and regulatory policy viability.
6. **Critic Agent (Adversarial Stress-Tester)**: The platform's critical differentiator. Explicitly charged with acting as devil's advocate—challenges optimistic premises, flags unstated failure modes, and searches for counter-evidence against the apparent front-runner.
7. **Evidence Verification Agent**: Audits cited claims against retrieved source texts, assigning quality badges:
   - `Verified support`
   - `Partial support`
   - `Contradictory evidence`
   - `Insufficient evidence`
   - `Unverified source`
8. **Contradiction Finder**: Maps methodological divergences, temporal shifts, and boundary condition differences between competing sources without forcing artificial consensus.
9. **Decision Engine**: Executes **deterministic Python calculations** rather than having an LLM hallucinate numbers:
   $$\text{Final Score} = \sum_{i=1}^n w_i \times s_i$$
   where criteria weights $w_i$ are normalized to 100% and customizable by the user.

---

## 3. Signature Feature — Scenario Lab ("What Would Change Our Mind?")

The core philosophical breakthrough of DECISIONFORGE is:

> *"We asked AI to make a recommendation. Then we asked it to prove itself wrong. Finally, we changed the assumptions and watched its recommendation adapt."*

Under **Scenario Lab**, users can interactively manipulate hypothetical variables:
- **Technology Equipment Cost Change** (-50% to +50%)
- **Deployment & Permitting Speed** (0.5x to 2.0x)
- **Baseload / 24x7 Grid Reliability Premium** (0% to 100%)
- **Financing Interest & Capex Overrun** (-30% to +50%)
- **Carbon Tax / Zero-Carbon Subsidy Support** (0% to 100%)

### What Happens When Variables Change:
1. Criteria are recalculated deterministically in Python.
2. Scores for all alternatives are re-computed.
3. The real-time Recharts comparison chart updates dynamically.
4. If a tipping point is crossed, the **DECISION FLIPPED** banner triggers with an explanation of the exact causal driver.
5. Built-in presets:
   - *Optimistic Tech Leap*
   - *Pessimistic Stress Test*
   - *High-Growth Baseload Crunch*
   - *Reset to Baseline*

---

## 4. Evidence Intelligence Graph

Built with **React Flow (`@xyflow/react`)**:
- Displays full evidentiary lineage:
  `Decision Root` ➔ `Strategic Alternatives` ➔ `Claims` ➔ `Primary Sources`
- Color-coded nodes by evidence verification status (Emerald for Verified, Rose for Critic Counter-Evidence, Amber for Partial).
- Clickable nodes with a slide-over inspection drawer showing excerpts, verification explanations, reliability ratings, and direct outbound links to source URLs.

---

## 5. Technology Stack

### Frontend
- **React 19** + **Vite 6** + **TypeScript**
- **Tailwind CSS v4** (Dark Intelligence Workspace theme `#080B14`, `#101626`, electric blue `#647CFF`, violet `#9B7CFF`)
- **React Flow (`@xyflow/react`)** for the interactive evidence network
- **Recharts** for real-time scenario sensitivity charts
- **Lucide React** for iconography
- **Server-Sent Events (SSE)** for real-time streaming workflow logs

### Backend
- **Python 3.11** + **FastAPI** + **Uvicorn**
- **Pydantic v2** for structured schema validation
- **SQLite 3** for persistent storage
- **ReportLab** for executive PDF report generation
- **Trafilatura** & **BeautifulSoup4** for article content extraction
- **GDELT 2.0 Document API** for global event and news discovery

### AI Inference
- **Ollama Client** supporting `qwen2.5:3b` (primary) and `qwen2.5:1.5b` (lightweight fallback).
- **Built-in Autonomous Heuristic Reasoning Engine** ensures zero downtime even when Ollama is offline or on machines without local LLM daemons running.

---

## 6. Installation & Launch Guide (Windows 11)

### Option A: 1-Click Launch (Recommended)
Simply double-click:
```bat
run.bat
```
This batch script will:
1. Verify the Python virtual environment and dependencies.
2. Initialize SQLite and seed the benchmark datasets.
3. Launch the FastAPI backend on `http://127.0.0.1:8000`.
4. Launch the Vite frontend on `http://localhost:5173`.
5. Automatically open your browser.

---

### Option B: Manual Launch

#### 1. Backend Setup
```powershell
cd backend
# Create virtual environment with uv or python
uv venv .venv --python 3.11
uv pip install -r ..\requirements.txt --python .venv\Scripts\python.exe

# Run database init and start server
$env:PYTHONPATH = "C:\Users\AYUSH\Downloads\DECISIONFORGE"
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Frontend Setup
```powershell
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 7. How to Demonstrate to Hackathon Judges

1. **Overview Dashboard**:
   - Show the benchmark investigations:
     - *"Should India prioritize nuclear energy or solar energy over the next 10 years?"*
     - *"Should India prioritize EV battery swapping or fast-charging infrastructure?"*
   - Review the metrics: Sources collected, claims verified, multi-agent status.

2. **Agent Workspace**:
   - Open an investigation and observe all 9 agents.
   - Highlight the **Critic Agent** card: show how it identified battery degradation tariff doubling and nuclear gestation delays.
   - Expand raw agent outputs to show the structured JSON evidence representation.

3. **Evidence Graph**:
   - Pan and zoom through the interactive React Flow graph.
   - Click a green node to inspect a verified claim; click a red node to inspect a Critic counter-argument.
   - Click "Open Verified URL" to demonstrate real citations.

4. **Scenario Lab ("The Grand Finale")**:
   - Show the baseline recommendation: *Solar Energy with Battery Storage* leads by +0.76 pts.
   - Click the preset **"High-Growth Baseload Crunch"** or slide *Baseload Reliability Premium* to 85%.
   - **Watch the DECISION FLIPPED banner illuminate**: Nuclear Power overtakes Solar, with a clear causal explanation.
   - Click **"Reset to Baseline"** to demonstrate deterministic reproducibility.

5. **Research Reports & PDF Export**:
   - Adjust criteria weights and click "Apply & Recalculate" to show live weight normalization.
   - Click **"Download Executive PDF Report"** to download the ReportLab publication-ready briefing.

---

## 8. Test Suite & Verification Results

DECISIONFORGE includes unit and integration tests covering deterministic calculations, weight normalization, scenario simulations, and PDF generation:

```powershell
pytest tests
```
**Results:** `5 passed in 3.04s` (100% pass rate).
