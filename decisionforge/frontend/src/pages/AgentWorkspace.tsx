import React, { useState, useEffect } from 'react';
import { 
  Cpu, CheckCircle2, Clock, AlertTriangle, ChevronDown, ChevronRight, 
  Search, ShieldAlert, Sparkles, RefreshCw, XCircle, ArrowRight, BookOpen, 
  BarChart3, TrendingUp, Compass, Activity, ArrowDown, Send, Eye, Network
} from 'lucide-react';
import { Agent, Investigation } from '../types';
import { api } from '../services/api';

interface AgentWorkspaceProps {
  investigation: Investigation | null;
  onNavigateTab: (tab: string) => void;
}

export const AgentWorkspace: React.FC<AgentWorkspaceProps> = ({
  investigation,
  onNavigateTab
}) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [liveLogs, setLiveLogs] = useState<{ time: string; msg: string; type: string }[]>([]);
  const [selectedPipelineStage, setSelectedPipelineStage] = useState<number | null>(null);

  const fetchAgents = async () => {
    if (!investigation) return;
    try {
      const data = await api.getAgents(investigation.id);
      setAgents(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAgents();
    if (!investigation) return;

    // Listen to Server-Sent Events for genuine live backend updates
    const eventSource = new EventSource(`/api/events/${investigation.id}`);
    
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const now = new Date().toLocaleTimeString();

        if (payload.type === 'agent_updated') {
          fetchAgents();
          setLiveLogs((prev) => [
            { time: now, msg: `Agent [${payload.data.agent_name}] -> ${payload.data.status.toUpperCase()}: ${payload.data.task || ''}`, type: 'agent' },
            ...prev.slice(0, 30)
          ]);
        } else if (payload.type === 'investigation_completed') {
          fetchAgents();
          setLiveLogs((prev) => [
            { time: now, msg: `Pipeline complete. Decision synthesized: ${payload.data.recommendation}`, type: 'success' },
            ...prev.slice(0, 30)
          ]);
        }
      } catch (err) {
        // pass
      }
    };

    const interval = setInterval(fetchAgents, 2500);

    return () => {
      eventSource.close();
      clearInterval(interval);
    };
  }, [investigation?.id]);

  const handleCancel = async () => {
    if (!investigation) return;
    await api.cancelInvestigation(investigation.id);
    fetchAgents();
  };

  const getAgentIcon = (name: string) => {
    if (name.includes('Planner')) return Compass;
    if (name.includes('Literature')) return BookOpen;
    if (name.includes('Data')) return BarChart3;
    if (name.includes('Market')) return TrendingUp;
    if (name.includes('Impact')) return Sparkles;
    if (name.includes('Critic')) return ShieldAlert;
    if (name.includes('Verification')) return CheckCircle2;
    if (name.includes('Contradiction')) return AlertTriangle;
    return Cpu;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">COMPLETED</span>;
      case 'researching':
      case 'planning':
      case 'analyzing':
      case 'verifying':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#4F6BFF]/20 text-[#4F6BFF] border border-[#4F6BFF]/30 flex items-center gap-1 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4F6BFF] animate-ping" />
            {status.toUpperCase()}
          </span>
        );
      case 'challenging':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/30 flex items-center gap-1 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F43F5E] animate-ping" />
            CHALLENGING
          </span>
        );
      case 'failed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/30">FAILED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#64748B]/20 text-[#94A3B8] border border-[#334155]">WAITING</span>;
    }
  };

  if (!investigation) {
    return (
      <div className="p-16 text-center text-[#94A3B8]">
        <Cpu className="w-12 h-12 mx-auto text-[#4F6BFF]/40 mb-3 animate-pulse" />
        <h3 className="text-lg font-bold text-white">No Active Investigation Selected</h3>
        <p className="text-xs mt-1">Please select an investigation from the sidebar or launch a new one.</p>
      </div>
    );
  }

  const completedCount = agents.filter(a => a.status === 'completed').length;
  const progressPercent = Math.round((completedCount / (agents.length || 1)) * 100);

  // Group agents into Orchestra-inspired pipeline stages
  const pipelineStages = [
    {
      id: 1,
      title: "Stage 1: Strategic Framing",
      desc: "Deconstruct question, identify competing hypotheses & research tasks",
      agents: agents.filter(a => a.agent_name.includes("Planner"))
    },
    {
      id: 2,
      title: "Stage 2: Specialist Investigation",
      desc: "Parallel retrieval of academic, empirical, market & lifecycle sources",
      agents: agents.filter(a => ["Literature", "Data", "Market", "Impact"].some(k => a.agent_name.includes(k)))
    },
    {
      id: 3,
      title: "Stage 3: Adversarial Audit & Critic",
      desc: "Devil's advocate stress-testing, source cross-checks & divergence mapping",
      agents: agents.filter(a => ["Critic", "Verification", "Contradiction"].some(k => a.agent_name.includes(k)))
    },
    {
      id: 4,
      title: "Stage 4: Deterministic Decision Engine",
      desc: "Multi-criteria score synthesis, trade-off resolution & recommendation",
      agents: agents.filter(a => a.agent_name.includes("Decision"))
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Banner & Pipeline Health */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-6 shadow-xl shadow-black/15">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#818CF8]">
                Orchestra Autonomous Multi-Agent Network
              </span>
            </div>
            <h1 className="text-xl font-black text-white tracking-tight">{investigation.question}</h1>
            <p className="text-xs text-[#94A3B8]">
              Domain: <strong className="text-white">{investigation.topic || 'Strategic Decision'}</strong> • Scope: <strong className="text-white">{investigation.geographical_scope}</strong> • Horizon: <strong className="text-white">{investigation.time_horizon}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {investigation.status === 'in_progress' && (
              <button
                onClick={handleCancel}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#F43F5E]/15 text-[#FB7185] hover:bg-[#F43F5E]/25 border border-[#F43F5E]/30 text-xs font-semibold transition-all cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Halt Pipeline</span>
              </button>
            )}

            <button
              onClick={fetchAgents}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#243048] hover:bg-[#2D3C5A] border border-[#334155] text-white text-xs font-semibold transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#818CF8]" />
              <span>Refresh</span>
            </button>

            {investigation.status === 'completed' && (
              <button
                onClick={() => onNavigateTab('analysis')}
                className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-[#6366F1]/25 transition-all cursor-pointer"
              >
                <span>View Adaptive Analysis</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Global Progress Strip */}
        <div className="mt-6 pt-4 border-t border-[#334155]">
          <div className="flex items-center justify-between text-xs font-medium text-[#94A3B8] mb-2">
            <span className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[#10B981]" />
              Pipeline Execution: {completedCount} of {agents.length} Specialized Agents Finalized
            </span>
            <span className="font-mono text-white font-extrabold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-[#243048] rounded-full overflow-hidden border border-[#334155]">
            <div
              className="h-full bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#10B981] transition-all duration-700 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Orchestra Pipeline Flow Visualization */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-6 shadow-xl shadow-black/15 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-[#818CF8]" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
              Agent Orchestration Flow Architecture
            </h3>
          </div>
          <span className="text-[11px] text-[#94A3B8]">Sequential & Parallel Synthesis Pipeline</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {pipelineStages.map((stage, idx) => {
            const isAllCompleted = stage.agents.length > 0 && stage.agents.every(a => a.status === 'completed');
            const isAnyActive = stage.agents.some(a => ['researching', 'planning', 'analyzing', 'challenging', 'verifying'].includes(a.status));
            
            return (
              <div 
                key={stage.id}
                className={`p-4 rounded-xl border transition-all ${
                  isAnyActive
                    ? 'bg-[#243048] border-[#6366F1] shadow-lg shadow-[#6366F1]/20 ring-1 ring-[#6366F1]'
                    : isAllCompleted
                    ? 'bg-[#243048] border-[#10B981]/40'
                    : 'bg-[#243048] border-[#334155]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-[#818CF8] uppercase tracking-wider">
                    {stage.title}
                  </span>
                  {isAllCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  ) : isAnyActive ? (
                    <span className="w-2 h-2 rounded-full bg-[#6366F1] animate-ping" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
                  )}
                </div>
                <p className="text-[11px] text-[#CBD5E1] leading-tight mb-3">
                  {stage.desc}
                </p>
                <div className="space-y-1.5 pt-2 border-t border-[#334155]">
                  {stage.agents.map((ag) => (
                    <div key={ag.id} className="flex items-center justify-between text-[10px] py-0.5">
                      <span className="text-[#E2E8F0] truncate font-medium max-w-[120px]">{ag.agent_name}</span>
                      {getStatusBadge(ag.status)}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Event Stream Ticker */}
      {liveLogs.length > 0 && (
        <div className="bg-[#243048] border border-[#334155] rounded-xl p-4 font-mono text-xs shadow-inner">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#334155]">
            <span className="text-[10px] uppercase font-bold text-[#818CF8] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" /> Real-Time Multi-Agent Telemetry Stream
            </span>
            <span className="text-[10px] text-[#94A3B8]">{liveLogs.length} Events Logged</span>
          </div>
          <div className="space-y-1.5 max-h-24 overflow-y-auto pr-2">
            {liveLogs.slice(0, 4).map((log, i) => (
              <div key={i} className="text-[#94A3B8] flex items-start gap-2 text-[11px]">
                <span className="text-[#818CF8] shrink-0 font-bold">[{log.time}]</span>
                <span className={log.type === 'success' ? 'text-[#34D399] font-semibold' : 'text-[#E2E8F0]'}>{log.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comprehensive Agent Workspace Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#94A3B8]">
          Specialist Agent Deployment & Audit Matrix
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => {
            const Icon = getAgentIcon(agent.agent_name);
            const isCritic = agent.agent_name.includes('Critic');
            const isVerifier = agent.agent_name.includes('Verification');
            const isExpanded = expandedAgent === agent.id;

            return (
              <div
                key={agent.id}
                className={`rounded-2xl border transition-all p-5 flex flex-col justify-between shadow-lg ${
                  isCritic
                    ? 'bg-gradient-to-b from-[#2D1B22] to-[#1E293B] border-[#F43F5E]/40 hover:border-[#F43F5E]/70'
                    : isVerifier
                    ? 'bg-gradient-to-b from-[#162E25] to-[#1E293B] border-[#10B981]/40 hover:border-[#10B981]/70'
                    : 'bg-[#1E293B] border-[#334155] hover:border-[#6366F1]/50'
                }`}
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isCritic
                          ? 'bg-[#F43F5E]/20 text-[#FB7185] border border-[#F43F5E]/30'
                          : isVerifier
                          ? 'bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/30'
                          : 'bg-[#6366F1]/20 text-[#818CF8] border border-[#6366F1]/30'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white leading-tight">{agent.agent_name}</h4>
                        {isCritic && (
                          <span className="text-[10px] text-[#FB7185] font-bold">Adversarial Devil's Advocate</span>
                        )}
                        {isVerifier && (
                          <span className="text-[10px] text-[#34D399] font-bold">Empirical Truth Verification</span>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(agent.status)}
                  </div>

                  {/* Current Focus */}
                  <div className="mt-3.5 bg-[#243048] rounded-xl p-3 border border-[#334155] text-[11px] text-[#94A3B8] min-h-[56px]">
                    <span className="text-white font-semibold block mb-0.5">Execution Focus:</span>
                    <p className="line-clamp-2 leading-relaxed text-[#CBD5E1]">{agent.current_task || 'Waiting in sequence queue.'}</p>
                  </div>

                  {/* Findings Counter */}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-[#94A3B8]">
                    <span>Verified Items Synthesized:</span>
                    <span className="font-mono font-bold text-white px-2.5 py-0.5 rounded bg-[#111726] border border-[#2E3D60]">
                      {agent.findings_count} claims
                    </span>
                  </div>
                </div>

                {/* Structured Output Toggle */}
                <div className="mt-4 pt-3 border-t border-[#1E293B]">
                  <button
                    onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
                    className="w-full flex items-center justify-between text-xs text-[#4F6BFF] hover:text-[#8B5CF6] font-semibold transition-colors cursor-pointer"
                  >
                    <span>{isExpanded ? 'Collapse Raw Output' : 'Inspect Structured Output'}</span>
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-2.5 p-3 rounded-xl bg-[#060810] border border-[#2E3D60] text-[10px] font-mono text-[#94A3B8] max-h-60 overflow-y-auto animate-fadeIn">
                      <pre className="whitespace-pre-wrap">{agent.output || 'No output telemetry recorded.'}</pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
