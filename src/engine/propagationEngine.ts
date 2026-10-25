import { AppSettings, DependencyEdge, FailureScenarioId, ServiceId, ServiceNode, SimulationStep } from '../types';
import { calculateServiceRisk } from './riskEngine';
import { DEPENDENCY_EDGES, FAILURE_SCENARIOS, INITIAL_SERVICES } from './topologyData';

export interface SimulationResult {
  steps: SimulationStep[];
  propagationPath: ServiceId[];
  affectedServices: ServiceId[];
  initialState: Record<ServiceId, ServiceNode>;
  finalState: Record<ServiceId, ServiceNode>;
  userFacingImpact: {
    availabilityPct: number;
    rpsImpacted: number;
    estimatedRevenueRiskPerMin: number;
    primaryUserSymptom: string;
  };
}

/**
 * Builds deterministic simulation timeline and step-by-step cascade propagation.
 */
export function buildFailureSimulation(
  scenarioId: FailureScenarioId,
  severityMultiplier: number = 1.0,
  settings: AppSettings
): SimulationResult {
  const scenario = FAILURE_SCENARIOS.find((s) => s.id === scenarioId) || FAILURE_SCENARIOS[0];
  const rootId = scenario.rootService;

  // Clone initial pristine services
  const state: Record<ServiceId, ServiceNode> = JSON.parse(JSON.stringify(INITIAL_SERVICES));
  const steps: SimulationStep[] = [];
  const propagationPath: ServiceId[] = [rootId];
  const affectedSet = new Set<ServiceId>([rootId]);

  // Step 0: Baseline state
  steps.push({
    stepIndex: 0,
    timestamp: 'T+00s',
    timeOffsetSec: 0,
    serviceId: rootId,
    title: 'Nominal Baseline Established',
    description: `All 9 services operating within baseline SLA tolerances. Cluster availability at 99.99%.`,
    eventType: 'FAULT_INJECTED',
    riskDelta: 0,
    currentRiskScore: state[rootId].riskScore,
    affectedDownstream: [],
    systemAvailability: 99.99,
    logsGenerated: [
      `[INFO] [${rootId}] HealthCheck: Nominal 200 OK. Latency: ${state[rootId].latency}ms`,
    ],
  });

  // Step 1: Initial Fault Injection at root service
  const rootService = state[rootId];
  if (scenarioId === 'db-connection-pool-exhaustion') {
    rootService.connectionPoolUtil = 98;
    rootService.latency = 920;
    rootService.cpu = 78;
    rootService.state = 'Critical';
    rootService.riskScore = 88;
    rootService.riskFactors = [
      'HikariCP connection pool exhausted (98% capacity utilized)',
      'Query wait times spiking to 920ms (vs 4ms baseline)',
      'Transaction acquisition semaphore timeouts',
    ];
  } else if (scenarioId === 'high-db-latency') {
    rootService.latency = 650;
    rootService.cpu = 85;
    rootService.riskScore = 74;
    rootService.state = 'Degraded';
    rootService.riskFactors = ['Storage EBS volume IOPS limit throttled, disk sync latency 650ms'];
  } else if (scenarioId === 'memory-pressure-leak') {
    rootService.memory = 95;
    rootService.latency = 520;
    rootService.errorRate = 8.5;
    rootService.state = 'Critical';
    rootService.riskScore = 86;
    rootService.riskFactors = ['JVM heap at 95%, GC pause duration > 4200ms'];
  } else if (scenarioId === 'service-crash') {
    rootService.errorRate = 84;
    rootService.replicas = 0;
    rootService.state = 'Critical';
    rootService.riskScore = 96;
    rootService.riskFactors = ['All 3 pods terminating in CrashLoopBackOff with code 139 (SIGSEGV)'];
  } else if (scenarioId === 'message-queue-backlog') {
    rootService.queueBacklog = 78500;
    rootService.latency = 45;
    rootService.state = 'Degraded';
    rootService.riskScore = 68;
    rootService.riskFactors = ['78,500 messages pending in dead letter exchange, publisher flow throttled'];
  } else if (scenarioId === 'elevated-api-error-rate') {
    rootService.errorRate = 42;
    rootService.latency = 280;
    rootService.state = 'Critical';
    rootService.riskScore = 85;
    rootService.riskFactors = ['Third party banking gateway connection timed out (HTTP 504 / 503 storm)'];
  }

  steps.push({
    stepIndex: 1,
    timestamp: 'T+04s',
    timeOffsetSec: 4,
    serviceId: rootId,
    title: `Direct Fault Manifestation in ${rootService.name}`,
    description: `Primary bottleneck manifested: ${rootService.riskFactors[0]}. Service state transitioned to ${rootService.state}.`,
    eventType: 'FAULT_INJECTED',
    riskDelta: rootService.riskScore - INITIAL_SERVICES[rootId].riskScore,
    currentRiskScore: rootService.riskScore,
    affectedDownstream: [],
    systemAvailability: 99.2,
    logsGenerated: [
      `[ERROR] [${rootId}] PoolExhaustion: HikariPool-1 - Connection is not available, request timed out after 15000ms`,
      `[WARN] [${rootId}] Active connections 98/100, pending thread waiters: 74`,
    ],
  });

  // Step 2: First-hop propagation to immediate synchronous callers
  // Find services that depend directly on rootId
  // E.g. For postgres-db: orders-service, payment-service, inventory-service, auth-service
  const firstHopCallers = Object.values(state).filter((s) => s.downstream.includes(rootId));

  if (scenarioId === 'db-connection-pool-exhaustion' || scenarioId === 'high-db-latency') {
    // Orders Service and Payment Service are the most critically affected
    const orders = state['orders-service'];
    const payment = state['payment-service'];

    orders.latency = 720;
    orders.errorRate = 12.4;
    orders.cpu = 68;
    orders.state = 'Critical';
    orders.riskScore = 84;
    orders.riskFactors = [
      'Downstream PostgreSQL connection pool saturated',
      'Thread pool exhaustion in checkout executor',
      'Response latency 720ms exceeds SLA limit (200ms)',
    ];
    affectedSet.add('orders-service');
    propagationPath.push('orders-service');

    payment.latency = 480;
    payment.errorRate = 8.6;
    payment.state = 'Degraded';
    payment.riskScore = 72;
    payment.riskFactors = ['Database transaction commit timeouts during payment ledger recording'];
    affectedSet.add('payment-service');
    propagationPath.push('payment-service');

    steps.push({
      stepIndex: 2,
      timestamp: 'T+09s',
      timeOffsetSec: 9,
      serviceId: 'orders-service',
      title: 'First-Hop Cascade: Orders & Payment Saturation',
      description: `Synchronous database callers experience connection acquisition lockups. Orders Service thread pool fills with blocked DB workers.`,
      eventType: 'PROPAGATION',
      riskDelta: 70,
      currentRiskScore: 84,
      affectedDownstream: ['orders-service', 'payment-service'],
      systemAvailability: 94.1,
      logsGenerated: [
        `[ERROR] [orders-service] CheckoutWorkflowException: Unable to acquire connection from pool HikariCP-orders after 3000ms`,
        `[WARN] [orders-service] Request queue depth 450, shedding excess incoming checkout requests`,
        `[ERROR] [payment-service] SettlementLedgerException: Timeout executing INSERT INTO ledger_entries`,
      ],
    });

    // Step 3: Second-hop propagation to API Gateway (Edge Ingress)
    const gateway = state['api-gateway'];
    gateway.latency = 1850;
    gateway.errorRate = 18.2;
    gateway.cpu = 54;
    gateway.state = 'Critical';
    gateway.riskScore = 82;
    gateway.riskFactors = [
      'Upstream orders-service response timeouts (> 3000ms)',
      'HTTP 504 Gateway Timeout rate spiked to 18.2%',
      'Worker connection pool exhausted on /api/v1/checkout route',
    ];
    affectedSet.add('api-gateway');
    propagationPath.push('api-gateway');

    steps.push({
      stepIndex: 3,
      timestamp: 'T+14s',
      timeOffsetSec: 14,
      serviceId: 'api-gateway',
      title: 'Second-Hop Cascade: Edge Ingress Degradation',
      description: `API Gateway connection backlog exhausts HTTP worker threads. End-user checkout requests receive HTTP 504 Gateway Timeout.`,
      eventType: 'CASCADE_CRITICAL',
      riskDelta: 74,
      currentRiskScore: 82,
      affectedDownstream: ['api-gateway'],
      systemAvailability: 81.8,
      logsGenerated: [
        `[ERROR] [api-gateway] GatewayTimeout: Upstream target 'orders-service:8080/v1/orders' timed out after 3000ms`,
        `[WARN] [api-gateway] Circuit breaker state for [orders-service] shifted from CLOSED to OPEN`,
      ],
    });

    // Step 4: Downstream Asynchronous Impact (Message Queue publisher flow control)
    const mq = state['message-queue'];
    mq.latency = 12;
    mq.queueBacklog = 1840;
    mq.riskScore = 24;
    mq.state = 'Healthy'; // Stays mostly healthy, demonstrates realistic isolation!

    // Step 5: Full Blast Radius & User Impact
    steps.push({
      stepIndex: 4,
      timestamp: 'T+18s',
      timeOffsetSec: 18,
      serviceId: 'api-gateway',
      title: 'Full Cascading Blast Radius Realized',
      description: `Failure propagation stabilized across 4 of 9 services. Unrelated services (Redis Cache, Notification Worker) remain resilient.`,
      eventType: 'USER_IMPACT',
      riskDelta: 0,
      currentRiskScore: 84,
      affectedDownstream: Array.from(affectedSet),
      systemAvailability: 78.4,
      logsGenerated: [
        `[FATAL] [api-gateway] Ingress availability dropped below SLA target (78.4% vs 99.99%)`,
        `[INFO] [redis-cache] Cluster healthy, 0 errors, cache hit ratio 96.2% (isolated from failure)`,
      ],
    });
  } else if (scenarioId === 'service-crash') {
    // Auth service crash -> API gateway fails
    const gateway = state['api-gateway'];
    gateway.errorRate = 48.5;
    gateway.state = 'Critical';
    gateway.riskScore = 89;
    affectedSet.add('api-gateway');
    propagationPath.push('api-gateway');

    steps.push({
      stepIndex: 2,
      timestamp: 'T+08s',
      timeOffsetSec: 8,
      serviceId: 'api-gateway',
      title: 'Direct Ingress Block: API Gateway Rejections',
      description: `API Gateway cannot authenticate inbound requests; rejects 48.5% of all traffic with HTTP 401 Unauthorized.`,
      eventType: 'CASCADE_CRITICAL',
      riskDelta: 81,
      currentRiskScore: 89,
      affectedDownstream: ['api-gateway'],
      systemAvailability: 51.5,
      logsGenerated: [
        `[ERROR] [api-gateway] No route found to healthy Auth instance (0/3 endpoints ready)`,
      ],
    });
  } else if (scenarioId === 'memory-pressure-leak') {
    // Orders service memory leak -> orders critical, api-gateway degraded
    const gateway = state['api-gateway'];
    gateway.latency = 450;
    gateway.errorRate = 7.8;
    gateway.state = 'Degraded';
    gateway.riskScore = 64;
    affectedSet.add('api-gateway');
    propagationPath.push('api-gateway');

    steps.push({
      stepIndex: 2,
      timestamp: 'T+10s',
      timeOffsetSec: 10,
      serviceId: 'api-gateway',
      title: 'Ingress Latency Backpressure from Orders Heap Stall',
      description: `Orders service GC freezes cause HTTP timeouts to spike at API Gateway.`,
      eventType: 'PROPAGATION',
      riskDelta: 56,
      currentRiskScore: 64,
      affectedDownstream: ['api-gateway'],
      systemAvailability: 88.5,
      logsGenerated: [
        `[WARN] [api-gateway] High latency on orders downstream (p99: 4500ms)`,
      ],
    });
  } else {
    // Generic fallback propagation following downstream edges
    firstHopCallers.forEach((caller) => {
      caller.latency *= 3;
      caller.errorRate = 5.5;
      caller.state = 'At Risk';
      caller.riskScore = 52;
      affectedSet.add(caller.id);
      propagationPath.push(caller.id);
    });

    steps.push({
      stepIndex: 2,
      timestamp: 'T+12s',
      timeOffsetSec: 12,
      serviceId: firstHopCallers[0]?.id || rootId,
      title: 'Secondary Caller Risk Escalation',
      description: `Caller services experience upstream latency drag.`,
      eventType: 'PROPAGATION',
      riskDelta: 38,
      currentRiskScore: 52,
      affectedDownstream: Array.from(affectedSet),
      systemAvailability: 91.2,
      logsGenerated: [
        `[WARN] [${firstHopCallers[0]?.id || rootId}] Latency SLA breach detected`,
      ],
    });
  }

  // Recalculate risk on all services to ensure total coherence
  Object.values(state).forEach((service) => {
    const riskEval = calculateServiceRisk(service, state, settings);
    service.riskScore = riskEval.score;
    service.state = riskEval.state;
    if (riskEval.factors.length > 0 && riskEval.score >= settings.warningThreshold) {
      service.riskFactors = riskEval.factors;
    }
  });

  const affectedList = Array.from(affectedSet);
  const avgAvailability = steps[steps.length - 1].systemAvailability;

  return {
    steps,
    propagationPath,
    affectedServices: affectedList,
    initialState: JSON.parse(JSON.stringify(INITIAL_SERVICES)),
    finalState: state,
    userFacingImpact: {
      availabilityPct: avgAvailability,
      rpsImpacted: Math.round(1250 * ((100 - avgAvailability) / 100)),
      estimatedRevenueRiskPerMin: Math.round(4800 * ((100 - avgAvailability) / 100)),
      primaryUserSymptom:
        scenarioId === 'db-connection-pool-exhaustion'
          ? 'Shopping carts timing out during checkout; HTTP 504 Gateway Timeout'
          : scenarioId === 'service-crash'
          ? 'User login and session validation completely blocked; HTTP 401/503'
          : 'Elevated request latency and degraded transaction confirmation times',
    },
  };
}
