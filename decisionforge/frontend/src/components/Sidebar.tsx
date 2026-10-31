import React from 'react';
import { 
  LayoutDashboard, PlusCircle, Cpu, Network, 
  Sliders, FileText, Settings, ShieldCheck, Zap, Sparkles, BarChart3
} from 'lucide-react';
import { Investigation, SystemStatus } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  investigations: Investigation[];
  selectedInvId: string;
  setSelectedInvId: (id: string) => void;
  systemStatus: SystemStatus | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  investigations,
  selectedInvId,
  setSelectedInvId,
  systemStatus
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'new', label: 'New Investigation', icon: PlusCircle },
    { id: 'workspace', label: 'Agent Workspace', icon: Cpu, badge: 'Live' },
    { id: 'analysis', label: 'Adaptive Analysis', icon: BarChart3, badge: 'Dynamic' },
    { id: 'graph', label: 'Evidence Graph', icon: Network },
    { id: 'scenario', label: 'Scenario Lab', icon: Sliders, highlight: true },
    { id: 'reports', label: 'Research Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#243048] border-r border-[#334155]/60 flex flex-col h-screen select-none z-20">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#334155]/50">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6366F1]/30">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-wider text-white">DECISION<span className="text-[#818CF8]">FORGE</span></span>
            <div className="text-[10px] text-[#94A3B8] uppercase tracking-widest font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
              Autonomous AI
            </div>
          </div>
        </div>
        <p className="text-[11px] text-[#94A3B8] mt-2 italic leading-tight">
          "Don't just find answers. Discover what would change your mind."
        </p>
      </div>

      {/* Investigation Selector */}
      <div className="px-4 py-3 border-b border-[#334155]/40 bg-[#1A263D]/60">
        <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block mb-1.5">
          Active Investigation
        </label>
        <select
          value={selectedInvId}
          onChange={(e) => setSelectedInvId(e.target.value)}
          className="w-full bg-[#1E293B] border border-[#334155] rounded-lg text-xs text-white px-2.5 py-1.5 focus:outline-none focus:border-[#6366F1] transition-colors"
        >
          {investigations.length === 0 && <option value="">No investigations</option>}
          {investigations.map((inv) => (
            <option key={inv.id} value={inv.id}>
              {inv.question.length > 32 ? inv.question.substring(0, 32) + '...' : inv.question}
            </option>
          ))}
        </select>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#6366F1]/25 to-[#8B5CF6]/15 text-white border border-[#6366F1]/40 shadow-sm shadow-[#6366F1]/20'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#818CF8]' : 'text-[#94A3B8]'}`} />
                <span>{item.label}</span>
              </div>
              {item.highlight && (
                <span className="text-[9px] font-bold bg-[#8B5CF6]/20 text-[#A78BFA] px-1.5 py-0.5 rounded border border-[#8B5CF6]/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  What-If
                </span>
              )}
              {item.badge && !item.highlight && (
                <span className="text-[9px] font-semibold bg-[#10B981]/20 text-[#34D399] px-1.5 py-0.5 rounded border border-[#10B981]/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-3 border-t border-[#334155]/40 bg-[#1A263D]/70">
        <div className="rounded-lg bg-[#1E293B] border border-[#334155]/60 p-2.5 text-[11px]">
          <div className="flex items-center justify-between text-[#94A3B8] mb-1">
            <span className="font-semibold flex items-center gap-1 text-white">
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" /> Engine
            </span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
              systemStatus?.llm.status === 'online' ? 'bg-[#10B981]/20 text-[#34D399]' : 'bg-[#6366F1]/20 text-[#818CF8]'
            }`}>
              {systemStatus?.llm.status === 'online' ? 'Ollama Active' : 'Autonomous AI'}
            </span>
          </div>
          <div className="text-[10px] text-[#94A3B8] truncate">
            {systemStatus?.llm.engine || 'Local Heuristic Engine'}
          </div>
        </div>
      </div>
    </aside>
  );
};
