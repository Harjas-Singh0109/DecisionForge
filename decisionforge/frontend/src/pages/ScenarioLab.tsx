import React, { useState, useEffect } from 'react';
import { 
  Sliders, RotateCcw, Sparkles, TrendingUp, AlertTriangle, 
  CheckCircle2, ArrowRight, Zap, ShieldAlert, BarChart2 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Cell, Legend, CartesianGrid 
} from 'recharts';
import { Investigation, ScenarioSimulationResult } from '../types';
import { api } from '../services/api';

interface ScenarioLabProps {
  investigation: Investigation | null;
}

export const ScenarioLab: React.FC<ScenarioLabProps> = ({ investigation }) => {
  // Scenario variables
  const [techCostChange, setTechCostChange] = useState<number>(0.0);
  const [speedMult, setSpeedMult] = useState<number>(1.0);
  const [baseloadPremium, setBaseloadPremium] = useState<number>(0.0);
  const [capexInflation, setCapexInflation] = useState<number>(0.0);
  const [carbonSupport, setCarbonSupport] = useState<number>(0.0);

  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [simulation, setSimulation] = useState<ScenarioSimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const runSimulation = async (assumptions: Record<string, number>, presetName?: string) => {
    if (!investigation) return;
    setIsLoading(true);
    try {
      const res = await api.simulateScenario(
        investigation.id, 
        assumptions, 
        presetName || activePreset || 'Custom Simulation'
      );
      setSimulation(res);
    } catch (e) {
      console.error('Simulation error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Run on mount or when variables change
  useEffect(() => {
    const timer = setTimeout(() => {
      runSimulation({
        tech_cost_change: techCostChange,
        deployment_speed_mult: speedMult,
        baseload_reliability_premium: baseloadPremium,
        capex_inflation: capexInflation,
        carbon_tax_support: carbonSupport
      });
    }, 150);
    return () => clearTimeout(timer);
  }, [techCostChange, speedMult, baseloadPremium, capexInflation, carbonSupport, investigation?.id]);

  const handleReset = () => {
    setActivePreset(null);
    setTechCostChange(0.0);
    setSpeedMult(1.0);
    setBaseloadPremium(0.0);
    setCapexInflation(0.0);
    setCarbonSupport(0.0);
  };

  const applyPreset = (presetName: string) => {
    setActivePreset(presetName);
    if (presetName === 'Optimistic Tech Leap') {
      setTechCostChange(-0.35);
      setSpeedMult(1.6);
      setBaseloadPremium(0.1);
      setCapexInflation(-0.15);
      setCarbonSupport(0.5);
    } else if (presetName === 'Pessimistic Stress Test') {
      setTechCostChange(0.25);
      setSpeedMult(0.6);
      setBaseloadPremium(0.5);
      setCapexInflation(0.35);
      setCarbonSupport(0.0);
    } else if (presetName === 'High-Growth Baseload Crunch') {
      setTechCostChange(0.0);
      setSpeedMult(1.0);
      setBaseloadPremium(0.85);
      setCapexInflation(0.10);
      setCarbonSupport(0.3);
    }
  };

  if (!investigation) {
    return (
      <div className="p-12 text-center text-[#9AA5BA]">
        <Sliders className="w-12 h-12 mx-auto text-[#647CFF]/40 mb-3 animate-pulse" />
        <h3 className="text-lg font-bold text-white">No Active Investigation Selected</h3>
      </div>
    );
  }

  // Prepare chart data
  const chartData = (simulation?.results || []).map((r) => ({
    name: r.alternative_name.length > 20 ? r.alternative_name.substring(0, 20) + '...' : r.alternative_name,
    fullName: r.alternative_name,
    baseline: r.original_score,
    scenario: r.total_score,
    delta: r.score_delta
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Signature Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1E293B] via-[#1A263D] to-[#1E293B] border border-[#8B5CF6]/40 p-7 shadow-xl shadow-black/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#A78BFA] text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Signature Feature: "What Would Change Our Mind?"
            </div>
            <h2 className="text-2xl font-extrabold text-white">Interactive Scenario Lab</h2>
            <p className="text-xs text-[#94A3B8] mt-1 max-w-2xl leading-relaxed">
              Don't accept a static AI recommendation. Stress-test assumptions, alter market conditions, 
              and discover the precise tipping points where the strategic decision flips.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleReset}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#243048] hover:bg-[#2D3C5A] border border-[#334155] text-white text-xs font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#818CF8]" />
              <span>Reset to Baseline</span>
            </button>
          </div>
        </div>

        {/* Preset Buttons */}
        <div className="mt-5 pt-4 border-t border-[#334155] flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-bold text-white uppercase tracking-wider mr-2">Hypothetical Presets:</span>
          {['Optimistic Tech Leap', 'Pessimistic Stress Test', 'High-Growth Baseload Crunch'].map((p) => (
            <button
              key={p}
              onClick={() => applyPreset(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activePreset === p
                  ? 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-md shadow-[#6366F1]/30 border border-[#6366F1]'
                  : 'bg-[#243048] hover:bg-[#243048] text-[#CBD5E1] hover:text-white border border-[#334155]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Decision Flipped Alert Banner */}
      {simulation && (
        <div className={`p-6 rounded-2xl border transition-all ${
          simulation.decision_flipped
            ? 'bg-gradient-to-r from-[#3B1925] via-[#2A1733] to-[#3B1925] border-[#F43F5E]/60 shadow-lg shadow-[#F43F5E]/20'
            : 'bg-[#1E293B] border-[#10B981]/40'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                simulation.decision_flipped
                  ? 'bg-[#F43F5E]/20 text-[#FB7185] border border-[#F43F5E]/40 animate-pulse'
                  : 'bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/40'
              }`}>
                {simulation.decision_flipped ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    simulation.decision_flipped
                      ? 'bg-[#F43F5E]/20 text-[#FB7185]'
                      : 'bg-[#10B981]/20 text-[#34D399]'
                  }`}>
                    {simulation.decision_flipped ? 'DECISION FLIPPED' : 'RECOMMENDATION HOLDS'}
                  </span>
                  <span className="text-xs text-[#9AA5BA]">
                    Lead Margin: <strong className="text-white font-mono">{simulation.score_difference} pts</strong>
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-white mt-1">
                  Scenario Winner: <span className={simulation.decision_flipped ? 'text-[#F05252]' : 'text-[#31C48D]'}>{simulation.scenario_preferred}</span>
                </h3>
                <p className="text-xs text-[#9AA5BA] mt-1.5 leading-relaxed">
                  {simulation.explanation}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0 hidden md:block">
              <div className="text-[10px] text-[#9AA5BA] uppercase font-bold">Baseline vs Scenario</div>
              <div className="text-sm font-mono text-white mt-0.5">
                <span className="line-through text-[#9AA5BA] mr-2">{simulation.original_preferred}</span>
                <span className="font-bold text-[#647CFF]">→ {simulation.scenario_preferred}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Sliders & Live Comparison Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Panel */}
        <div className="lg:col-span-6 bg-[#1E293B] border border-[#647CFF]/20 rounded-2xl p-6 glow-card space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#647CFF]/15">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#647CFF]" /> Dynamic Assumption Sliders
            </h3>
            <span className="text-[10px] text-[#9AA5BA]">Deterministic recalculation</span>
          </div>

          {/* Slider 1: Tech Cost Change */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-white">Technology Equipment Cost Change</span>
              <span className={`font-mono font-bold ${techCostChange < 0 ? 'text-[#31C48D]' : techCostChange > 0 ? 'text-[#F05252]' : 'text-white'}`}>
                {techCostChange > 0 ? `+${Math.round(techCostChange * 100)}%` : `${Math.round(techCostChange * 100)}%`}
              </span>
            </div>
            <input
              type="range"
              min="-0.50"
              max="0.50"
              step="0.05"
              value={techCostChange}
              onChange={(e) => { setActivePreset(null); setTechCostChange(parseFloat(e.target.value)); }}
              className="w-full accent-[#647CFF] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#9AA5BA]">
              <span>-50% (Breakthrough Drop)</span>
              <span>Baseline (0%)</span>
              <span>+50% (Mineral Supply Spike)</span>
            </div>
          </div>

          {/* Slider 2: Deployment Speed Multiplier */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-white">Deployment & Permitting Speed</span>
              <span className="font-mono font-bold text-[#647CFF]">{speedMult.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={speedMult}
              onChange={(e) => { setActivePreset(null); setSpeedMult(parseFloat(e.target.value)); }}
              className="w-full accent-[#647CFF] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#9AA5BA]">
              <span>0.5x (Severe Red Tape)</span>
              <span>1.0x (Normal)</span>
              <span>2.0x (Emergency Fast-track)</span>
            </div>
          </div>

          {/* Slider 3: Baseload Reliability Premium */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-white">Baseload / 24x7 Grid Reliability Premium</span>
              <span className="font-mono font-bold text-[#9B7CFF]">{Math.round(baseloadPremium * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={baseloadPremium}
              onChange={(e) => { setActivePreset(null); setBaseloadPremium(parseFloat(e.target.value)); }}
              className="w-full accent-[#9B7CFF] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#9AA5BA]">
              <span>0% (Intermittent Tolerant)</span>
              <span>50%</span>
              <span>100% (Critical Continuous Power)</span>
            </div>
          </div>

          {/* Slider 4: Capex Inflation */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-white">Financing Interest & Capex Overrun</span>
              <span className={`font-mono font-bold ${capexInflation > 0 ? 'text-[#F05252]' : 'text-white'}`}>
                {capexInflation > 0 ? `+${Math.round(capexInflation * 100)}%` : `${Math.round(capexInflation * 100)}%`}
              </span>
            </div>
            <input
              type="range"
              min="-0.30"
              max="0.50"
              step="0.05"
              value={capexInflation}
              onChange={(e) => { setActivePreset(null); setCapexInflation(parseFloat(e.target.value)); }}
              className="w-full accent-[#647CFF] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#9AA5BA]">
              <span>-30% (Low Capital Cost)</span>
              <span>0%</span>
              <span>+50% (High Debt Cost)</span>
            </div>
          </div>

          {/* Slider 5: Carbon Tax / Subsidy */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-white">Carbon Tax / Zero-Carbon Subsidy Support</span>
              <span className="font-mono font-bold text-[#31C48D]">{Math.round(carbonSupport * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.1"
              value={carbonSupport}
              onChange={(e) => { setActivePreset(null); setCarbonSupport(parseFloat(e.target.value)); }}
              className="w-full accent-[#31C48D] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#9AA5BA]">
              <span>0% (No Subsidy)</span>
              <span>50%</span>
              <span>100% (Aggressive Carbon Penalty)</span>
            </div>
          </div>
        </div>

        {/* Live Comparison Chart & Sensitivity */}
        <div className="lg:col-span-6 bg-[#1E293B] border border-[#647CFF]/20 rounded-2xl p-6 glow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#647CFF]/15">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[#647CFF]" /> Alternative Score Comparison (1-10)
              </h3>
              <span className="text-[10px] text-[#31C48D] font-semibold">Real-Time Recalculation</span>
            </div>

            <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#162036" />
                  <XAxis dataKey="name" stroke="#9AA5BA" tick={{ fill: '#9AA5BA', fontSize: 10 }} />
                  <YAxis domain={[0, 10]} stroke="#9AA5BA" tick={{ fill: '#9AA5BA', fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1E293B', borderColor: '#647CFF', borderRadius: 8, fontSize: 11 }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="baseline" name="Baseline Score" fill="#647CFF" radius={[4, 4, 0, 0]} opacity={0.6} />
                  <Bar dataKey="scenario" name="Simulated Scenario Score" fill="#31C48D" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.delta > 0 ? '#31C48D' : '#F05252'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Influential Variables Sensitivity Ranking */}
          {simulation && simulation.most_influential_variables.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[#647CFF]/15">
              <span className="text-[10px] uppercase font-bold text-[#9AA5BA] tracking-wider block mb-2">
                Most Influential Variables (Sensitivity Driver):
              </span>
              <div className="flex flex-wrap gap-2">
                {simulation.most_influential_variables.map((v, i) => (
                  <span
                    key={v}
                    className="px-2.5 py-1 rounded bg-[#162036] border border-[#647CFF]/30 text-white text-xs font-medium flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#9B7CFF]" />
                    {v.replace(/_/g, ' ').toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
