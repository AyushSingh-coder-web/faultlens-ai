import React, { useState } from 'react';
import {
  CheckCircle2,
  Cpu,
  HelpCircle,
  RotateCcw,
  Save,
  Settings,
  Shield,
  Sliders,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AppSettings } from '../../types';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, restoreDefaultSettings } = useApp();

  const [formState, setFormState] = useState<AppSettings>(settings);
  const [saveFeedback, setSaveFeedback] = useState(false);

  const handleSave = () => {
    updateSettings(formState);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2500);
  };

  const handleReset = () => {
    restoreDefaultSettings();
    setFormState(settings);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2500);
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center space-x-2.5">
            <Settings className="w-5 sm:w-6 h-5 sm:h-6 text-purple-400 shrink-0" />
            <span>Telemetry & Risk Engine Settings</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure risk thresholds, simulation tick speeds, and scoring weights that parameterize the deterministic analysis engine.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleReset}
            className="flex items-center space-x-1.5 bg-[#161D2B] hover:bg-[#1E2638] text-slate-300 border border-[#263244] text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Restore Defaults</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-md transition-all hover:scale-[1.02]"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {saveFeedback && (
        <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-3 flex items-center space-x-2 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Settings saved to localStorage and applied to cluster risk calculations!</span>
        </div>
      )}

      {/* Thresholds Section */}
      <div className="bg-[#111827] border border-[#263244] rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>Health & Risk Classification Thresholds (0 - 100)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-slate-300 font-medium">Warning Threshold (At Risk):</span>
              <span className="font-mono font-bold text-amber-400">{formState.warningThreshold} / 100</span>
            </div>
            <input
              type="range"
              min="15"
              max="50"
              value={formState.warningThreshold}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, warningThreshold: Number(e.target.value) }))
              }
              className="w-full accent-amber-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Scores above this mark transition service health to 'At Risk'.
            </span>
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-slate-300 font-medium">Critical Threshold (Cascade Trigger):</span>
              <span className="font-mono font-bold text-red-400">{formState.criticalThreshold} / 100</span>
            </div>
            <input
              type="range"
              min="65"
              max="95"
              value={formState.criticalThreshold}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, criticalThreshold: Number(e.target.value) }))
              }
              className="w-full accent-red-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Scores above this mark transition service health to 'Critical'.
            </span>
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-slate-300 font-medium">Propagation Sensitivity:</span>
              <span className="font-mono font-bold text-purple-400">{formState.propagationThreshold}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="80"
              value={formState.propagationThreshold}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, propagationThreshold: Number(e.target.value) }))
              }
              className="w-full accent-purple-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Threshold sensitivity for downstream risk escalation.
            </span>
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-slate-300 font-medium">Simulation Step Tick Speed:</span>
              <span className="font-mono font-bold text-cyan-400">{formState.simulationSpeedMs}ms</span>
            </div>
            <input
              type="range"
              min="600"
              max="3000"
              step="100"
              value={formState.simulationSpeedMs}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, simulationSpeedMs: Number(e.target.value) }))
              }
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Time delay between automated simulation timeline steps.
            </span>
          </div>
        </div>
      </div>

      {/* Risk Engine Weights */}
      <div className="bg-[#111827] border border-[#263244] rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Zap className="w-4 h-4 text-purple-400" />
          <span>Risk-Scoring Formula Relative Weights</span>
        </h3>

        <div className="space-y-3 text-xs">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-300">Error Rate Anomaly Weight</span>
              <span className="font-mono text-white font-bold">{Math.round(formState.weights.errorRate * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.5"
              step="0.05"
              value={formState.weights.errorRate}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  weights: { ...prev.weights, errorRate: Number(e.target.value) },
                }))
              }
              className="w-full accent-purple-500"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-300">Latency Anomaly Weight</span>
              <span className="font-mono text-white font-bold">{Math.round(formState.weights.latency * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.5"
              step="0.05"
              value={formState.weights.latency}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  weights: { ...prev.weights, latency: Number(e.target.value) },
                }))
              }
              className="w-full accent-purple-500"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-300">Dependency Health Drag Weight</span>
              <span className="font-mono text-white font-bold">{Math.round(formState.weights.dependencyHealth * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.4"
              step="0.05"
              value={formState.weights.dependencyHealth}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  weights: { ...prev.weights, dependencyHealth: Number(e.target.value) },
                }))
              }
              className="w-full accent-purple-500"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-300">Resource Saturation Weight (CPU + Mem)</span>
              <span className="font-mono text-white font-bold">{Math.round(formState.weights.resourcePressure * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.3"
              step="0.05"
              value={formState.weights.resourcePressure}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  weights: { ...prev.weights, resourcePressure: Number(e.target.value) },
                }))
              }
              className="w-full accent-purple-500"
            />
          </div>
        </div>
      </div>

      {/* About & Copyright Attribution */}
      <div className="bg-[#111827] border border-[#263244] rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-[#263244] pb-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-white">About FaultLens AI</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono font-semibold">
              v1.0.0
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">Enterprise Observability Edition</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          AI-Powered Cascading Software Failure Prediction & Recovery Platform. Engineered for deterministic microservice dependency propagation analysis, rule-based root cause evidence triangulation, and automated recovery planning.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 font-mono border-t border-[#263244]/60 gap-1 select-text">
          <span>Platform: FaultLens AI (AIOps Cluster Suite)</span>
          <span>© 2026 Ayush Singh. All rights reserved.</span>
        </div>
      </div>
    </div>
  );
};
