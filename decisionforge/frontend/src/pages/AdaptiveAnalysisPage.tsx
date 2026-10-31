import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Layers, ShieldAlert, TrendingUp, AlertTriangle, 
  ExternalLink, CheckCircle2, ChevronRight, BarChart3, 
  Compass, Zap, Server, Activity, Shield, ArrowUpRight, Filter, Info, Eye
} from 'lucide-react';
import { 
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip, 
  Legend, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { Investigation, AdaptiveAnalysisResult, EvidenceNetwork } from '../types';
import { api } from '../services/api';

interface AdaptiveAnalysisProps {
  investigation: Investigation | null;
  onNavigateTab?: (tab: string) => void;
}

export const AdaptiveAnalysisPage: React.FC<AdaptiveAnalysisProps> = ({ 
  investigation,
  onNavigateTab 
}) => {
  const [analysis, setAnalysis] = useState<AdaptiveAnalysisResult | null>(null);
  const [evidence, setEvidence] = useState<EvidenceNetwork | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<any | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'verified' | 'risks'>('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!investigation) return;
    setIsLoading(true);
    Promise.all([
      api.getAdaptiveAnalysis(investigation.id),
      api.getEvidence(investigation.id)
    ])
      .then(([analysisData, evidenceData]) => {
        setAnalysis(analysisData);
        setEvidence(evidenceData);
      })
      .catch((err) => console.error('Failed to load adaptive analysis:', err))
      .finally(() => setIsLoading(false));
  }, [investigation?.id]);

  if (!investigation) {
    return (
      <div className="p-16 text-center text-[#94A3B8]">
        <Layers className="w-12 h-12 mx-auto text-[#4F6BFF]/40 mb-3 animate-pulse" />
        <h3 className="text-lg font-bold text-white">No Active Investigation Selected</h3>
        <p className="text-xs text-[#94A3B8] mt-1">Select an investigation to load its adaptive intelligence workspace.</p>
      </div>
    );
  }

  const getArchetypeIcon = (archetype?: string) => {
    switch (archetype) {
      case 'energy_infrastructure': return Zap;
      case 'technology_computing': return Server;
      case 'science_clinical': return Activity;
      case 'defense_geopolitics': return Shield;
      case 'business_startup': return TrendingUp;
      default: return Compass;
    }
  };

  const ArchetypeIcon = getArchetypeIcon(analysis?.archetype);

  const verifiedClaims = (evidence?.claims || []).filter(c => c.evidence_quality === 'Verified support');
  const contradictoryClaims = (evidence?.claims || []).filter(c => c.evidence_quality === 'Contradictory evidence');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Dynamic Investigation-Specific Header */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-6 shadow-xl shadow-black/15 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <div 
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
              style={{
                backgroundColor: `${analysis?.badge_color || '#6366F1'}15`,
                borderColor: `${analysis?.badge_color || '#6366F1'}40`,
                color: analysis?.badge_color || '#818CF8'
              }}
            >
              <ArchetypeIcon className="w-3.5 h-3.5" />
              <span>{analysis?.archetype_label || 'Strategic Decision Analysis'}</span>
            </div>

            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30 font-semibold">
              {verifiedClaims.length} Empirical Benchmarks Verified
            </span>

            {contradictoryClaims.length > 0 && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#F43F5E]/15 text-[#FB7185] border border-[#F43F5E]/30 font-semibold">
                {contradictoryClaims.length} Contradictions Detected
              </span>
            )}
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight">
            {investigation.question}
          </h1>

          <p className="text-xs text-[#94A3B8] flex flex-wrap items-center gap-3">
            <span>Scope: <strong className="text-white">{investigation.geographical_scope || 'National'}</strong></span>
            <span>•</span>
            <span>Horizon: <strong className="text-white">{investigation.time_horizon || '10 Years'}</strong></span>
            <span>•</span>
            <span>Status: <strong className="text-[#34D399] uppercase">{investigation.status}</strong></span>
          </p>
        </div>

        {/* Strategic Takeaway / Leading Alternative Callout */}
        <div className="p-4 rounded-xl bg-[#243048] border border-[#334155] md:max-w-xs shrink-0 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block">
            Leading Alternative Hypothesis
          </span>
          <div className="text-sm font-bold text-white flex items-center gap-1.5 text-[#34D399]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="truncate">{investigation.recommendation || 'Analyzing alternatives...'}</span>
          </div>
          <p className="text-[11px] text-[#94A3B8] line-clamp-2 leading-tight">
            {investigation.recommendation_reasoning || 'Synthesized across verified multi-criteria empirical trade-offs.'}
          </p>
        </div>
      </div>

      {/* Domain-Specific Key Metrics Strip */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#818CF8]" />
            Domain Key Indicators & Empirical Benchmarks
          </h2>
          <span className="text-xs text-[#94A3B8] flex items-center gap-1">
            <Info className="w-3.5 h-3.5" /> Click any metric for evidence audit
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(analysis?.key_metrics || []).map((m, idx) => (
            <div 
              key={idx}
              onClick={() => setSelectedMetric(m)}
              className="p-5 rounded-2xl bg-[#1E293B] hover:bg-[#243048] border border-[#334155] hover:border-[#6366F1]/50 transition-all cursor-pointer group shadow-lg"
            >
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#94A3B8] mb-2">
                <span className="truncate pr-1">{m.unit}</span>
                <span className="text-[#34D399] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  Inspect <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>

              <h4 className="text-xs font-bold text-white group-hover:text-[#818CF8] transition-colors line-clamp-1 mb-3">
                {m.label}
              </h4>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#94A3B8] truncate pr-2">Option A</span>
                  <span className="font-mono font-bold text-white">{m.alt1_val}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#94A3B8] truncate pr-2">Option B</span>
                  <span className="font-mono font-bold text-white">{m.alt2_val}</span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#1E293B] flex items-center justify-between text-[10px]">
                <span className="text-[#94A3B8]">Advantage:</span>
                <span className="font-semibold text-[#10B981] truncate pl-1">{m.advantage}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visual Analytics Grid: Radar Comparative Chart + Projection Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Trade-off Chart */}
        <div className="p-6 rounded-2xl bg-[#1E293B] border border-[#1E293B] glow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#8B5CF6]" /> Multi-Factor Comparative Trade-Off Radar
              </h3>
              <p className="text-xs text-[#94A3B8]">Normalized 0-100 score distribution across key domain requirements.</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={analysis?.radar_dimensions || []}>
                <PolarGrid stroke="#1E293B" />
                <PolarAngleAxis dataKey="dimension" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <PolarRadiusAxis stroke="#1E293B" angle={30} domain={[0, 100]} />
                <Radar name="Option A" dataKey="alt1" stroke="#4F6BFF" fill="#4F6BFF" fillOpacity={0.35} />
                <Radar name="Option B" dataKey="alt2" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic Trajectory / Growth Curve */}
        <div className="p-6 rounded-2xl bg-[#1E293B] border border-[#334155] shadow-lg shadow-black/15 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#10B981]" /> Strategic Trajectory & Scale Modeling
              </h3>
              <p className="text-xs text-[#94A3B8]">Dynamic progression curves under baseline historical rates.</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analysis?.projection_timeline || []}>
                <defs>
                  <linearGradient id="colorAlt1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorAlt2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#fff' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                {analysis?.projection_timeline && analysis.projection_timeline.length > 0 && (
                  <>
                    <Area 
                      type="monotone" 
                      dataKey={Object.keys(analysis.projection_timeline[0])[1]} 
                      name="Primary Trajectory (A)" 
                      stroke="#6366F1" 
                      fillOpacity={1} 
                      fill="url(#colorAlt1)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey={Object.keys(analysis.projection_timeline[0])[2]} 
                      name="Comparative Trajectory (B)" 
                      stroke="#10B981" 
                      fillOpacity={1} 
                      fill="url(#colorAlt2)" 
                    />
                  </>
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Strategic Trade-Off Breakdown & Core Synthesis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#1E293B] border border-[#334155] shadow-lg shadow-black/15 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#334155]">
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                {analysis?.analytical_breakdown.title || 'Strategic Trade-Off Analysis'}
              </h3>
              <p className="text-xs text-[#94A3B8]">Divergence points where evidence confirms structural trade-offs.</p>
            </div>
          </div>

          <p className="text-xs text-[#CBD5E1] leading-relaxed bg-[#243048] p-4 rounded-xl border border-[#334155]">
            {analysis?.analytical_breakdown.summary}
          </p>

          <div className="space-y-3 pt-2">
            {(analysis?.analytical_breakdown.trade_offs || []).map((to, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-[#243048] border border-[#334155] flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#818CF8] block">{to.parameter}</span>
                  <p className="text-xs text-white leading-relaxed">{to.note}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 shrink-0">
                  Advantage: {to.winner}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk & Vulnerability Matrix */}
        <div className="p-6 rounded-2xl bg-[#1E293B] border border-[#334155] shadow-lg shadow-black/15 space-y-4">
          <div className="pb-3 border-b border-[#334155]">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#F43F5E]" /> Critic Risk Assessment
            </h3>
            <p className="text-xs text-[#94A3B8]">Unstated failure points surfaced by the Devil's Advocate Critic Agent.</p>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {(analysis?.risk_profile || []).map((r, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-[#243048] border border-[#334155] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white leading-tight">{r.risk}</span>
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                    r.severity === 'High' ? 'bg-[#F43F5E]/20 text-[#FB7185]' : 'bg-[#F59E0B]/20 text-[#FBBF24]'
                  }`}>
                    {r.severity} Severity
                  </span>
                </div>
                <p className="text-[11px] text-[#CBD5E1] leading-tight">
                  <strong className="text-white">Mitigation: </strong>{r.mitigation}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Quick-Action footer */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#1E293B] via-[#243048] to-[#1E293B] border border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white">Explore What-If Scenarios</h4>
          <p className="text-xs text-[#94A3B8]">Simulate sensitivity shifts in the Scenario Lab to discover what assumptions flip this decision.</p>
        </div>

        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab('scenario')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4F6BFF] to-[#8B5CF6] hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-[#4F6BFF]/25 flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <span>Launch Scenario Simulator</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Metric Detail Modal */}
      {selectedMetric && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1E293B] border border-[#2E3D60] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl glow-card">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#4F6BFF]">
                <BarChart3 className="w-4 h-4" /> Empirical Indicator Inspection
              </div>
              <button 
                onClick={() => setSelectedMetric(null)} 
                className="text-[#94A3B8] hover:text-white text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <h3 className="text-base font-extrabold text-white">{selectedMetric.label}</h3>

            <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#111726] rounded-xl border border-[#1E293B]">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#94A3B8] block mb-1">Option A</span>
                <span className="text-sm font-mono font-bold text-white">{selectedMetric.alt1_val}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#94A3B8] block mb-1">Option B</span>
                <span className="text-sm font-mono font-bold text-white">{selectedMetric.alt2_val}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-[#94A3B8] block mb-1">Evidentiary Confidence</span>
              <p className="text-xs text-[#CBD5E1] bg-[#060810] p-3 rounded-lg border border-[#1E293B]">
                {selectedMetric.confidence}
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedMetric(null)}
                className="px-4 py-2 rounded-lg bg-[#111726] hover:bg-[#1E293B] text-white text-xs font-bold transition-all cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
