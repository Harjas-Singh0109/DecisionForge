import { 
  Investigation, Agent, EvidenceNetwork, DecisionResult, 
  ScenarioSimulationResult, SystemStatus, AdaptiveAnalysisResult
} from '../types';

const API_BASE = '/api';

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errMessage = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const err = await res.json();
      if (err.detail) errMessage = err.detail;
    } catch {
      // fallback
    }
    throw new Error(errMessage);
  }

  return res.json();
}

export const api = {
  getSystemStatus: () => fetchJson<SystemStatus>(`${API_BASE}/system/status`),

  seedDemo: () => fetchJson<{ status: string; message: string }>(`${API_BASE}/investigations/seed-demo`, {
    method: 'POST',
  }),

  listInvestigations: () => fetchJson<Investigation[]>(`${API_BASE}/investigations`),

  getInvestigation: (id: string) => fetchJson<Investigation>(`${API_BASE}/investigations/${id}`),

  createInvestigation: (data: { question: string; topic?: string; geographical_scope?: string; time_horizon?: string }) =>
    fetchJson<{ id: string; status: string; topic?: string; geographical_scope?: string; time_horizon?: string }>(`${API_BASE}/investigations`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  detectContext: (question: string) =>
    fetchJson<{ topic: string; geographical_scope: string; time_horizon: string }>(`${API_BASE}/investigations/detect-context`, {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),

  deleteInvestigation: (id: string) =>
    fetchJson<{ status: string; id: string }>(`${API_BASE}/investigations/${id}`, {
      method: 'DELETE',
    }),

  startInvestigation: (id: string) =>
    fetchJson<{ status: string; investigation_id: string }>(`${API_BASE}/investigations/${id}/start`, {
      method: 'POST',
    }),

  cancelInvestigation: (id: string) =>
    fetchJson<{ status: string }>(`${API_BASE}/investigations/${id}/cancel`, {
      method: 'POST',
    }),

  getInvestigationStatus: (id: string) =>
    fetchJson<{ investigation: Investigation; agents: Agent[] }>(`${API_BASE}/investigations/${id}/status`),

  getAgents: (id: string) => fetchJson<Agent[]>(`${API_BASE}/investigations/${id}/agents`),

  getEvidence: (id: string) => fetchJson<EvidenceNetwork>(`${API_BASE}/investigations/${id}/evidence`),

  getDecision: (id: string) => fetchJson<DecisionResult>(`${API_BASE}/investigations/${id}/decision`),

  getAdaptiveAnalysis: (id: string) => fetchJson<AdaptiveAnalysisResult>(`${API_BASE}/investigations/${id}/analysis`),

  recalculateDecision: (id: string, criteria: { name: string; weight: number; description?: string }[]) =>
    fetchJson<any>(`${API_BASE}/investigations/${id}/decision/recalculate`, {
      method: 'POST',
      body: JSON.stringify({ criteria }),
    }),

  simulateScenario: (id: string, assumptions: Record<string, number>, scenarioName: string = 'Custom Simulation') =>
    fetchJson<ScenarioSimulationResult>(`${API_BASE}/investigations/${id}/scenario`, {
      method: 'POST',
      body: JSON.stringify({ scenario_name: scenarioName, assumptions }),
    }),

  getScenarios: (id: string) =>
    fetchJson<{ saved_scenarios: any[]; presets: Record<string, any> }>(`${API_BASE}/investigations/${id}/scenarios`),

  getReport: (id: string) => fetchJson<any>(`${API_BASE}/investigations/${id}/report`),

  getExportPdfUrl: (id: string) => `${API_BASE}/investigations/${id}/export`,
};
