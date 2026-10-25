import React, { useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  Cpu,
  Database,
  FastForward,
  Flame,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Server,
  ShieldCheck,
  Sliders,
  TrendingDown,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FAILURE_SCENARIOS, INITIAL_SERVICES } from '../../engine/topologyData';
import { FailureScenarioId, ServiceId } from '../../types';

export const FailureSimulator: React.FC = () => {
  const {
    services,
    simulationState,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    stepSimulationForward,
    replaySimulation,
    resetSimulation,
    setActiveTab,
    runPresetDemo,
  } = useApp();

  const [selectedScenarioId, setSelectedScenarioId] = useState<FailureScenarioId>(
    simulationState.scenarioId || 'db-connection-pool-exhaustion'
  );
  const [selectedSeverity, setSelectedSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>(
    simulationState.severity || 'CRITICAL'
  );

  const currentScenario = FAILURE_SCENARIOS.find((s) => s.id === selectedScenarioId) || FAILURE_SCENARIOS[0];

  const handleLaunchSimulation = () => {
    startSimulation(selectedScenarioId, selectedSeverity);
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center space-x-2.5">
            <AlertOctagon className="w-5 sm:w-6 h-5 sm:h-6 text-purple-400 shrink-0" />
            <span>Cascading Failure Simulation Engine</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Simulate realistic multi-service failures, track real-time blast radius expansion, and observe upstream ripple degradation.
          </p>
        </div>

        {/* Global Action Triggers */}
        <div className="flex items-center space-x-3">
          <button
            onClick={runPresetDemo}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-md transition-all hover:scale-[1.02]"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Launch Preset Incident</span>
          </button>
          <button
            onClick={resetSimulation}
            className="flex items-center space-x-1.5 bg-[#161D2B] hover:bg-[#1E2638] text-slate-300 border border-[#263244] text-xs font-medium px-3 py-2 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenario Selection Panel */}
        <div className="bg-[#111827] border border-[#263244] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span>Fault Scenarios</span>
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">6 Scenarios</span>
          </div>

          <div className="space-y-2">
            {FAILURE_SCENARIOS.map((scen) => (
              <button
                key={scen.id}
                onClick={() => setSelectedScenarioId(scen.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedScenarioId === scen.id
                    ? 'bg-purple-900/20 border-purple-500/60 shadow-md'
                    : 'bg-[#161D2B] border-[#263244] hover:bg-[#1D2536]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white leading-tight">{scen.title}</span>
                  <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded border font-semibold ${getSeverityBadge(scen.severity)}`}>
                    {scen.severity}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 flex items-center space-x-2">
                  <span>Root: {INITIAL_SERVICES[scen.rootService]?.name}</span>
                  <span>•</span>
                  <span>~{scen.estimatedPropagationTimeSec}s cascade</span>
                </div>
              </button>
            ))}
          </div>

          {/* Severity Picker */}
          <div className="pt-2 border-t border-[#263244]">
            <span className="text-xs font-semibold text-slate-300 block mb-2">Simulated Fault Severity</span>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSelectedSeverity(sev)}
                  className={`py-1.5 rounded-lg font-bold text-[11px] border transition-colors ${
                    selectedSeverity === sev
                      ? 'bg-purple-600 text-white border-purple-400'
                      : 'bg-[#161D2B] text-slate-400 border-[#263244] hover:text-white'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Launch Button */}
          <button
            onClick={handleLaunchSimulation}
            disabled={simulationState.isActive}
            className={`w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 shadow-lg transition-all ${
              simulationState.isActive
                ? 'bg-purple-800/40 text-purple-300 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-500 text-white hover:scale-[1.01]'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{simulationState.isActive ? 'Simulation Running...' : 'Execute Failure Simulation'}</span>
          </button>
        </div>

        {/* Selected Scenario Detailed Blueprint */}
        <div className="bg-[#111827] border border-[#263244] rounded-xl p-5 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[#263244] pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Scenario Specification</span>
              <h3 className="text-base font-bold text-white">{currentScenario.title}</h3>
            </div>
            <span className={`text-xs px-2.5 py-0.5 rounded border font-semibold ${getSeverityBadge(currentScenario.severity)}`}>
              {currentScenario.severity} SEVERITY
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-[#161D2B] p-3 rounded-lg border border-[#263244]">
            {currentScenario.description}
          </p>

          {/* Physical Fault Symptoms Expected */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">Expected Physical Propagation Symptoms:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {currentScenario.typicalSymptoms.map((symptom, i) => (
                <div key={i} className="flex items-start space-x-2 p-2 rounded bg-[#161D2B] border border-[#263244]">
                  <Flame className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                  <span className="text-slate-300 text-[11px]">{symptom}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Simulation Controller Bar */}
          <div className="p-3.5 rounded-xl bg-[#0D111B] border border-[#263244] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-300">Simulation Status:</span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded ${
                  simulationState.isActive
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse'
                    : simulationState.currentStepIndex > 0
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {simulationState.isActive
                  ? 'RUNNING'
                  : simulationState.isPaused
                  ? 'PAUSED'
                  : simulationState.currentStepIndex > 0
                  ? 'COMPLETED'
                  : 'IDLE'}
              </span>
            </div>

            {/* Step Controls */}
            <div className="flex items-center space-x-2">
              {simulationState.isActive && !simulationState.isPaused ? (
                <button
                  onClick={pauseSimulation}
                  className="px-2.5 py-1.5 rounded bg-[#161D2B] hover:bg-[#1E2638] text-slate-200 border border-[#263244] text-xs font-medium flex items-center space-x-1"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </button>
              ) : simulationState.isPaused ? (
                <button
                  onClick={resumeSimulation}
                  className="px-2.5 py-1.5 rounded bg-purple-600 text-white text-xs font-medium flex items-center space-x-1"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Resume</span>
                </button>
              ) : null}

              <button
                onClick={stepSimulationForward}
                disabled={!simulationState.steps.length || simulationState.currentStepIndex >= simulationState.steps.length - 1}
                className="px-2.5 py-1.5 rounded bg-[#161D2B] hover:bg-[#1E2638] disabled:opacity-40 text-slate-200 border border-[#263244] text-xs font-medium flex items-center space-x-1"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>Step Next</span>
              </button>

              <button
                onClick={replaySimulation}
                className="px-2.5 py-1.5 rounded bg-[#161D2B] hover:bg-[#1E2638] text-slate-200 border border-[#263244] text-xs font-medium flex items-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Animated Step Timeline */}
      {simulationState.steps.length > 0 && (
        <div className="bg-[#111827] border border-[#263244] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#263244] pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Cascading Propagation Event Timeline</h3>
              <p className="text-[11px] text-slate-400">Step-by-step physical breakdown of the failure wave across service boundaries</p>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-400">Step:</span>
              <span className="font-bold text-purple-400 font-mono">
                {simulationState.currentStepIndex + 1} / {simulationState.steps.length}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {simulationState.steps.map((step, idx) => {
              const isCurrent = idx === simulationState.currentStepIndex;
              const isPast = idx <= simulationState.currentStepIndex;

              return (
                <div
                  key={step.stepIndex}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-purple-950/20 border-purple-500/60 shadow-lg'
                      : isPast
                      ? 'bg-[#161D2B]/80 border-[#263244]'
                      : 'bg-[#111827]/40 border-[#263244]/40 opacity-40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-purple-300 border border-purple-500/30">
                        {step.timestamp}
                      </span>
                      <h4 className="text-xs font-bold text-white">{step.title}</h4>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        Target: {INITIAL_SERVICES[step.serviceId]?.name || step.serviceId}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs">
                      <span className="text-slate-400">
                        Cluster Availability:{' '}
                        <strong className={step.systemAvailability < 95 ? 'text-red-400' : 'text-emerald-400'}>
                          {step.systemAvailability}%
                        </strong>
                      </span>
                      <span className="text-slate-400">
                        Risk Score:{' '}
                        <strong className="text-purple-400">{step.currentRiskScore}</strong>
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 mt-2">{step.description}</p>

                  {/* Generated logs preview */}
                  {step.logsGenerated.length > 0 && (
                    <div className="mt-2.5 p-2 rounded bg-[#0D111B] border border-[#263244] font-mono text-[10px] space-y-1">
                      {step.logsGenerated.map((logStr, lIdx) => (
                        <div key={lIdx} className="text-slate-300">
                          {logStr}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick link to RCA */}
          <div className="pt-2 flex justify-end space-x-3">
            <button
              onClick={() => setActiveTab('topology')}
              className="text-xs text-slate-300 hover:text-white px-3 py-2 rounded-lg bg-[#161D2B] border border-[#263244] transition-colors"
            >
              View in Topology Graph →
            </button>
            <button
              onClick={() => setActiveTab('rca')}
              className="text-xs text-white px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-semibold shadow transition-all hover:scale-[1.02] flex items-center space-x-1.5"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Investigate Root Cause Analysis →</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
