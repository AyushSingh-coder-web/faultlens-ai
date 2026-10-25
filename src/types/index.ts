export type ServiceId =
  | 'api-gateway'
  | 'auth-service'
  | 'orders-service'
  | 'payment-service'
  | 'inventory-service'
  | 'postgres-db'
  | 'redis-cache'
  | 'message-queue'
  | 'notification-service';

export type HealthState = 'Healthy' | 'At Risk' | 'Degraded' | 'Critical' | 'Recovering';

export type ServiceCategory = 'gateway' | 'compute' | 'database' | 'cache' | 'messaging' | 'worker';

export interface MetricPoint {
  timestamp: string;
  latency: number; // ms
  errorRate: number; // %
  cpu: number; // %
  memory: number; // %
}

export interface ServiceNode {
  id: ServiceId;
  name: string;
  category: ServiceCategory;
  state: HealthState;
  riskScore: number; // 0 - 100
  latency: number; // ms
  errorRate: number; // %
  cpu: number; // %
  memory: number; // %
  connectionPoolUtil?: number; // % (for DB)
  queueBacklog?: number; // count (for MQ)
  rps: number; // requests/sec
  replicas: number;
  tier: number; // 0: Edge, 1: Core, 2: Infrastructure / Storage
  description: string;
  upstream: ServiceId[]; // services that call this service
  downstream: ServiceId[]; // services this service calls
  metricsHistory: MetricPoint[];
  riskFactors: string[];
}

export interface DependencyEdge {
  id: string;
  source: ServiceId; // caller
  target: ServiceId; // callee
  protocol: 'HTTP/REST' | 'gRPC' | 'TCP/Pool' | 'AMQP' | 'RESP';
  isSynchronous: boolean;
  criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  timeoutMs: number;
  status: 'NORMAL' | 'DEGRADED' | 'SEVERED';
}

export type FailureScenarioId =
  | 'db-connection-pool-exhaustion'
  | 'high-db-latency'
  | 'memory-pressure-leak'
  | 'service-crash'
  | 'message-queue-backlog'
  | 'elevated-api-error-rate';

export interface FailureScenario {
  id: FailureScenarioId;
  title: string;
  description: string;
  rootService: ServiceId;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimatedPropagationTimeSec: number;
  typicalSymptoms: string[];
  defaultParams: {
    latencyMultiplier?: number;
    errorRateTarget?: number;
    poolSaturationTarget?: number;
    queueBacklogTarget?: number;
    memoryTarget?: number;
  };
}

export interface SimulationStep {
  stepIndex: number;
  timestamp: string;
  timeOffsetSec: number;
  serviceId: ServiceId;
  title: string;
  description: string;
  eventType: 'FAULT_INJECTED' | 'PROPAGATION' | 'SECONDARY_DEGRADATION' | 'CASCADE_CRITICAL' | 'USER_IMPACT';
  riskDelta: number;
  currentRiskScore: number;
  affectedDownstream: ServiceId[];
  systemAvailability: number;
  logsGenerated: string[];
}

export interface SimulationState {
  isActive: boolean;
  isPaused: boolean;
  currentStepIndex: number;
  totalSteps: number;
  scenarioId: FailureScenarioId | null;
  rootServiceId: ServiceId | null;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  steps: SimulationStep[];
  startedAt?: string;
  completedAt?: string;
  propagationPath: ServiceId[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  severity: 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  service: ServiceId;
  serviceName: string;
  message: string;
  correlationId: string;
  latencyMs?: number;
  errorCode?: string;
  metadata?: Record<string, any>;
  isAnomaly?: boolean;
}

export interface EvidenceItem {
  id: string;
  type: 'METRIC' | 'LOG' | 'TOPOLOGY';
  title: string;
  description: string;
  service: ServiceId;
  confidenceImpact: number; // 0 - 100
  timestamp?: string;
}

export interface RootCauseAnalysis {
  incidentId: string;
  timestamp: string;
  probableCause: string;
  rootService: ServiceId;
  rootServiceName: string;
  confidence: number; // 0 - 100
  uncertaintyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  observations: string[];
  hypotheses: string[];
  supportingEvidence: EvidenceItem[];
  alternativeExplanations: string[];
  recommendedInvestigation: string[];
  aiNarrative?: string;
  isAiGenerated?: boolean;
}

export interface RecoveryStrategy {
  id: string;
  title: string;
  description: string;
  applicableScenarios: FailureScenarioId[];
  applicableServices: ServiceId[];
  riskReductionPct: number; // 0 - 100
  targetServicesRecovered: ServiceId[];
  estimatedRecoveryTimeSec: number;
  userImpactEstimate: 'NONE' | 'LOW' | 'MODERATE' | 'HIGH';
  operationalComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
  tradeOffs: string[];
  potentialSideEffects: string[];
  score: number; // 0 - 100 rank
  actionType: 'CONFIG_CHANGE' | 'REPLICA_SCALE' | 'RESTART' | 'CIRCUIT_BREAK' | 'TRAFFIC_SHED';
}

export interface IncidentRecord {
  id: string;
  scenarioId: FailureScenarioId;
  scenarioTitle: string;
  rootService: ServiceId;
  rootServiceName: string;
  startedAt: string;
  resolvedAt?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedServices: ServiceId[];
  propagationPath: ServiceId[];
  probableRootCause: string;
  selectedRecoveryStrategy?: string;
  status: 'ACTIVE' | 'RESOLVED' | 'SIMULATED';
  riskScorePeak: number;
  availabilityDip: number; // %
  beforeState: Record<ServiceId, { state: HealthState; riskScore: number; latency: number; errorRate: number }>;
  afterState?: Record<ServiceId, { state: HealthState; riskScore: number; latency: number; errorRate: number }>;
  rcaSummary?: RootCauseAnalysis;
}

export interface AppSettings {
  warningThreshold: number; // default: 30
  criticalThreshold: number; // default: 80
  propagationThreshold: number; // default: 40
  simulationSpeedMs: number; // default: 1200
  weights: {
    latency: number;
    errorRate: number;
    resourcePressure: number;
    dependencyHealth: number;
    connectionPool: number;
  };
  recoveryWeights: {
    riskReduction: number;
    speed: number;
    lowComplexity: number;
  };
}

export type ActiveTab =
  | 'overview'
  | 'topology'
  | 'simulator'
  | 'logs'
  | 'rca'
  | 'recovery'
  | 'history'
  | 'settings';
