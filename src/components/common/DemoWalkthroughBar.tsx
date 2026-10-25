import React from 'react';
import { ArrowRight, CheckCircle2, FastForward, HelpCircle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DemoWalkthroughBar: React.FC = () => {
  const { demoGuideStep, advanceDemoGuide, dismissDemoGuide } = useApp();

  if (demoGuideStep === null) return null;

  const demoStepsInfo: Record<
    number,
    { title: string; desc: string; targetTab: string; actionLabel: string }
  > = {
    1: {
      title: 'Step 1/10: Healthy Baseline Overview',
      desc: 'All 9 services are currently operating within baseline SLA tolerances. Review the operational KPIs and latency distribution before triggering the incident.',
      targetTab: 'Overview',
      actionLabel: 'Proceed: Launch Failure Simulation',
    },
    2: {
      title: 'Step 2/10: Launch Preset Failure Scenario',
      desc: 'Preset active: "Database Connection-Pool Exhaustion". The simulation engine is injecting HikariCP connection starvation into PostgreSQL.',
      targetTab: 'Failure Simulator',
      actionLabel: 'Watch Propagation in Topology',
    },
    3: {
      title: 'Step 3/10: Watch Cascade Ripple Across Dependencies',
      desc: 'Notice how the failure cascades upward: PostgreSQL degrades first -> Orders & Payment saturate -> API Gateway trips circuit breaker. Redis Cache remains untouched!',
      targetTab: 'Service Topology',
      actionLabel: 'Inspect Generated Incident Logs',
    },
    4: {
      title: 'Step 4/10: Inspect Telemetry & Correlated Logs',
      desc: 'Examine the real-time HikariPool-1 timeout exceptions, transaction acquisition failures, and correlation IDs matching the cascading timeline.',
      targetTab: 'Log Explorer',
      actionLabel: 'Run Root Cause Analysis (RCA)',
    },
    5: {
      title: 'Step 5/10: Trigger Evidence-Based Root Cause Analysis',
      desc: 'The deterministic RCA engine cross-references topology paths, log timestamps, and metric deviations to isolate the root bottleneck.',
      targetTab: 'Root Cause Analysis',
      actionLabel: 'Review Evidence & Confidence Score',
    },
    6: {
      title: 'Step 6/10: Review RCA Observations, Hypotheses & AI Briefing',
      desc: 'Review the 92% confidence rating, physical bottleneck breakdown, and optional Gemini AI postmortem briefing.',
      targetTab: 'Root Cause Analysis',
      actionLabel: 'Compare Recovery Strategies',
    },
    7: {
      title: 'Step 7/10: Compare 3 Tailored Recovery Strategies',
      desc: 'Evaluate 3 deterministic strategies with transparent trade-offs: Connection Pool Expansion vs Circuit Breaking vs Database Failover.',
      targetTab: 'Recovery Planner',
      actionLabel: 'Execute Simulated Recovery',
    },
    8: {
      title: 'Step 8/10: Execute Recovery Mitigation',
      desc: 'Execute "Expand Connection Pool & Route Reads to Replica". Watch target services recover with automatic state transition animation.',
      targetTab: 'Recovery Planner',
      actionLabel: 'Inspect Restored Health & Incident Report',
    },
    9: {
      title: 'Step 9/10: Review Restored Cluster & Incident Record',
      desc: 'Cluster health is restored to 99.98% availability. The full incident postmortem is permanently archived in localStorage.',
      targetTab: 'Overview / History',
      actionLabel: 'Reset Demo to Initial Baseline',
    },
    10: {
      title: 'Step 10/10: Demo Completed!',
      desc: 'Complete full-cycle AIOps workflow demonstrated. Click to reset all state to pristine initial baseline.',
      targetTab: 'Overview',
      actionLabel: 'Reset to Clean Baseline',
    },
  };

  const currentInfo = demoStepsInfo[demoGuideStep] || demoStepsInfo[1];

  return (
    <div className="bg-gradient-to-r from-purple-950/95 via-indigo-950/95 to-[#111827] border-b border-purple-500/40 px-3 sm:px-6 py-2 sm:py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-lg select-none">
      <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
        <div className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg bg-purple-600/30 border border-purple-400/40 flex items-center justify-center shrink-0">
          <FastForward className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-purple-300" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] sm:text-xs font-bold text-purple-200 tracking-wide uppercase truncate">
              {currentInfo.title}
            </span>
            <span className="text-[9px] sm:text-[10px] bg-purple-900/60 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded font-medium">
              {currentInfo.targetTab}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-300 line-clamp-1 max-w-3xl">{currentInfo.desc}</p>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end space-x-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-purple-900/40">
        <button
          onClick={advanceDemoGuide}
          className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 bg-purple-600 hover:bg-purple-500 text-white text-[11px] sm:text-xs font-semibold px-3 py-1.5 rounded-lg shadow transition-all hover:scale-[1.02]"
        >
          <span className="truncate">{currentInfo.actionLabel}</span>
          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
        </button>
        <button
          onClick={dismissDemoGuide}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors shrink-0"
          title="Exit guided walk-through"
          aria-label="Exit walkthrough"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
