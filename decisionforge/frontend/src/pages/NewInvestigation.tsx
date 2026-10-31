import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Play, Lightbulb, Compass, Clock, Globe, ArrowRight, 
  Sliders, ChevronDown, ChevronUp, CheckCircle, Search
} from 'lucide-react';
import { api } from '../services/api';

interface NewInvestigationProps {
  onInvestigationCreated: (id: string) => void;
}

// Client-side instant heuristics for zero-latency UI preview
function instantDetectContext(q: string) {
  const qLower = q.toLowerCase();
  
  // Topic
  let topic = 'Strategic Technology & Policy Assessment';
  if (/nuclear|solar|wind|hydrogen|grid|clean energy|electricity|power plant|fossil|coal|carbon|baseload/.test(qLower)) {
    topic = 'Clean Energy & Grid Decarbonization';
  } else if (/ev|electric vehicle|battery|charging|swapping|fleet|transit|mobility/.test(qLower)) {
    topic = 'Urban Mobility & Electrification';
  } else if (/defense|drone|swarm|laser|military|weapon|warfare|interceptor|air defense|missile/.test(qLower)) {
    topic = 'Defense Technology & Autonomous Systems';
  } else if (/health|clinical|hospital|medical|drug|fda|biotech|patient/.test(qLower)) {
    topic = 'Healthcare Technology & Clinical Systems';
  } else if (/space|rocket|orbit|satellite|propulsion|launch|methane/.test(qLower)) {
    topic = 'Aerospace Engineering & Space Infrastructure';
  } else if (/ai|llm|model|algorithm|software|cloud|compute|gpu/.test(qLower)) {
    topic = 'Artificial Intelligence & Computational Infrastructure';
  } else if (/finance|crypto|banking|currency|fintech|economic|gdp|inflation/.test(qLower)) {
    topic = 'Macroeconomics & Financial Systems';
  } else if (/water|agriculture|farming|crop|food/.test(qLower)) {
    topic = 'Agriculture & Resource Security';
  }

  // Geographical Scope
  let geo = 'National / Strategic Grid';
  if (/\bindia\b/.test(qLower)) geo = 'India (National Grid & Policy)';
  else if (/\b(us|usa|united states|america)\b/.test(qLower)) geo = 'United States (Federal & State)';
  else if (/\b(china)\b/.test(qLower)) geo = 'China (National Strategic Plan)';
  else if (/\b(europe|eu|european union)\b/.test(qLower)) geo = 'European Union (EU Regulatory Scope)';
  else if (/\b(uk|britain|united kingdom)\b/.test(qLower)) geo = 'United Kingdom (National Framework)';
  else if (/\b(japan)\b/.test(qLower)) geo = 'Japan (National Policy)';
  else if (/\b(germany)\b/.test(qLower)) geo = 'Germany (Federal Energy Transition)';
  else if (/\b(australia)\b/.test(qLower)) geo = 'Australia (Commonwealth Scope)';
  else if (/\b(global|worldwide|international)\b/.test(qLower)) geo = 'Global Multi-Region';

  // Time Horizon
  let time = '10 Years (2025-2035)';
  const yrMatch = qLower.match(/(\d+)\s*(?:years?|yrs?)/);
  if (yrMatch) {
    time = `${yrMatch[1]} Years`;
  } else if (/20\d\d\s*[-–to]\s*20\d\d/.test(qLower)) {
    const span = qLower.match(/20\d\d\s*[-–to]\s*20\d\d/)![0];
    time = `Target Horizon (${span})`;
  } else if (/5 year|five year/.test(qLower)) {
    time = '5 Years (2025-2030)';
  } else if (/near-term|immediate/.test(qLower)) {
    time = '3-5 Years (Near-Term Execution)';
  } else if (/long-term|2050/.test(qLower)) {
    time = '20-25 Years (Net-Zero 2050 Horizon)';
  }

  return { topic, geo, time };
}

export const NewInvestigation: React.FC<NewInvestigationProps> = ({ onInvestigationCreated }) => {
  const [question, setQuestion] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [customGeo, setCustomGeo] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-detected state
  const [detected, setDetected] = useState({
    topic: 'Clean Energy & Grid Decarbonization',
    geo: 'India (National Grid & Policy)',
    time: '10 Years (2025-2035)'
  });

  const suggestedExamples = [
    {
      q: 'Should India prioritize nuclear energy or solar energy over the next 10 years?',
      topic: 'Clean Energy & Grid Decarbonization',
      geo: 'India (National Grid & Policy)',
      time: '10 Years (2025-2035)'
    },
    {
      q: 'Should India prioritize EV battery swapping or fast-charging infrastructure?',
      topic: 'Urban Mobility & Fleet Decarbonization',
      geo: 'Metropolitan & Highway Transit',
      time: '7 Years (2025-2032)'
    },
    {
      q: 'Should healthcare systems adopt open-source local clinical AI models or proprietary cloud LLM APIs?',
      topic: 'Healthcare Technology & Patient Privacy',
      geo: 'Global / Regulatory Compliance',
      time: '5 Years'
    },
    {
      q: 'Should commercial space transport prioritize reusable methane rocket stages or hydrogen-based propulsion?',
      topic: 'Aerospace Engineering & Launch Economics',
      geo: 'Global Space Industry',
      time: '10 Years'
    }
  ];

  // Auto-detect as question changes
  useEffect(() => {
    if (!question.trim()) return;
    const instant = instantDetectContext(question);
    setDetected({
      topic: instant.topic,
      geo: instant.geo,
      time: instant.time
    });

    // Debounced call to backend for model-assisted detection if available
    const timer = setTimeout(() => {
      api.detectContext(question)
        .then((res) => {
          if (res && res.topic && res.geographical_scope) {
            setDetected({
              topic: res.topic,
              geo: res.geographical_scope,
              time: res.time_horizon || instant.time
            });
          }
        })
        .catch(() => {
          // Silent fallback to instant heuristic
        });
    }, 600);

    return () => clearTimeout(timer);
  }, [question]);

  const handleSelectExample = (ex: typeof suggestedExamples[0]) => {
    setQuestion(ex.q);
    setDetected({
      topic: ex.topic,
      geo: ex.geo,
      time: ex.time
    });
    setCustomTopic('');
    setCustomGeo('');
    setCustomTime('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      setError('Please enter a strategic decision question.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Create the investigation with auto-detected or user-overridden values
      const res = await api.createInvestigation({
        question: question.trim(),
        topic: customTopic.trim() || detected.topic,
        geographical_scope: customGeo.trim() || detected.geo,
        time_horizon: customTime.trim() || detected.time
      });

      // 2. Start the autonomous multi-agent pipeline immediately
      await api.startInvestigation(res.id);

      // 3. Navigate directly to Agent Workspace
      onInvestigationCreated(res.id);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize investigation.');
      setIsLoading(false);
    }
  };

  const activeTopic = customTopic.trim() || (question.trim() ? detected.topic : 'Auto-detected upon typing');
  const activeGeo = customGeo.trim() || (question.trim() ? detected.geo : 'Auto-detected upon typing');
  const activeTime = customTime.trim() || (question.trim() ? detected.time : 'Auto-detected upon typing');

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#647CFF]/15 border border-[#647CFF]/30 text-[#647CFF] text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" /> Autonomous Multi-Agent Pipeline
        </div>
        <h2 className="text-2xl font-extrabold text-white">Launch New Strategic Investigation</h2>
        <p className="text-sm text-[#9AA5BA] mt-1">
          Simply formulate your decision question. DECISIONFORGE autonomously classifies the domain, identifies 
          competing alternatives, deploys specialist research agents, challenges premises with the Critic, 
          and calculates deterministic recommendations.
        </p>
      </div>

      {/* Suggested Chips */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 shadow-lg shadow-black/20">
        <div className="flex items-center gap-2 text-xs font-semibold text-white mb-3">
          <Lightbulb className="w-4 h-4 text-[#F59E0B]" />
          <span>Quick Benchmark Prompts (Click to populate)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {suggestedExamples.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelectExample(ex)}
              className="text-left p-3 rounded-lg bg-[#243048] hover:bg-[#243048] border border-[#334155] hover:border-[#6366F1]/60 text-xs text-[#CBD5E1] hover:text-white transition-all group flex items-start justify-between"
            >
              <span className="font-medium pr-2 group-hover:text-[#818CF8]">{ex.q}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#818CF8] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Main Single-Question Form */}
      <form onSubmit={handleSubmit} className="bg-[#1E293B] border border-[#334155] rounded-2xl p-7 shadow-xl shadow-black/20 space-y-6">
        {error && (
          <div className="p-3.5 rounded-lg bg-[#F43F5E]/15 border border-[#F43F5E]/40 text-xs text-[#F43F5E] font-medium">
            {error}
          </div>
        )}

        {/* The One Required Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-white uppercase tracking-wider">
              Strategic Decision Question <span className="text-[#818CF8]">*</span>
            </label>
            <span className="text-[11px] text-[#10B981] flex items-center gap-1 font-medium">
              <CheckCircle className="w-3.5 h-3.5" /> Only required input
            </span>
          </div>

          <textarea
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Should India prioritize nuclear energy or solar energy over the next 10 years?"
            className="w-full bg-[#243048] border border-[#334155] focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] rounded-xl px-4 py-3 text-sm text-white placeholder-[#94A3B8]/60 focus:outline-none transition-colors"
            required
            autoFocus
          />
          <p className="text-[11px] text-[#94A3B8] mt-1.5">
            Frame decisions between competing choices (e.g. Option A vs Option B) or major strategic allocations.
          </p>
        </div>

        {/* Autonomous Detection Bar */}
        <div className="bg-[#243048] border border-[#334155] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Sparkles className="w-3.5 h-3.5 text-[#818CF8]" />
              <span>Autonomous Context Detection</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/30 font-semibold">
                Auto-Inferred
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-[#818CF8] hover:text-[#A78BFA] flex items-center gap-1 font-semibold transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showAdvanced ? 'Hide Optional Overrides' : 'Customize Context (Optional)'}</span>
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Read-only Detected Badges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#1E293B] border border-[#334155]">
              <Compass className="w-4 h-4 text-[#818CF8] shrink-0" />
              <div className="min-w-0">
                <span className="text-[9px] uppercase font-bold text-[#94A3B8] block">Topic / Domain</span>
                <span className="text-xs font-semibold text-white truncate block">{activeTopic}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#1E293B] border border-[#334155]">
              <Globe className="w-4 h-4 text-[#10B981] shrink-0" />
              <div className="min-w-0">
                <span className="text-[9px] uppercase font-bold text-[#94A3B8] block">Geographical Scope</span>
                <span className="text-xs font-semibold text-white truncate block">{activeGeo}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#1E293B] border border-[#334155]">
              <Clock className="w-4 h-4 text-[#A78BFA] shrink-0" />
              <div className="min-w-0">
                <span className="text-[9px] uppercase font-bold text-[#94A3B8] block">Time Horizon</span>
                <span className="text-xs font-semibold text-white truncate block">{activeTime}</span>
              </div>
            </div>
          </div>

          {/* Optional Overrides (Collapsed by Default) */}
          {showAdvanced && (
            <div className="mt-4 pt-4 border-t border-[#334155] grid grid-cols-1 md:grid-cols-3 gap-3.5 animate-fadeIn">
              <div>
                <label className="block text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                  Override Topic / Domain <span className="text-[#94A3B8]/60">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder={detected.topic}
                  className="w-full bg-[#1E293B] border border-[#334155] focus:border-[#6366F1] rounded-lg px-3 py-2 text-xs text-white placeholder-[#94A3B8]/60 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                  Override Geographic Scope <span className="text-[#94A3B8]/60">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={customGeo}
                  onChange={(e) => setCustomGeo(e.target.value)}
                  placeholder={detected.geo}
                  className="w-full bg-[#1E293B] border border-[#334155] focus:border-[#6366F1] rounded-lg px-3 py-2 text-xs text-white placeholder-[#94A3B8]/60 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                  Override Time Horizon <span className="text-[#94A3B8]/60">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  placeholder={detected.time}
                  className="w-full bg-[#1E293B] border border-[#334155] focus:border-[#6366F1] rounded-lg px-3 py-2 text-xs text-white placeholder-[#94A3B8]/60 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Multi-agent pipeline preview */}
        <div className="pt-2 border-t border-[#334155]">
          <div className="text-xs font-semibold text-white mb-2">Autonomous Workflow to be Executed:</div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#94A3B8]">
            <span className="px-2.5 py-1 rounded bg-[#243048] border border-[#334155] text-white">1. Planner</span>
            <span>→</span>
            <span className="px-2.5 py-1 rounded bg-[#243048] border border-[#334155] text-white">2. Literature</span>
            <span>→</span>
            <span className="px-2.5 py-1 rounded bg-[#243048] border border-[#334155] text-white">3. Data</span>
            <span>→</span>
            <span className="px-2.5 py-1 rounded bg-[#243048] border border-[#334155] text-white">4. Market</span>
            <span>→</span>
            <span className="px-2.5 py-1 rounded bg-[#243048] border border-[#334155] text-white">5. Impact</span>
            <span>→</span>
            <span className="px-2.5 py-1 rounded bg-[#F43F5E]/20 border border-[#F43F5E]/30 text-[#FB7185] font-semibold">6. Critic</span>
            <span>→</span>
            <span className="px-2.5 py-1 rounded bg-[#10B981]/20 border border-[#10B981]/30 text-[#34D399] font-semibold">7. Verifier</span>
            <span>→</span>
            <span className="px-2.5 py-1 rounded bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 text-[#C4B5FD] font-semibold">8. Decision Engine</span>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="flex items-center space-x-2 px-7 py-3 rounded-xl bg-gradient-to-r from-[#6366F1] via-[#818CF8] to-[#8B5CF6] hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-[#6366F1]/30 active:scale-95 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isLoading ? 'Deploying Autonomous Agents...' : 'START INVESTIGATION'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
