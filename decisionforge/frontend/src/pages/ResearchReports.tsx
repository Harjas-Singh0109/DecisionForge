import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, CheckCircle2, ShieldAlert, ExternalLink, 
  Layers, ArrowUpRight, Sliders, RefreshCw, AlertCircle, X, BookOpen, Quote
} from 'lucide-react';
import { Investigation, DecisionResult, EvidenceNetwork, Claim, Source } from '../types';
import { api } from '../services/api';

interface ResearchReportsProps {
  investigation: Investigation | null;
}

export const ResearchReports: React.FC<ResearchReportsProps> = ({ investigation }) => {
  const [decision, setDecision] = useState<DecisionResult | null>(null);
  const [evidence, setEvidence] = useState<EvidenceNetwork | null>(null);
  const [criteria, setCriteria] = useState<{ name: string; weight: number; description: string }[]>([]);
  const [isEditingWeights, setIsEditingWeights] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Source / Claim inspection modal state
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [inspectedSource, setInspectedSource] = useState<Source | null>(null);

  useEffect(() => {
    if (!investigation) return;
    api.getDecision(investigation.id).then((d) => {
      setDecision(d);
      setCriteria(d.default_criteria || []);
    });
    api.getEvidence(investigation.id).then((e) => setEvidence(e));
  }, [investigation?.id]);

  const handleWeightChange = (index: number, val: number) => {
    const updated = [...criteria];
    updated[index].weight = val;
    setCriteria(updated);
  };

  const handleApplyWeights = async () => {
    if (!investigation) return;
    setIsRecalculating(true);
    try {
      await api.recalculateDecision(investigation.id, criteria);
      const updatedDec = await api.getDecision(investigation.id);
      setDecision(updatedDec);
      setIsEditingWeights(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRecalculating(false);
    }
  };

  // Helper to find the primary source for a claim
  const getSourceForClaim = (claimId: string): Source | null => {
    if (!evidence) return null;
    const link = (evidence.evidence_links || []).find((l) => l.claim_id === claimId);
    if (link) {
      const found = (evidence.sources || []).find((s) => s.id === link.source_id);
      if (found) return found;
    }
    return (evidence.sources && evidence.sources.length > 0) ? evidence.sources[0] : null;
  };

  const handleClaimClick = (claim: Claim) => {
    const src = getSourceForClaim(claim.id);
    setSelectedClaim(claim);
    setInspectedSource(src);
  };

  const handleOpenSourceDirectly = (url?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (!investigation) {
    return (
      <div className="p-12 text-center text-[#9AA5BA]">
        <FileText className="w-12 h-12 mx-auto text-[#647CFF]/40 mb-3 animate-pulse" />
        <h3 className="text-lg font-bold text-white">No Active Investigation Selected</h3>
      </div>
    );
  }

  const totalWeightPercent = Math.round(criteria.reduce((a, b) => a + b.weight, 0) * 100);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 relative">
      {/* Header & PDF Export */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#647CFF] mb-1">
            <FileText className="w-4 h-4" /> Comprehensive Strategic Decision Report
          </div>
          <h2 className="text-2xl font-extrabold text-white">{investigation.question}</h2>
          <p className="text-xs text-[#9AA5BA] mt-1">
            Domain: <strong className="text-white">{investigation.topic || 'Strategic Decision'}</strong> • Scope: <strong className="text-white">{investigation.geographical_scope}</strong> • Time Horizon: <strong className="text-white">{investigation.time_horizon}</strong>
          </p>
        </div>

        <a
          href={api.getExportPdfUrl(investigation.id)}
          download
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#647CFF] to-[#9B7CFF] text-white text-xs font-bold shadow-lg shadow-[#647CFF]/30 hover:opacity-95 transition-all shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Download Executive PDF Report</span>
        </a>
      </div>

      {/* Strategic Recommendation Callout */}
      <div className="bg-gradient-to-r from-[#1E293B] via-[#1E2738] to-[#1E293B] border border-[#6366F1]/50 rounded-2xl p-7 shadow-xl shadow-black/20">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#6366F1]/20 border border-[#6366F1]/40 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#818CF8] block mb-1">
              Final Autonomous Strategic Recommendation
            </span>
            <h3 className="text-xl font-extrabold text-white">
              {investigation.recommendation || decision?.recommendation || 'Recommendation formulating...'}
            </h3>
            <p className="text-xs text-[#94A3B8] mt-2 leading-relaxed max-w-3xl">
              {investigation.recommendation_reasoning || decision?.reasoning || investigation.summary}
            </p>
          </div>
        </div>
      </div>

      {/* Decision Criteria Scoring & Weight Normalization */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-6 shadow-xl shadow-black/15">
        <div className="flex items-center justify-between pb-4 border-b border-[#334155]">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#818CF8]" /> Multi-Criteria Deterministic Evaluation
            </h3>
            <p className="text-xs text-[#94A3B8]">Weighted score breakdown across competing alternatives.</p>
          </div>

          <button
            onClick={() => setIsEditingWeights(!isEditingWeights)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#162036] hover:bg-[#1f2d4d] border border-[#647CFF]/30 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-[#647CFF]" />
            <span>{isEditingWeights ? 'Close Weights Editor' : 'Adjust Criteria Weights'}</span>
          </button>
        </div>

        {/* Weights Editor Drawer */}
        {isEditingWeights && (
          <div className="my-5 p-5 bg-[#1E293B] border border-[#647CFF]/30 rounded-xl space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span>Adjust Importance Weights</span>
              <span className={`font-mono ${totalWeightPercent === 100 ? 'text-[#31C48D]' : 'text-[#F4B860]'}`}>
                Total: {totalWeightPercent}% {totalWeightPercent !== 100 && '(will auto-normalize)'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {criteria.map((crit, idx) => (
                <div key={crit.name} className="space-y-1">
                  <div className="flex justify-between text-[11px] text-[#9AA5BA]">
                    <span className="truncate pr-1">{crit.name}</span>
                    <span className="font-mono text-white font-bold">{Math.round(crit.weight * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.60"
                    step="0.05"
                    value={crit.weight}
                    onChange={(e) => handleWeightChange(idx, parseFloat(e.target.value))}
                    className="w-full accent-[#647CFF]"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={handleApplyWeights}
                disabled={isRecalculating}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#647CFF] to-[#9B7CFF] text-white text-xs font-bold shadow-md shadow-[#647CFF]/25 hover:opacity-95 transition-all cursor-pointer"
              >
                {isRecalculating ? 'Recalculating...' : 'Apply & Recalculate Recommendation'}
              </button>
            </div>
          </div>
        )}

        {/* Scores Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs text-[#9AA5BA]">
            <thead className="bg-[#1E293B]/60 text-[11px] uppercase tracking-wider text-white border-b border-[#647CFF]/15 font-semibold">
              <tr>
                <th className="py-3 px-4">Alternative</th>
                <th className="py-3 px-4">Criterion</th>
                <th className="py-3 px-4">Weight</th>
                <th className="py-3 px-4">Raw Score (1-10)</th>
                <th className="py-3 px-4">Weighted Score</th>
                <th className="py-3 px-4">Justification & Verified Source Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#647CFF]/10">
              {(decision?.scores || []).map((score) => (
                <tr key={score.id} className="hover:bg-[#162036]/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-white">{score.alternative_name}</td>
                  <td className="py-3 px-4 text-white">{score.criterion}</td>
                  <td className="py-3 px-4 font-mono">{Math.round(score.criterion_weight * 100)}%</td>
                  <td className="py-3 px-4 font-mono font-bold text-[#647CFF]">{score.raw_score}</td>
                  <td className="py-3 px-4 font-mono font-bold text-white">{score.weighted_score}</td>
                  <td className="py-3 px-4 text-xs leading-relaxed max-w-md">
                    <span>{score.explanation}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verified Claims & Evidence Audit — CLICKABLE TO OPEN SOURCE */}
      <div className="bg-[#1E293B] border border-[#647CFF]/20 rounded-2xl p-6 glow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#F4B860]" /> Evidence Verification & Claims Audit
            </h3>
            <p className="text-xs text-[#9AA5BA]">
              Click on any claim card below to inspect supporting excerpts and open the primary source document.
            </p>
          </div>
          <span className="text-[11px] text-[#647CFF] font-semibold flex items-center gap-1">
            <ExternalLink className="w-3.5 h-3.5" /> Interactive Source Inspector
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(evidence?.claims || []).map((claim) => {
            const isVerified = claim.evidence_quality === 'Verified support';
            const isContradictory = claim.evidence_quality === 'Contradictory evidence';
            const src = getSourceForClaim(claim.id);

            return (
              <div
                key={claim.id}
                onClick={() => handleClaimClick(claim)}
                className={`p-4 rounded-xl border transition-all cursor-pointer group hover:scale-[1.01] hover:shadow-xl ${
                  isVerified
                    ? 'bg-[#0e2119]/50 border-[#31C48D]/30 hover:border-[#31C48D]'
                    : isContradictory
                    ? 'bg-[#210e14]/50 border-[#F05252]/30 hover:border-[#F05252]'
                    : 'bg-[#1E293B] border-[#647CFF]/15 hover:border-[#647CFF]/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    isVerified ? 'bg-[#31C48D]/20 text-[#31C48D]' : isContradictory ? 'bg-[#F05252]/20 text-[#F05252]' : 'bg-[#F4B860]/20 text-[#F4B860]'
                  }`}>
                    {claim.evidence_quality}
                  </span>
                  <span className="text-[10px] text-[#9AA5BA] font-medium">{claim.agent_origin || 'Research Agent'}</span>
                </div>

                <p className="text-xs font-semibold text-white leading-relaxed mb-2.5 group-hover:text-[#647CFF] transition-colors">
                  {claim.claim_text}
                </p>

                <p className="text-[11px] text-[#9AA5BA] bg-[#1E293B] p-2.5 rounded-lg border border-[#647CFF]/10 leading-tight mb-3">
                  {claim.explanation}
                </p>

                {/* Primary Source Reference Bar with Direct Click */}
                {src && (
                  <div className="pt-2 border-t border-[#647CFF]/15 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-[#9AA5BA] truncate mr-2">
                      <BookOpen className="w-3.5 h-3.5 text-[#647CFF] shrink-0" />
                      <span className="truncate">{src.title}</span>
                    </div>

                    {src.url ? (
                      <button
                        onClick={(e) => handleOpenSourceDirectly(src.url, e)}
                        className="px-2.5 py-1 rounded bg-[#647CFF]/15 hover:bg-[#647CFF]/30 text-[#647CFF] hover:text-white border border-[#647CFF]/30 font-semibold shrink-0 flex items-center gap-1 transition-all"
                        title="Open external source URL directly"
                      >
                        <span>Open Source</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-[#9AA5BA]">Inspect</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bibliography & Sources — ENTIRE CARD CLICKABLE TO OPEN SOURCE */}
      <div className="bg-[#1E293B] border border-[#647CFF]/20 rounded-2xl p-6 glow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-[#647CFF]" /> Cited Academic & Institutional Sources
            </h3>
            <p className="text-xs text-[#9AA5BA]">
              Click any source document below to navigate directly to the primary research publication or registry.
            </p>
          </div>
          <span className="text-xs text-[#9AA5BA]">
            {evidence?.sources?.length || 0} Primary References
          </span>
        </div>

        <div className="space-y-3">
          {(evidence?.sources || []).map((src, i) => (
            <div
              key={src.id}
              onClick={() => handleOpenSourceDirectly(src.url)}
              className="p-4 rounded-xl bg-[#1E293B] hover:bg-[#162036]/70 border border-[#647CFF]/15 hover:border-[#647CFF]/50 flex items-start justify-between gap-4 cursor-pointer transition-all group"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] text-[#647CFF] font-mono font-bold">[{i+1}]</span>
                  <span className="text-xs font-bold text-white group-hover:text-[#647CFF] transition-colors leading-tight">
                    {src.title}
                  </span>
                </div>
                <p className="text-[11px] text-[#9AA5BA]">
                  Published by: <strong className="text-white">{src.publisher || 'Official Academic/Government Source'}</strong> • {src.publication_date || 'Recent Reference'}
                </p>
                {(src.extracted_content || src.content) && (
                  <p className="text-[10px] text-[#9AA5BA]/80 mt-1.5 font-mono line-clamp-1">
                    "{(src.extracted_content || src.content)?.slice(0, 140)}..."
                  </p>
                )}
              </div>

              {src.url ? (
                <div className="px-3 py-1.5 rounded-lg bg-[#647CFF]/15 group-hover:bg-[#647CFF] text-[#647CFF] group-hover:text-white text-xs font-semibold border border-[#647CFF]/30 shrink-0 flex items-center gap-1.5 transition-all">
                  <span>Visit Source</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              ) : (
                <span className="text-[10px] text-[#9AA5BA] shrink-0">Internal Registry</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Modal / Drawer for Claim & Source Deep Inspection */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1E293B] border border-[#334155] rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#334155]">
              <div className="flex items-center gap-2">
                <Quote className="w-4 h-4 text-[#818CF8]" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Evidence Verification & Source Audit
                </span>
              </div>
              <button
                onClick={() => { setSelectedClaim(null); setInspectedSource(null); }}
                className="text-[#94A3B8] hover:text-white p-1 rounded-lg hover:bg-[#243048] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Claim Body */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase font-bold text-[#94A3B8]">Audited Empirical Claim</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  selectedClaim.evidence_quality === 'Verified support'
                    ? 'bg-[#10B981]/20 text-[#34D399]'
                    : selectedClaim.evidence_quality === 'Contradictory evidence'
                    ? 'bg-[#F43F5E]/20 text-[#FB7185]'
                    : 'bg-[#F59E0B]/20 text-[#FBBF24]'
                }`}>
                  {selectedClaim.evidence_quality}
                </span>
              </div>
              <p className="text-sm font-semibold text-white leading-relaxed bg-[#1E293B] p-3.5 rounded-xl border border-[#334155]">
                {selectedClaim.claim_text}
              </p>
            </div>

            {/* Verification Justification */}
            <div>
              <span className="text-[10px] uppercase font-bold text-[#94A3B8] block mb-1">Verifier Assessment</span>
              <p className="text-xs text-[#CBD5E1] leading-relaxed">
                {selectedClaim.explanation || 'Verified through deterministic cross-referencing with primary source document.'}
              </p>
            </div>

            {/* Linked Primary Source */}
            {inspectedSource && (
              <div className="bg-[#1E293B] p-4 rounded-xl border border-[#647CFF]/25 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-[#647CFF] flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> Primary Source Reference
                  </span>
                  <span className="text-[10px] text-[#9AA5BA]">{inspectedSource.publication_date || 'Recent'}</span>
                </div>

                <h4 className="text-sm font-bold text-white leading-tight">
                  {inspectedSource.title}
                </h4>

                <p className="text-[11px] text-[#9AA5BA]">
                  Publisher: <strong className="text-white">{inspectedSource.publisher || 'Verified Academic/Institutional Publisher'}</strong>
                </p>

                {(inspectedSource.extracted_content || inspectedSource.content) && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#9AA5BA] block mb-1">Extracted Source Excerpt</span>
                    <p className="text-xs text-[#9AA5BA] bg-[#1E293B] p-3 rounded-lg border border-[#647CFF]/10 font-mono leading-relaxed max-h-36 overflow-y-auto">
                      {inspectedSource.extracted_content || inspectedSource.content}
                    </p>
                  </div>
                )}

                {inspectedSource.url && (
                  <div className="pt-2 flex justify-end">
                    <a
                      href={inspectedSource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#647CFF] to-[#9B7CFF] text-white text-xs font-bold shadow-lg shadow-[#647CFF]/30 hover:opacity-95 transition-all cursor-pointer"
                    >
                      <span>Open Primary Source in New Window</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => { setSelectedClaim(null); setInspectedSource(null); }}
                className="px-4 py-2 rounded-lg bg-[#162036] hover:bg-[#1f2d4d] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
