import React from 'react';
import { Play, Download, Plus, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Investigation } from '../types';
import { api } from '../services/api';

interface NavbarProps {
  currentTab: string;
  activeInvestigation: Investigation | null;
  onNewClick: () => void;
  onStartClick: () => void;
  isStarting: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  activeInvestigation,
  onNewClick,
  onStartClick,
  isStarting
}) => {
  const formatTabTitle = (tab: string) => {
    switch (tab) {
      case 'overview': return 'Executive Intelligence Overview';
      case 'new': return 'Launch Autonomous Investigation';
      case 'workspace': return 'Multi-Agent Research Workspace';
      case 'analysis': return 'Adaptive Domain Intelligence & Comparative Modeling';
      case 'graph': return 'Evidence Intelligence Relationship Graph';
      case 'scenario': return 'Scenario Lab: What Would Change Our Mind?';
      case 'reports': return 'Decision Results & Strategic Report';
      case 'settings': return 'System Architecture & Engine Settings';
      default: return 'DECISIONFORGE Intelligence';
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#31C48D]/15 text-[#31C48D] border border-[#31C48D]/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Investigation Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#647CFF]/15 text-[#647CFF] border border-[#647CFF]/30 animate-pulse">
            <Clock className="w-3.5 h-3.5" /> Research In Progress...
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F4B860]/15 text-[#F4B860] border border-[#F4B860]/30">
            <AlertCircle className="w-3.5 h-3.5" /> Ready / Draft
          </span>
        );
    }
  };

  return (
    <header className="h-16 bg-[#243048]/90 backdrop-blur-md border-b border-[#334155]/60 px-6 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h1 className="text-base font-bold text-white flex items-center gap-2">
          {formatTabTitle(currentTab)}
        </h1>
        {activeInvestigation && (
          <p className="text-xs text-[#94A3B8] truncate max-w-xl">
            <span className="text-[#818CF8] font-semibold">Active:</span> {activeInvestigation.question}
          </p>
        )}
      </div>

      <div className="flex items-center space-x-3">
        {activeInvestigation && getStatusBadge(activeInvestigation.status)}

        {activeInvestigation && activeInvestigation.status !== 'in_progress' && (
          <button
            onClick={onStartClick}
            disabled={isStarting}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white text-xs font-semibold shadow-md shadow-[#6366F1]/25 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{activeInvestigation.status === 'completed' ? 'Re-Run Agents' : 'Start Research'}</span>
          </button>
        )}

        {activeInvestigation && (
          <a
            href={api.getExportPdfUrl(activeInvestigation.id)}
            download
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#283852] border border-[#334155] text-white text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#818CF8]" />
            <span>Export PDF</span>
          </a>
        )}

        <button
          onClick={onNewClick}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#6366F1]/15 hover:bg-[#6366F1]/25 border border-[#6366F1]/40 text-[#818CF8] text-xs font-semibold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New</span>
        </button>
      </div>
    </header>
  );
};
