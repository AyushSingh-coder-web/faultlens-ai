import React from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock,
  Compass,
  Database,
  FileText,
  HelpCircle,
  Lightbulb,
  ListChecks,
  Network,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const RootCauseAnalysisView: React.FC = () => {
  const {
    rcaAnalysis,
    activeIncident,
    services,
    analyzeCurrentIncident,
    requestGeminiExplanation,
    isAiLoading,
    aiAvailable,
    setActiveTab,
  } = useApp();

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center space-x-2.5">
            <Compass className="w-5 sm:w-6 h-5 sm:h-6 text-cyan-400 shrink-0" />
            <span>Root Cause Analysis & Incident Intelligence</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Rule-based evidence triangulation combining temporal ordering, topology paths, and telemetry anomalies.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={analyzeCurrentIncident}
            className="flex items-center space-x-1.5 bg-[#161D2B] hover:bg-[#1E2638] text-slate-200 border border-[#263244] px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Re-evaluate Evidence</span>
          </button>

          <button
            onClick={() => setActiveTab('recovery')}
            className="flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-md transition-all hover:scale-[1.02]"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Compare Recovery Plans →</span>
          </button>
        </div>
      </div>

      {!rcaAnalysis ? (
        <div className="bg-[#111827] border border-[#263244] rounded-2xl p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-600/10 border border-purple-500/30 flex items-center justify-center mx-auto">
            <Compass className="w-7 h-7 text-purple-400" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-white">No Active Incident Analysis Loaded</h3>
            <p className="text-xs text-slate-400 mt-1">
              Trigger a failure simulation from the simulator or run the 3-minute demo to isolate and diagnose cascading root causes.
            </p>
          </div>
          <div className="flex justify-center space-x-3 pt-2">
            <button
              onClick={analyzeCurrentIncident}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Run Analysis on Current Cluster State
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className="bg-[#161D2B] hover:bg-[#1E2638] text-slate-300 border border-[#263244] text-xs font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Open Failure Simulator
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Hero Diagnosis Card */}
          <div className="bg-gradient-to-r from-purple-950/40 via-[#111827] to-[#161D2B] border border-purple-500/40 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#263244] pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
                  <AlertOctagon className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="font-mono text-purple-400 font-bold">{rcaAnalysis.incidentId}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">Diagnosis Generated</span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-0.5">{rcaAnalysis.probableCause}</h2>
                </div>
              </div>

              {/* Confidence Gauge */}
              <div className="flex items-center space-x-3 bg-[#0D111B] p-2.5 rounded-xl border border-[#263244] shrink-0">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Analysis Confidence</div>
                  <div className="text-sm font-semibold text-emerald-400">
                    {rcaAnalysis.uncertaintyLevel} Uncertainty
                  </div>
                </div>
                <div className="text-2xl font-black text-cyan-400 font-mono pl-2 border-l border-[#263244]">
                  {rcaAnalysis.confidence}%
                </div>
              </div>
            </div>

            {/* Path & Blast Radius Chips */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#161D2B] border border-[#263244]">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Originating Suspect Node</span>
                <span className="text-sm font-bold text-white mt-1 block">{rcaAnalysis.rootServiceName}</span>
                <span className="text-[10px] text-purple-400">ID: {rcaAnalysis.rootService}</span>
              </div>

              <div className="p-3 rounded-lg bg-[#161D2B] border border-[#263244]">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Inferred Propagation Path</span>
                <div className="text-xs font-mono text-cyan-300 mt-1 truncate">
                  {(activeIncident?.propagationPath || [rcaAnalysis.rootService, 'orders-service', 'api-gateway']).join(' → ')}
                </div>
                <span className="text-[10px] text-slate-400">Upward synchronous dependency drag</span>
              </div>

              <div className="p-3 rounded-lg bg-[#161D2B] border border-[#263244]">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Blast Radius</span>
                <span className="text-sm font-bold text-amber-400 mt-1 block">
                  {activeIncident?.affectedServices.length || 3} Services Degraded
                </span>
                <span className="text-[10px] text-slate-400">6 Services Resiliently Isolated</span>
              </div>
            </div>
          </div>

          {/* Core Reasoning Grid: Observations vs Hypotheses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Direct Telemetry Observations */}
            <div className="bg-[#111827] border border-[#263244] rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-sm font-bold text-white">
                <Search className="w-4 h-4 text-cyan-400" />
                <span>Empirical Telemetry Observations</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Directly measured metrics and confirmed log signals observed in the time window:
              </p>
              <div className="space-y-2">
                {rcaAnalysis.observations.map((obs, i) => (
                  <div key={i} className="flex items-start space-x-2.5 p-2.5 rounded-lg bg-[#161D2B] border border-[#263244]">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-200 leading-relaxed">{obs}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Inferred Hypotheses & Bottlenecks */}
            <div className="bg-[#111827] border border-[#263244] rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-sm font-bold text-white">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>Probable Bottleneck Hypotheses</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Deductive hypotheses explaining the underlying physical mechanism:
              </p>
              <div className="space-y-2">
                {rcaAnalysis.hypotheses.map((hyp, i) => (
                  <div key={i} className="flex items-start space-x-2.5 p-2.5 rounded-lg bg-[#161D2B] border border-[#263244]">
                    <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-200 leading-relaxed">{hyp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Triangulated Supporting Evidence Table */}
          <div className="bg-[#111827] border border-[#263244] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Triangulated Supporting Evidence</h3>
                <p className="text-[11px] text-slate-400">
                  Explicit points of corroboration scored by the deterministic analysis engine
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {rcaAnalysis.supportingEvidence.length} Evidence Vectors
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rcaAnalysis.supportingEvidence.map((ev) => (
                <div key={ev.id} className="p-3.5 rounded-xl bg-[#161D2B] border border-[#263244] space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                        ev.type === 'METRIC'
                          ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                          : ev.type === 'LOG'
                          ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                          : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {ev.type} EVIDENCE
                    </span>
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      +{ev.confidenceImpact}% Confidence
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white">{ev.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{ev.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Alternative Explanations & Recommended Investigations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Alternative Explanations */}
            <div className="bg-[#111827] border border-[#263244] rounded-xl p-5 shadow-sm space-y-3">
              <span className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                Alternative Hypotheses Considered
              </span>
              <div className="space-y-2">
                {rcaAnalysis.alternativeExplanations.map((alt, i) => (
                  <div key={i} className="p-2.5 rounded bg-[#161D2B] border border-[#263244] text-xs text-slate-300">
                    <span className="text-slate-500 font-bold mr-1.5">ALT-{i + 1}:</span>
                    {alt}
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Investigation Steps */}
            <div className="bg-[#111827] border border-[#263244] rounded-xl p-5 shadow-sm space-y-3">
              <span className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                Recommended SRE Next Steps
              </span>
              <div className="space-y-2">
                {rcaAnalysis.recommendedInvestigation.map((step, i) => (
                  <div key={i} className="flex items-start space-x-2 p-2.5 rounded bg-[#161D2B] border border-[#263244] text-xs text-slate-300">
                    <span className="w-4 h-4 rounded bg-purple-900/60 text-purple-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Gemini AI Incident Narrative Section */}
          <div className="bg-gradient-to-r from-purple-950/30 via-[#111827] to-[#161D2B] border border-purple-500/40 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Gemini AI SRE Incident Briefing</h3>
                  <p className="text-[11px] text-slate-400">
                    Natural-language incident postmortem synthesizing logs, metrics anomalies, and mitigation tradeoffs.
                  </p>
                </div>
              </div>

              <button
                onClick={requestGeminiExplanation}
                disabled={isAiLoading}
                className="flex items-center space-x-1.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-md transition-all hover:scale-[1.02] disabled:opacity-50 shrink-0"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin' : ''}`} />
                <span>{isAiLoading ? 'Generating SRE Narrative...' : 'Generate SRE Postmortem'}</span>
              </button>
            </div>

            {rcaAnalysis.aiNarrative ? (
              <div className="p-4 rounded-xl bg-[#080B12] border border-[#263244] space-y-3">
                <div className="flex items-center justify-between text-[11px] border-b border-[#263244] pb-2">
                  <span className="text-purple-300 font-semibold flex items-center space-x-1">
                    <Brain className="w-3.5 h-3.5 text-purple-400" />
                    <span>
                      {rcaAnalysis.isAiGenerated
                        ? 'Synthesized via Gemini 3.8 Flash'
                        : 'Deterministic SRE Rule Engine Synthesis'}
                    </span>
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    Strictly grounded in empirical telemetry
                  </span>
                </div>
                <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line font-sans">
                  {rcaAnalysis.aiNarrative}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#161D2B]/60 border border-[#263244] text-xs text-slate-400 text-center">
                Click "Generate SRE Postmortem" to synthesize a natural-language executive report using Gemini 3.8 Flash.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
