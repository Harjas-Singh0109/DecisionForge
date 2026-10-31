export interface Investigation {
  id: string;
  question: string;
  topic?: string;
  geographical_scope?: string;
  time_horizon?: string;
  status: 'draft' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  summary?: string;
  recommendation?: string;
  recommendation_reasoning?: string;
  created_at: string;
  updated_at: string;
  source_count?: number;
  claim_count?: number;
  verified_claim_count?: number;
}

export interface Agent {
  id: string;
  investigation_id: string;
  agent_name: string;
  status: 'waiting' | 'planning' | 'researching' | 'analyzing' | 'challenging' | 'verifying' | 'completed' | 'failed';
  current_task?: string;
  output?: string;
  findings_count: number;
  started_at?: string;
  completed_at?: string;
}

export interface Alternative {
  id: string;
  investigation_id: string;
  name: string;
  description?: string;
}

export interface Source {
  id: string;
  investigation_id: string;
  title: string;
  url: string;
  publisher?: string;
  publication_date?: string;
  retrieved_at: string;
  extracted_content?: string;
  content?: string;
  source_type: string;
  reliability_score: number;
}

export interface Claim {
  id: string;
  investigation_id: string;
  alternative_id?: string;
  claim_text: string;
  evidence_quality: 'Verified support' | 'Partial support' | 'Contradictory evidence' | 'Insufficient evidence' | 'Unverified source';
  verification_status: 'verified' | 'partial' | 'disputed' | 'unverified' | 'pending';
  explanation?: string;
  agent_origin?: string;
}

export interface EvidenceLink {
  id: string;
  claim_id: string;
  source_id: string;
  relationship_type: 'supporting' | 'contradicting' | 'context';
  supporting_excerpt?: string;
  verification_notes?: string;
}

export interface EvidenceNetwork {
  alternatives: Alternative[];
  claims: Claim[];
  sources: Source[];
  evidence_links: EvidenceLink[];
}

export interface ScoreItem {
  id: string;
  investigation_id: string;
  alternative_id: string;
  alternative_name?: string;
  criterion: string;
  raw_score: number;
  criterion_weight: number;
  weighted_score: number;
  explanation?: string;
}

export interface DecisionResult {
  recommendation?: string;
  reasoning?: string;
  alternatives: Alternative[];
  scores: ScoreItem[];
  grouped_scores: Record<string, ScoreItem[]>;
  default_criteria: { name: string; weight: number; description: string }[];
}

export interface ScenarioSimulationResult {
  original_preferred: string;
  scenario_preferred: string;
  decision_flipped: boolean;
  original_scores: Record<string, number>;
  scenario_scores: Record<string, number>;
  score_difference: number;
  results: {
    alternative_id: string;
    alternative_name: string;
    total_score: number;
    original_score: number;
    score_delta: number;
    scores_by_criterion: {
      criterion: string;
      raw_score: number;
      weight: number;
      weighted_score: number;
      delta: number;
    }[];
  }[];
  changed_assumptions: Record<string, number>;
  most_influential_variables: string[];
  explanation: string;
}

export interface SystemStatus {
  status: string;
  system: string;
  llm: {
    status: string;
    available_models: string[];
    primary_model_loaded: boolean;
    engine: string;
  };
  search_engine: string;
}

export interface AdaptiveAnalysisResult {
  archetype: 'energy_infrastructure' | 'business_startup' | 'technology_computing' | 'science_clinical' | 'defense_geopolitics' | 'philosophy_governance' | 'macroeconomics_policy' | 'general_strategic';
  archetype_label: string;
  badge_color: string;
  headline: string;
  key_metrics: {
    label: string;
    alt1_val: string;
    alt2_val: string;
    advantage: string;
    unit: string;
    confidence: string;
  }[];
  radar_dimensions: {
    dimension: string;
    alt1: number;
    alt2: number;
  }[];
  projection_timeline: Record<string, any>[];
  analytical_breakdown: {
    title: string;
    summary: string;
    trade_offs: {
      parameter: string;
      winner: string;
      note: string;
    }[];
  };
  risk_profile: {
    risk: string;
    severity: 'High' | 'Medium' | 'Low';
    likelihood: 'High' | 'Medium' | 'Low';
    mitigation: string;
  }[];
}
