import React, { useState } from 'react';
import { Settings as SettingsIcon, ShieldCheck, Database, RefreshCw, Cpu, CheckCircle2, HardDrive } from 'lucide-react';
import { SystemStatus } from '../types';
import { api } from '../services/api';

interface SettingsProps {
  systemStatus: SystemStatus | null;
  onRefreshStatus: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ systemStatus, onRefreshStatus }) => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    setSeedSuccess(false);
    try {
      await api.seedDemo();
      setSeedSuccess(true);
      onRefreshStatus();
      setTimeout(() => setSeedSuccess(false), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#647CFF]/15 border border-[#647CFF]/30 text-[#647CFF] text-xs font-semibold mb-2">
          <SettingsIcon className="w-3.5 h-3.5" /> System Architecture & Engine Controls
        </div>
        <h2 className="text-2xl font-extrabold text-white">Platform Settings</h2>
        <p className="text-xs text-[#9AA5BA] mt-1">
          DECISIONFORGE local execution parameters, Ollama integration, and verified data pipelines.
        </p>
      </div>

      {/* AI Inference Architecture */}
      <div className="bg-[#1E293B] border border-[#647CFF]/20 rounded-2xl p-6 glow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#647CFF]/15">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#647CFF]/20 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-[#647CFF]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">AI Inference Runtime</h3>
              <p className="text-xs text-[#9AA5BA]">Local model orchestration with zero paid API dependency.</p>
            </div>
          </div>
          <button
            onClick={onRefreshStatus}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#162036] hover:bg-[#1f2d4d] border border-[#647CFF]/30 text-white text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#647CFF]" />
            <span>Check Engine</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-[#1E293B] p-4 rounded-xl border border-[#647CFF]/15">
            <span className="text-[#9AA5BA] block mb-1">Active AI Engine</span>
            <span className="font-bold text-white text-sm block">{systemStatus?.llm.engine}</span>
            <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold ${
              systemStatus?.llm.status === 'online' ? 'bg-[#31C48D]/20 text-[#31C48D]' : 'bg-[#647CFF]/20 text-[#647CFF]'
            }`}>
              {systemStatus?.llm.status === 'online' ? '● Ollama Online' : '● Autonomous Heuristic Engine Active'}
            </span>
          </div>

          <div className="bg-[#1E293B] p-4 rounded-xl border border-[#647CFF]/15">
            <span className="text-[#9AA5BA] block mb-1">Target Models</span>
            <div className="font-mono text-white text-xs space-y-1">
              <div>Primary: <strong className="text-[#647CFF]">qwen2.5:3b</strong></div>
              <div>Fallback: <strong className="text-[#9B7CFF]">qwen2.5:1.5b</strong></div>
            </div>
            <p className="text-[10px] text-[#9AA5BA] mt-2">
              Sequential agent dispatch optimized for 8 GB RAM / RTX 5060 hardware profile.
            </p>
          </div>
        </div>
      </div>

      {/* Research & Data Pipeline */}
      <div className="bg-[#1E293B] border border-[#647CFF]/20 rounded-2xl p-6 glow-card space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-[#647CFF]/15">
          <div className="w-9 h-9 rounded-lg bg-[#31C48D]/20 flex items-center justify-center">
            <Database className="w-5 h-5 text-[#31C48D]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Research & Evidence Pipeline</h3>
            <p className="text-xs text-[#9AA5BA]">Public news feeds, institutional publications, and article extraction.</p>
          </div>
        </div>

        <div className="space-y-2 text-xs text-[#9AA5BA]">
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#1E293B]">
            <span className="font-medium text-white">GDELT 2.0 Global Document API</span>
            <span className="text-[#31C48D] font-mono font-bold">Enabled (No API key needed)</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#1E293B]">
            <span className="font-medium text-white">Trafilatura Article Extractor</span>
            <span className="text-[#31C48D] font-mono font-bold">Active (with BeautifulSoup fallback)</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#1E293B]">
            <span className="font-medium text-white">SQLite Persistent Database</span>
            <span className="text-[#647CFF] font-mono font-bold">decisionforge.db (WAL Mode)</span>
          </div>
        </div>
      </div>

      {/* Demo Benchmark Re-Seed */}
      <div className="bg-[#1E293B] border border-[#647CFF]/20 rounded-2xl p-6 glow-card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Demo Benchmark Investigations</h3>
            <p className="text-xs text-[#9AA5BA] mt-0.5">
              Re-populate verified nuclear vs solar and battery swapping datasets with complete agent findings.
            </p>
          </div>
          <button
            onClick={handleSeedDemo}
            disabled={isSeeding}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#647CFF]/20 hover:bg-[#647CFF]/30 border border-[#647CFF]/40 text-white text-xs font-bold transition-all disabled:opacity-50"
          >
            {seedSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#31C48D]" />
                <span className="text-[#31C48D]">Demo Seeded!</span>
              </>
            ) : (
              <>
                <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
                <span>{isSeeding ? 'Seeding...' : 'Re-Seed Demo Data'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
