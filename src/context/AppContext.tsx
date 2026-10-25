import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ActiveTab,
  AppSettings,
  DependencyEdge,
  FailureScenarioId,
  IncidentRecord,
  LogEntry,
  RecoveryStrategy,
  RootCauseAnalysis,
  ServiceId,
  ServiceNode,
  SimulationState,
} from '../types';
import { generateIncidentLogs, generateInitialLogs } from '../engine/logGenerator';
import { clearIncidentHistory, loadSavedIncidents, loadSavedSettings, saveIncident, saveSettings } from '../engine/persistence';
import { buildFailureSimulation } from '../engine/propagationEngine';
import { executeSimulatedRecovery, getApplicableStrategies } from '../engine/recoveryEngine';
import { calculateServiceRisk, DEFAULT_SETTINGS } from '../engine/riskEngine';
import { runRootCauseAnalysis } from '../engine/rootCauseEngine';
import { DEPENDENCY_EDGES, FAILURE_SCENARIOS, INITIAL_SERVICES } from '../engine/topologyData';

interface AppContextValue {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  environment: 'Production' | 'Staging' | 'Development';
  setEnvironment: (env: 'Production' | 'Staging' | 'Development') => void;
  services: Record<ServiceId, ServiceNode>;
  edges: DependencyEdge[];
  logs: LogEntry[];
  simulationState: SimulationState;
  activeIncident: IncidentRecord | null;
  rcaAnalysis: RootCauseAnalysis | null;
  applicableStrategies: RecoveryStrategy[];
  selectedStrategy: RecoveryStrategy | null;
  setSelectedStrategy: (strat: RecoveryStrategy | null) => void;
  incidentHistory: IncidentRecord[];
  settings: AppSettings;
  updateSettings: (newSettings: AppSettings) => void;
  restoreDefaultSettings: () => void;
  selectedServiceId: ServiceId | null;
  setSelectedServiceId: (id: ServiceId | null) => void;
  isAiLoading: boolean;
  aiAvailable: boolean;

  // Actions
  startSimulation: (scenarioId: FailureScenarioId, severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') => void;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  stepSimulationForward: () => void;
  replaySimulation: () => void;
  resetSimulation: () => void;
  runPresetDemo: () => void;
  analyzeCurrentIncident: () => void;
  requestGeminiExplanation: () => Promise<void>;
  executeRecovery: (strategy: RecoveryStrategy) => void;
  clearHistory: () => void;
  resetAllToBaseline: () => void;

  // Responsive Layout States
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;

  // 3-Minute Guided Demo walkthrough state
  demoGuideStep: number | null;
  advanceDemoGuide: () => void;
  dismissDemoGuide: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [environment, setEnvironment] = useState<'Production' | 'Staging' | 'Development'>('Production');
  const [settings, setSettings] = useState<AppSettings>(() => loadSavedSettings());
  const [services, setServices] = useState<Record<ServiceId, ServiceNode>>(() => JSON.parse(JSON.stringify(INITIAL_SERVICES)));
  const [edges, setEdges] = useState<DependencyEdge[]>(() => JSON.parse(JSON.stringify(DEPENDENCY_EDGES)));
  const [logs, setLogs] = useState<LogEntry[]>(() => generateInitialLogs());
  const [selectedServiceId, setSelectedServiceId] = useState<ServiceId | null>(null);
  const [incidentHistory, setIncidentHistory] = useState<IncidentRecord[]>(() => loadSavedIncidents());

  const [simulationState, setSimulationState] = useState<SimulationState>({
    isActive: false,
    isPaused: false,
    currentStepIndex: 0,
    totalSteps: 0,
    scenarioId: null,
    rootServiceId: null,
    severity: 'CRITICAL',
    steps: [],
    propagationPath: [],
  });

  const [activeIncident, setActiveIncident] = useState<IncidentRecord | null>(null);
  const [rcaAnalysis, setRcaAnalysis] = useState<RootCauseAnalysis | null>(null);
  const [applicableStrategies, setApplicableStrategies] = useState<RecoveryStrategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<RecoveryStrategy | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiAvailable, setAiAvailable] = useState<boolean>(false);

  // Guided demo walkthrough
  const [demoGuideStep, setDemoGuideStep] = useState<number | null>(null);

  // Responsive sidebar states
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Close mobile menu on tab change or window resize to desktop
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeTab]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check backend health & Gemini status on mount
  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.geminiConfigured) {
          setAiAvailable(true);
        }
      })
      .catch(() => {
        // Fallback gracefully if API not ready
        setAiAvailable(false);
      });
  }, []);

  // Update edges when services change
  const updateEdgeStatuses = (currentServices: Record<ServiceId, ServiceNode>) => {
    setEdges((prevEdges) =>
      prevEdges.map((edge) => {
        const sourceNode = currentServices[edge.source];
        const targetNode = currentServices[edge.target];
        if (targetNode?.state === 'Critical' || targetNode?.riskScore >= 80) {
          return { ...edge, status: 'SEVERED' };
        }
        if (targetNode?.state === 'Degraded' || targetNode?.riskScore >= 60 || sourceNode?.riskScore >= 60) {
          return { ...edge, status: 'DEGRADED' };
        }
        return { ...edge, status: 'NORMAL' };
      })
    );
  };

  // Start a new simulation
  const startSimulation = (
    scenarioId: FailureScenarioId,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'CRITICAL'
  ) => {
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
    }

    const simResult = buildFailureSimulation(scenarioId, 1.0, settings);
    const scenario = FAILURE_SCENARIOS.find((s) => s.id === scenarioId) || FAILURE_SCENARIOS[0];

    const incidentId = `INC-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 899 + 100)}`;
    const newIncident: IncidentRecord = {
      id: incidentId,
      scenarioId,
      scenarioTitle: scenario.title,
      rootService: scenario.rootService,
      rootServiceName: INITIAL_SERVICES[scenario.rootService]?.name || scenario.rootService,
      startedAt: new Date().toISOString(),
      severity,
      affectedServices: simResult.affectedServices,
      propagationPath: simResult.propagationPath,
      probableRootCause: `Cascading outage originating from ${INITIAL_SERVICES[scenario.rootService]?.name}`,
      status: 'ACTIVE',
      riskScorePeak: 88,
      availabilityDip: 100 - simResult.userFacingImpact.availabilityPct,
      beforeState: Object.fromEntries(
        Object.entries(INITIAL_SERVICES).map(([id, s]) => [
          id as ServiceId,
          { state: s.state, riskScore: s.riskScore, latency: s.latency, errorRate: s.errorRate },
        ])
      ) as any,
    };

    setActiveIncident(newIncident);
    setSimulationState({
      isActive: true,
      isPaused: false,
      currentStepIndex: 0,
      totalSteps: simResult.steps.length,
      scenarioId,
      rootServiceId: scenario.rootService,
      severity,
      steps: simResult.steps,
      startedAt: new Date().toISOString(),
      propagationPath: simResult.propagationPath,
    });

    // Reset services to clean baseline first, then animate steps
    setServices(JSON.parse(JSON.stringify(INITIAL_SERVICES)));
    setLogs(generateInitialLogs());
    setRcaAnalysis(null);
    setSelectedStrategy(null);

    // Auto-advance steps
    let currentStep = 0;
    simulationTimerRef.current = setInterval(() => {
      currentStep += 1;
      if (currentStep < simResult.steps.length) {
        setSimulationState((prev) => ({ ...prev, currentStepIndex: currentStep }));

        // Apply progressive degradation
        if (currentStep === 1) {
          // Fault injected at root
          setServices((prev) => {
            const next = { ...prev };
            const root = next[scenario.rootService];
            if (scenarioId === 'db-connection-pool-exhaustion') {
              root.connectionPoolUtil = 98;
              root.latency = 920;
              root.state = 'Critical';
              root.riskScore = 88;
            } else {
              root.state = 'Critical';
              root.riskScore = 86;
              root.latency *= 8;
            }
            updateEdgeStatuses(next);
            return next;
          });
        } else if (currentStep === 2) {
          // First-hop cascade
          setServices((prev) => {
            const next = { ...prev };
            simResult.affectedServices.slice(1, 3).forEach((affId) => {
              if (next[affId]) {
                next[affId].state = 'Degraded';
                next[affId].riskScore = 75;
                next[affId].latency *= 6;
                next[affId].errorRate = 12.5;
              }
            });
            updateEdgeStatuses(next);
            return next;
          });
        } else if (currentStep >= 3) {
          // Full cascade
          setServices(simResult.finalState);
          setLogs(generateIncidentLogs(scenarioId, simResult.finalState));
          updateEdgeStatuses(simResult.finalState);

          // Prepare strategies
          const strategies = getApplicableStrategies(scenarioId, scenario.rootService, settings);
          setApplicableStrategies(strategies);
          if (strategies.length > 0) {
            setSelectedStrategy(strategies[0]);
          }

          // Precompute deterministic RCA
          const rca = runRootCauseAnalysis(scenarioId, simResult.finalState, generateIncidentLogs(scenarioId, simResult.finalState));
          setRcaAnalysis(rca);
        }
      } else {
        if (simulationTimerRef.current) {
          clearInterval(simulationTimerRef.current);
          simulationTimerRef.current = null;
        }
        setSimulationState((prev) => ({
          ...prev,
          isActive: false,
          completedAt: new Date().toISOString(),
        }));
      }
    }, settings.simulationSpeedMs);
  };

  const pauseSimulation = () => {
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
    setSimulationState((prev) => ({ ...prev, isPaused: true }));
  };

  const resumeSimulation = () => {
    if (!simulationState.scenarioId) return;
    setSimulationState((prev) => ({ ...prev, isPaused: false }));
    // Step forward
    stepSimulationForward();
  };

  const stepSimulationForward = () => {
    setSimulationState((prev) => {
      const nextIndex = Math.min(prev.totalSteps - 1, prev.currentStepIndex + 1);
      return { ...prev, currentStepIndex: nextIndex };
    });
  };

  const replaySimulation = () => {
    if (simulationState.scenarioId) {
      startSimulation(simulationState.scenarioId, simulationState.severity);
    }
  };

  const resetSimulation = () => {
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
    setSimulationState({
      isActive: false,
      isPaused: false,
      currentStepIndex: 0,
      totalSteps: 0,
      scenarioId: null,
      rootServiceId: null,
      severity: 'CRITICAL',
      steps: [],
      propagationPath: [],
    });
    setServices(JSON.parse(JSON.stringify(INITIAL_SERVICES)));
    setEdges(JSON.parse(JSON.stringify(DEPENDENCY_EDGES)));
    setLogs(generateInitialLogs());
    setActiveIncident(null);
    setRcaAnalysis(null);
    setSelectedStrategy(null);
  };

  const resetAllToBaseline = () => {
    resetSimulation();
    setDemoGuideStep(null);
  };

  // Run Signature 3-minute Preset Demo Workflow
  const runPresetDemo = () => {
    // Jump straight to Overview & start preset demo guide
    setActiveTab('overview');
    setDemoGuideStep(1);
    startSimulation('db-connection-pool-exhaustion', 'CRITICAL');
  };

  const advanceDemoGuide = () => {
    if (demoGuideStep === null) return;
    const nextStep = demoGuideStep + 1;
    setDemoGuideStep(nextStep);

    // Contextually switch tabs according to the 10-step demo specification:
    // 1: Healthy Dashboard (Overview)
    // 2: Launch Preset Incident (Simulator)
    // 3: Watch Failure Propagate (Topology)
    // 4: Inspect Generated Logs (Logs)
    // 5: Run Root-Cause Analysis (RCA)
    // 6: Review Evidence & Probable Cause (RCA)
    // 7: Compare Three Applicable Recovery Strategies (Recovery)
    // 8: Select and Execute Simulated Recovery (Recovery)
    // 9: Final Service Health & Incident Report (Overview/History)
    // 10: Reset Demo Complete
    if (nextStep === 2) {
      setActiveTab('simulator');
    } else if (nextStep === 3) {
      setActiveTab('topology');
    } else if (nextStep === 4) {
      setActiveTab('logs');
    } else if (nextStep === 5 || nextStep === 6) {
      setActiveTab('rca');
    } else if (nextStep === 7 || nextStep === 8) {
      setActiveTab('recovery');
    } else if (nextStep === 9) {
      setActiveTab('overview');
    } else if (nextStep >= 10) {
      resetAllToBaseline();
      setDemoGuideStep(null);
    }
  };

  const dismissDemoGuide = () => {
    setDemoGuideStep(null);
  };

  // Trigger RCA calculation
  const analyzeCurrentIncident = () => {
    const analysis = runRootCauseAnalysis(simulationState.scenarioId, services, logs);
    setRcaAnalysis(analysis);
    if (!applicableStrategies.length && simulationState.scenarioId) {
      const strats = getApplicableStrategies(simulationState.scenarioId, simulationState.rootServiceId, settings);
      setApplicableStrategies(strats);
      if (strats.length) setSelectedStrategy(strats[0]);
    }
  };

  // Optional Gemini AI Narrative generation
  const requestGeminiExplanation = async () => {
    if (!rcaAnalysis) return;
    setIsAiLoading(true);
    try {
      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident: activeIncident,
          rootCause: rcaAnalysis,
          affectedServices: Object.values(services).filter((s) => s.state !== 'Healthy'),
          logsSample: logs.slice(0, 10),
          recoveryStrategy: selectedStrategy,
        }),
      });
      const data = await response.json();
      if (data.available && data.narrative) {
        setRcaAnalysis((prev) => (prev ? { ...prev, aiNarrative: data.narrative, isAiGenerated: true } : prev));
      } else {
        // Fallback high-quality structured executive summary
        setRcaAnalysis((prev) =>
          prev
            ? {
                ...prev,
                aiNarrative: `[Deterministic SRE Analysis Summary]\n\nAt ${new Date().toLocaleTimeString()}, PostgreSQL experienced severe connection-pool exhaustion (98% utilization with HikariCP semaphore timeouts). Due to synchronous dependency coupling, the Orders Service thread pool became saturated waiting for database queries, triggering a cascade that manifested at the API Gateway with HTTP 504 Gateway Timeouts. Recovery via '${selectedStrategy?.title || 'Connection Pool Expansion'}' is the recommended mitigation to restore cluster availability.`,
                isAiGenerated: false,
              }
            : prev
        );
      }
    } catch (e) {
      console.error('AI explanation request failed:', e);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Execute Simulated Recovery
  const executeRecovery = (strategy: RecoveryStrategy) => {
    const recoveryOutcome = executeSimulatedRecovery(strategy, services);
    setServices(recoveryOutcome.recoveredServices);
    updateEdgeStatuses(recoveryOutcome.recoveredServices);

    // Prepend recovery logs
    const recoveryLogEntries: LogEntry[] = recoveryOutcome.recoveryLogs.map((msg, idx) => ({
      id: `rec-log-${Date.now()}-${idx}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(11, 19),
      severity: 'INFO',
      service: 'api-gateway',
      serviceName: 'Recovery Controller',
      message: msg,
      correlationId: `recov-${strategy.id}`,
    }));
    setLogs((prev) => [...recoveryLogEntries, ...prev]);

    // Save to Incident History in localStorage
    if (activeIncident) {
      const resolvedIncident: IncidentRecord = {
        ...activeIncident,
        resolvedAt: new Date().toISOString(),
        status: 'RESOLVED',
        selectedRecoveryStrategy: strategy.title,
        afterState: Object.fromEntries(
          Object.entries(recoveryOutcome.recoveredServices).map(([id, s]) => [
            id as ServiceId,
            { state: s.state, riskScore: s.riskScore, latency: s.latency, errorRate: s.errorRate },
          ])
        ) as any,
        rcaSummary: rcaAnalysis || undefined,
      };
      saveIncident(resolvedIncident);
      setIncidentHistory(loadSavedIncidents());
      setActiveIncident(resolvedIncident);
    }

    // Festive confetti feedback for successful recovery
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22C55E', '#22D3EE', '#8B5CF6'],
      });
    } catch {
      // Ignored if canvas not ready
    }
  };

  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    // Recalculate current service risk scores with updated weights/thresholds
    setServices((prev) => {
      const updated = { ...prev };
      Object.values(updated).forEach((srv) => {
        const evalResult = calculateServiceRisk(srv, updated, newSettings);
        srv.riskScore = evalResult.score;
        srv.state = evalResult.state;
      });
      return updated;
    });
  };

  const restoreDefaultSettings = () => {
    updateSettings(DEFAULT_SETTINGS);
  };

  const clearHistory = () => {
    clearIncidentHistory();
    setIncidentHistory([]);
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        environment,
        setEnvironment,
        services,
        edges,
        logs,
        simulationState,
        activeIncident,
        rcaAnalysis,
        applicableStrategies,
        selectedStrategy,
        setSelectedStrategy,
        incidentHistory,
        settings,
        updateSettings,
        restoreDefaultSettings,
        selectedServiceId,
        setSelectedServiceId,
        isAiLoading,
        aiAvailable,
        startSimulation,
        pauseSimulation,
        resumeSimulation,
        stepSimulationForward,
        replaySimulation,
        resetSimulation,
        runPresetDemo,
        analyzeCurrentIncident,
        requestGeminiExplanation,
        executeRecovery,
        clearHistory,
        resetAllToBaseline,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        demoGuideStep,
        advanceDemoGuide,
        dismissDemoGuide,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
