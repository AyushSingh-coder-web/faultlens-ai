import React, { useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  Database,
  Flame,
  Layers,
  Play,
  RotateCcw,
  Scale,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { INITIAL_SERVICES } from '../../engine/topologyData';
import { RecoveryStrategy, ServiceId } from '../../types';

export const RecoveryPlanner: React.FC = () => {
  const {
    applicableStrategies,
    selectedStrategy,
    setSelectedStrategy,
    executeRecovery,
    services,
    activeIncident,
    setActiveTab,
    resetAllToBaseline,
  } = useApp();

  const [isExecuting, setIsExecuting] = useState(false);
  const [executionReport, setExecutionReport] = useState<string | null>(null);

  const handleExecute = (strategy: RecoveryStrategy) => {
    setIsExecuting(true);
    setExecutionReport(null);

    setTimeout(() => {
      executeRecovery(strategy);
      setIsExecuting(false);
      setExecutionReport(
        `Automated recovery workflow completed successfully. Target services (${strategy.targetServicesRecovered.join(
          ', '
        )}) mitigated. Risk reduced by ${strategy.riskReductionPct}%. Cluster availability restored to 99.98%.`
      );
    }, 1200);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'HIGH':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'MODERATE':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      default:
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    }
  };

  const getComplexityColor = (comp: string) => {
    switch (comp) {
      case 'HIGH':
        return 'text-red-400';
      case 'MEDIUM':
        return 'text-amber-400';
      default:
        return 'text-emerald-400';
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center space-x-2.5">
            <ShieldCheck className="w-5 sm:w-6 h-5 sm:h-6 text-emerald-400 shrink-0" />
            <span>Recovery Strategy Planner & Simulation</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Compare deterministic mitigation playbooks, evaluate architectural trade-offs, and simulate instant cluster recovery.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
            {applicableStrategies.length} Tailored Strategies Available
          </span>
          <button
            onClick={() => setActiveTab('history')}
            className="flex items-center space-x-1.5 bg-[#161D2B] hover:bg-[#1E2638] text-slate-300 border border-[#263244] text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <span>View Incident History →</span>
          </button>
        </div>
      </div>

      {applicableStrategies.length === 0 ? (
        <div className="bg-[#111827] border border-[#263244] rounded-2xl p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-white">Cluster Operating at Nominal Health</h3>
            <p className="text-xs text-slate-400 mt-1">
              No active outages detected. To compare recovery strategies, launch the preset incident from the Failure Simulator.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('simulator')}
            className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Open Failure Simulator
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Recovery Execution Success Banner */}
          {executionReport && (
            <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 shadow-lg flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-xs text-emerald-200 font-medium">{executionReport}</span>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => setActiveTab('overview')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                >
                  View Health Dashboard
                </button>
                <button
                  onClick={() => setExecutionReport(null)}
                  className="text-slate-400 hover:text-white text-xs p-1"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Strategy Comparison Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {applicableStrategies.map((strategy, idx) => {
              const isSelected = selectedStrategy?.id === strategy.id;
              const isRecommended = idx === 0;

              return (
                <div
                  key={strategy.id}
                  onClick={() => setSelectedStrategy(strategy)}
                  className={`rounded-2xl border p-5 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#151D2C] border-purple-500 shadow-xl shadow-purple-900/20 ring-1 ring-purple-500'
                      : 'bg-[#111827] border-[#263244] hover:border-slate-500 hover:bg-[#141B2A]'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          PLAN #{idx + 1}
                        </span>
                        {isRecommended && (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Recommended
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">Rank Score</span>
                        <span className="text-base font-black text-cyan-400 font-mono">{strategy.score}/100</span>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-white leading-snug">{strategy.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{strategy.description}</p>

                    {/* Metrics Comparison Row */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="p-2 rounded-lg bg-[#0D111B] border border-[#263244]">
                        <span className="text-[10px] text-slate-400 block">Risk Reduction</span>
                        <span className="text-base font-bold text-emerald-400 font-mono">
                          +{strategy.riskReductionPct}%
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-[#0D111B] border border-[#263244]">
                        <span className="text-[10px] text-slate-400 block">Est. Recovery Time</span>
                        <span className="text-base font-bold text-white font-mono">
                          ~{strategy.estimatedRecoveryTimeSec}s
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-[#0D111B] border border-[#263244]">
                        <span className="text-[10px] text-slate-400 block">User Impact</span>
                        <span className={`text-xs font-semibold px-1.5 py-0.2 rounded border ${getImpactColor(strategy.userImpactEstimate)}`}>
                          {strategy.userImpactEstimate}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-[#0D111B] border border-[#263244]">
                        <span className="text-[10px] text-slate-400 block">Complexity</span>
                        <span className={`text-xs font-semibold ${getComplexityColor(strategy.operationalComplexity)}`}>
                          {strategy.operationalComplexity}
                        </span>
                      </div>
                    </div>

                    {/* Target Services Recovered */}
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                        Services Expected to Recover:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {strategy.targetServicesRecovered.map((srvId) => (
                          <span
                            key={srvId}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-[#161D2B] text-slate-300 border border-[#263244]"
                          >
                            {INITIAL_SERVICES[srvId]?.name || srvId}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Tradeoffs & Side Effects */}
                    <div className="p-2.5 rounded-lg bg-[#0D111B] border border-[#263244] space-y-1.5 text-xs">
                      <span className="text-[10px] font-bold text-slate-300 uppercase block">Trade-Offs & Constraints</span>
                      <ul className="space-y-1 text-slate-400 text-[11px]">
                        {strategy.tradeOffs.map((to, i) => (
                          <li key={i} className="flex items-start space-x-1.5">
                            <span className="text-amber-400">•</span>
                            <span>{to}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Select & Execute CTA */}
                  <div className="pt-4 mt-4 border-t border-[#263244]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStrategy(strategy);
                        handleExecute(strategy);
                      }}
                      disabled={isExecuting}
                      className={`w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 shadow transition-all ${
                        isSelected
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-[1.01]'
                          : 'bg-[#161D2B] hover:bg-purple-600 hover:text-white text-slate-300 border border-[#263244]'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isExecuting && isSelected ? 'Simulating Recovery...' : 'Execute Recovery Plan'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* SRE Disclaimer */}
          <div className="p-3.5 rounded-xl bg-[#0D111B] border border-[#263244] text-xs text-slate-400 flex items-center space-x-3">
            <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-[11px]">
              Note: Recovery times, risk reduction percentages, and architectural trade-offs are deterministic mathematical estimates derived from the configured dependency model. No production workloads are affected.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
