import React from 'react';
import { 
  PlusCircle, CheckCircle2, ShieldAlert, FileText, Database, 
  ArrowRight, Sparkles, Cpu, Layers, ExternalLink, Trash2, Play,
  Zap, TrendingUp, Activity, Shield, BarChart3, Compass
} from 'lucide-react';
import { Investigation, SystemStatus } from '../types';

interface OverviewProps {
  investigations: Investigation[];
  onSelectInvestigation: (id: string, tab?: string) => void;
  onNewInvestigation: () => void;
  onDeleteInvestigation: (id: string) => void;
  onStartInvestigation: (id: string) => void;
  systemStatus: SystemStatus | null;
}

export const Overview: React.FC<OverviewProps> = ({
  investigations,
  onSelectInvestigation,
  onNewInvestigation,
  onDeleteInvestigation,
  onStartInvestigation,
  systemStatus
}) => {
  const totalCount = investigations.length;
  const completedCount = investigations.filter(i => i.status === 'completed').length;
  const totalSources = investigations.reduce((acc, curr) => acc + (curr.source_count || 0), 0);
  const totalVerifiedClaims = investigations.reduce((acc, curr) => acc + (curr.verified_claim_count || 0), 0);

  const benchmarkPresets = [
    {
      id: 'demo-india-energy-2035',
      badge: 'Clean Energy & Grid',
      badgeColor: '#10B981',
      icon: Zap,
      q: 'Should India prioritize nuclear energy or solar energy over the next 10 years?',
      desc: 'Synthesizes CEA plans, IPCC lifecycle emissions, and challenges solar battery storage costs vs nuclear gestation delays.',
      rec: 'Solar + Storage',
      targetTab: 'analysis'
    },
    {
      id: 'demo-india-ev-infra',
      badge: 'Urban Mobility & Fleet',
      badgeColor: '#4F6BFF',
      icon: TrendingUp,
      q: 'Should India prioritize EV battery swapping or fast-charging infrastructure?',
      desc: 'Evaluates NITI Aayog policy, BloombergNEF interoperability challenges, 2-minute turnaround, and substation transformer peak impacts.',
      rec: 'Battery Swapping',
      targetTab: 'scenario'
    },
    {
      id: 'demo-clinical-ai-systems',
      badge: 'Clinical AI & Healthcare',
      badgeColor: '#06B6D4',
      icon: Activity,
      q: 'Should healthcare systems adopt open-source local clinical AI models or proprietary cloud LLM APIs?',
      desc: 'Evaluates HIPAA zero-egress data privacy, Stanford diagnostic concordance, and sub-35ms emergency EHR triage latency.',
      rec: 'Open-Source Local Models',
      targetTab: 'analysis'
    },
    {
      id: 'demo-defense-air-interceptor',
      badge: 'Defense & Autonomous Systems',
      badgeColor: '#F43F5E',
      icon: Shield,
      q: 'Should national defense authorities prioritize autonomous drone swarm interceptors or traditional directed-energy laser systems for low-altitude air defense over the next 5 years?',
      desc: 'RUSI operational conflict data, sub-$50 laser shot economics vs IEEE atmospheric thermal blooming in adverse weather.',
      rec: 'Autonomous Drone Swarms',
      targetTab: 'analysis'
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E293B] via-[#243048] to-[#1E293B] border border-[#334155] p-8 shadow-xl shadow-black/20">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-gradient-to-br from-[#6366F1]/20 via-[#8B5CF6]/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6366F1]/15 border border-[#6366F1]/30 text-[#818CF8] text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Autonomous AI Decision Intelligence Platform
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Don't just find answers.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#818CF8] via-[#C084FC] to-white">
              Discover what would change your mind.
            </span>
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
            DECISIONFORGE deploys autonomous specialist agents to independently research competing hypotheses, 
            actively challenge findings via adversarial Critic agents, audit empirical evidence, and simulate 
            how changing assumptions reverses strategic recommendations in real-time.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={onNewInvestigation}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white text-xs font-extrabold shadow-xl shadow-[#6366F1]/30 hover:opacity-95 transition-all cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Launch New Investigation</span>
            </button>
            <button
              onClick={() => onSelectInvestigation('demo-india-energy-2035', 'analysis')}
              className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-[#243048] hover:bg-[#2D3C5A] border border-[#334155] text-white text-xs font-bold transition-all cursor-pointer"
            >
              <span>Explore Adaptive Analysis Workspace</span>
              <ArrowRight className="w-4 h-4 text-[#818CF8]" />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-5 shadow-lg shadow-black/15">
          <div className="flex items-center justify-between text-[#94A3B8] text-xs font-medium mb-2">
            <span>Total Investigations</span>
            <Layers className="w-4 h-4 text-[#818CF8]" />
          </div>
          <div className="text-2xl font-black text-white">{totalCount}</div>
          <p className="text-[11px] text-[#94A3B8] mt-1">Multi-agent decision pipelines</p>
        </div>

        <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-5 shadow-lg shadow-black/15">
          <div className="flex items-center justify-between text-[#94A3B8] text-xs font-medium mb-2">
            <span>Completed Decisions</span>
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="text-2xl font-black text-[#10B981]">{completedCount}</div>
          <p className="text-[11px] text-[#94A3B8] mt-1">Deterministically scored</p>
        </div>

        <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-5 shadow-lg shadow-black/15">
          <div className="flex items-center justify-between text-[#94A3B8] text-xs font-medium mb-2">
            <span>Sources Extracted</span>
            <Database className="w-4 h-4 text-[#A78BFA]" />
          </div>
          <div className="text-2xl font-black text-white">{totalSources}</div>
          <p className="text-[11px] text-[#94A3B8] mt-1">Academic, government & GDELT</p>
        </div>

        <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-5 shadow-lg shadow-black/15">
          <div className="flex items-center justify-between text-[#94A3B8] text-xs font-medium mb-2">
            <span>Claims Verified</span>
            <ShieldAlert className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="text-2xl font-black text-[#F59E0B]">{totalVerifiedClaims}</div>
          <p className="text-[11px] text-[#94A3B8] mt-1">Cross-checked against primary sources</p>
        </div>
      </div>

      {/* Benchmark Demonstrations across Diverse Domains */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#4F6BFF]" />
              Adaptive Intelligence Benchmarks Across Domains
            </h2>
            <p className="text-xs text-[#94A3B8]">
              Notice how the analytical workspace, charts, metrics, and risks automatically morph to each distinct topic.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {benchmarkPresets.map((demo) => {
            const Icon = demo.icon;
            return (
              <div 
                key={demo.id}
                className="bg-[#1E293B] hover:bg-[#243048] border border-[#334155] hover:border-[#6366F1]/50 rounded-2xl p-6 transition-all group relative shadow-lg shadow-black/15 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span 
                      className="text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-full border flex items-center gap-1.5"
                      style={{
                        backgroundColor: `${demo.badgeColor}15`,
                        borderColor: `${demo.badgeColor}35`,
                        color: demo.badgeColor
                      }}
                    >
                      <Icon className="w-3 h-3" />
                      {demo.badge}
                    </span>
                    <span className="text-xs font-semibold text-[#10B981] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified Dataset
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white mt-3 group-hover:text-[#818CF8] transition-colors leading-snug">
                    {demo.q}
                  </h3>

                  <p className="text-xs text-[#94A3B8] mt-2 leading-relaxed">
                    {demo.desc}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-[#334155] flex items-center justify-between text-xs">
                  <span className="text-white font-medium">
                    Recommendation: <strong className="text-[#10B981]">{demo.rec}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectInvestigation(demo.id, 'analysis')}
                      className="px-2.5 py-1 rounded-lg bg-[#6366F1]/15 text-[#818CF8] hover:bg-[#6366F1]/30 font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <span>Adaptive Analysis</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onSelectInvestigation(demo.id, 'scenario')}
                      className="px-2.5 py-1 rounded-lg bg-[#8B5CF6]/15 text-[#A78BFA] hover:bg-[#8B5CF6]/30 font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <span>Scenario Lab</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Investigations Table */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-2xl overflow-hidden shadow-lg shadow-black/15">
        <div className="p-5 border-b border-[#334155] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Registered Strategic Investigations</h3>
            <p className="text-xs text-[#94A3B8]">Saved multi-agent intelligence workspaces and decision audits.</p>
          </div>
          <button
            onClick={onNewInvestigation}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#6366F1]/15 text-[#818CF8] hover:bg-[#6366F1]/25 border border-[#6366F1]/30 text-xs font-semibold transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create New</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#94A3B8]">
            <thead className="bg-[#243048] text-[11px] uppercase tracking-wider text-white border-b border-[#334155] font-semibold">
              <tr>
                <th className="py-3 px-4">Decision Question</th>
                <th className="py-3 px-4">Domain / Scope</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Recommendation</th>
                <th className="py-3 px-4">Sources / Claims</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155]">
              {investigations.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#243048]/60 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-white max-w-xs">
                    <button
                      onClick={() => onSelectInvestigation(inv.id, 'analysis')}
                      className="hover:text-[#818CF8] text-left transition-colors font-bold cursor-pointer line-clamp-2"
                    >
                      {inv.question}
                    </button>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="block text-white font-medium">{inv.topic || 'General Strategic'}</span>
                    <span className="text-[10px] text-[#94A3B8]">{inv.geographical_scope || 'National'}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      inv.status === 'completed'
                        ? 'bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/30'
                        : inv.status === 'in_progress'
                        ? 'bg-[#6366F1]/20 text-[#818CF8] border border-[#6366F1]/30 animate-pulse'
                        : 'bg-[#F59E0B]/20 text-[#FBBF24] border border-[#F59E0B]/30'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-white font-semibold">
                    {inv.recommendation || 'Pending calculation'}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#243048] border border-[#334155] text-white font-mono text-[11px]">
                        {inv.source_count || 0} src
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#243048] border border-[#10B981]/30 text-[#10B981] font-mono text-[11px]">
                        {inv.verified_claim_count || 0} ver
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      onClick={() => onSelectInvestigation(inv.id, 'analysis')}
                      className="px-2.5 py-1 rounded-lg bg-[#6366F1]/15 text-[#818CF8] hover:bg-[#6366F1]/25 border border-[#6366F1]/30 font-bold transition-all cursor-pointer"
                    >
                      Analyze
                    </button>
                    {inv.status !== 'in_progress' && (
                      <button
                        onClick={() => onStartInvestigation(inv.id)}
                        className="px-2.5 py-1 rounded-lg bg-[#10B981]/15 text-[#34D399] hover:bg-[#10B981]/25 border border-[#10B981]/30 font-bold transition-all cursor-pointer"
                        title="Start/Re-run Agents"
                      >
                        <Play className="w-3 h-3 fill-current inline" />
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteInvestigation(inv.id)}
                      className="p-1 rounded text-[#94A3B8] hover:text-[#F43F5E] transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
