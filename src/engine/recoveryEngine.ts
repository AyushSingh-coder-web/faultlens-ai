import { AppSettings, FailureScenarioId, HealthState, RecoveryStrategy, ServiceId, ServiceNode } from '../types';
import { INITIAL_SERVICES } from './topologyData';

export function getApplicableStrategies(
  scenarioId: FailureScenarioId | null,
  rootServiceId: ServiceId | null,
  settings: AppSettings
): RecoveryStrategy[] {
  let rawStrategies: RecoveryStrategy[] = [];

  if (!scenarioId || scenarioId === 'db-connection-pool-exhaustion' || rootServiceId === 'postgres-db') {
    rawStrategies = [
      {
        id: 'strat-db-pool-scale',
        title: 'Expand Connection Pool & Route Reads to Replica',
        description:
          'Dynamically increase max active pool size from 100 to 250 via runtime JMX/Config reload, and offload non-critical SELECT queries to the healthy PostgreSQL read-replica.',
        applicableScenarios: ['db-connection-pool-exhaustion', 'high-db-latency'],
        applicableServices: ['postgres-db', 'orders-service'],
        riskReductionPct: 88,
        targetServicesRecovered: ['postgres-db', 'orders-service', 'payment-service', 'api-gateway'],
        estimatedRecoveryTimeSec: 25,
        userImpactEstimate: 'LOW',
        operationalComplexity: 'LOW',
        tradeOffs: [
          'Increases memory allocation on database server (+1.2GB shared buffers).',
          'Slight read replication lag (< 80ms) for secondary queries.',
        ],
        potentialSideEffects: [
          'If underlying queries are fundamentally pathological, the expanded pool might defer rather than eliminate saturation.',
        ],
        actionType: 'CONFIG_CHANGE',
        score: 0,
      },
      {
        id: 'strat-circuit-break-shed',
        title: 'Activate Circuit Breaker & Shed Non-Critical Checkout Loads',
        description:
          'Command Orders Service and API Gateway to trip circuit breakers on non-essential checkout recommendations and pause batch settlement workers, freeing 45% of DB transactions.',
        applicableScenarios: ['db-connection-pool-exhaustion', 'high-db-latency', 'elevated-api-error-rate'],
        applicableServices: ['orders-service', 'api-gateway'],
        riskReductionPct: 65,
        targetServicesRecovered: ['api-gateway', 'payment-service'],
        estimatedRecoveryTimeSec: 12,
        userImpactEstimate: 'MODERATE',
        operationalComplexity: 'LOW',
        tradeOffs: [
          'Degrades checkout experience by disabling upsell recommendations and loyalty points calculation.',
          'Database remains elevated until underlying slow queries terminate.',
        ],
        potentialSideEffects: [
          'Minor customer confusion from degraded checkout features for 10-15 minutes.',
        ],
        actionType: 'CIRCUIT_BREAK',
        score: 0,
      },
      {
        id: 'strat-db-restart-failover',
        title: 'Fail Over to Warm Standby Database Replica',
        description:
          'Execute automated Patroni / RDS failover to switch primary traffic to the synchronized standby database instance and force-terminate hanging client connections.',
        applicableScenarios: ['db-connection-pool-exhaustion', 'high-db-latency'],
        applicableServices: ['postgres-db'],
        riskReductionPct: 94,
        targetServicesRecovered: ['postgres-db', 'orders-service', 'payment-service', 'api-gateway'],
        estimatedRecoveryTimeSec: 55,
        userImpactEstimate: 'HIGH',
        operationalComplexity: 'HIGH',
        tradeOffs: [
          'Requires 15-20 seconds of hard downtime while VIP and DNS records update.',
          'In-flight uncommitted transactions (approx 80-120 checkouts) will be rolled back.',
        ],
        potentialSideEffects: [
          'Thundering herd reconnection spike when all service pools reconnect simultaneously.',
        ],
        actionType: 'RESTART',
        score: 0,
      },
    ];
  } else if (scenarioId === 'service-crash' || rootServiceId === 'auth-service') {
    rawStrategies = [
      {
        id: 'strat-auth-rollback',
        title: 'Emergency Rollback to Previous Known-Stable Auth Container Image',
        description:
          'Roll back the Kubernetes deployment to the prior release artifact (v2.4.11) with proven memory safety and zero SIGSEGV faults.',
        applicableScenarios: ['service-crash'],
        applicableServices: ['auth-service'],
        riskReductionPct: 95,
        targetServicesRecovered: ['auth-service', 'api-gateway'],
        estimatedRecoveryTimeSec: 35,
        userImpactEstimate: 'LOW',
        operationalComplexity: 'LOW',
        tradeOffs: [
          'Reverts newly shipped auth feature flag for 2FA biometric login.',
        ],
        potentialSideEffects: ['None identified for existing active sessions.'],
        actionType: 'REPLICA_SCALE',
        score: 0,
      },
      {
        id: 'strat-auth-bypass-cache',
        title: 'Temporarily Relax Ingress Signature Checks with Redis Session Bypass',
        description:
          'Allow API Gateway to validate authenticated user JWTs directly using cached Redis session public keys while Auth pods recover.',
        applicableScenarios: ['service-crash'],
        applicableServices: ['api-gateway', 'redis-cache'],
        riskReductionPct: 75,
        targetServicesRecovered: ['api-gateway'],
        estimatedRecoveryTimeSec: 10,
        userImpactEstimate: 'LOW',
        operationalComplexity: 'MEDIUM',
        tradeOffs: [
          'New user registrations and password changes remain temporarily blocked.',
        ],
        potentialSideEffects: ['Slightly reduced security posture for short window.'],
        actionType: 'CONFIG_CHANGE',
        score: 0,
      },
      {
        id: 'strat-auth-restart-pods',
        title: 'Force Kill & Recreate All Auth Service Pods',
        description:
          'Delete all crashed auth-service pods simultaneously to force Kubernetes deployment scheduler to reschedule fresh containers on alternate nodes.',
        applicableScenarios: ['service-crash'],
        applicableServices: ['auth-service'],
        riskReductionPct: 50,
        targetServicesRecovered: ['auth-service'],
        estimatedRecoveryTimeSec: 20,
        userImpactEstimate: 'MODERATE',
        operationalComplexity: 'LOW',
        tradeOffs: [
          'If the bug is triggered by current payload traffic, new pods will instantly crash again.',
        ],
        potentialSideEffects: ['CrashLoop cycle might continue until payload is sanitized.'],
        actionType: 'RESTART',
        score: 0,
      },
    ];
  } else {
    rawStrategies = [
      {
        id: 'strat-generic-scale',
        title: 'Horizontal Auto-Scale Compute Replicas 3x',
        description: 'Increase replica count from 3 to 9 to distribute CPU/memory pressure.',
        applicableScenarios: [scenarioId],
        applicableServices: [rootServiceId || 'orders-service'],
        riskReductionPct: 80,
        targetServicesRecovered: [rootServiceId || 'orders-service', 'api-gateway'],
        estimatedRecoveryTimeSec: 40,
        userImpactEstimate: 'LOW',
        operationalComplexity: 'LOW',
        tradeOffs: ['Increases cloud infrastructure compute billing.'],
        potentialSideEffects: ['Additional backend connections on database.'],
        actionType: 'REPLICA_SCALE',
        score: 0,
      },
      {
        id: 'strat-generic-restart',
        title: 'Rolling Graceful Process Restart',
        description: 'Perform progressive 1-by-1 container restart to release memory leaks.',
        applicableScenarios: [scenarioId],
        applicableServices: [rootServiceId || 'orders-service'],
        riskReductionPct: 70,
        targetServicesRecovered: [rootServiceId || 'orders-service'],
        estimatedRecoveryTimeSec: 30,
        userImpactEstimate: 'LOW',
        operationalComplexity: 'LOW',
        tradeOffs: ['Temporary minor capacity drop during rolling replacement.'],
        potentialSideEffects: ['None.'],
        actionType: 'RESTART',
        score: 0,
      },
      {
        id: 'strat-generic-shed',
        title: 'Rate Limit Ingress & Drop Non-Essential Traffic',
        description: 'Enforce aggressive token-bucket rate limiting at API Gateway.',
        applicableScenarios: [scenarioId],
        applicableServices: ['api-gateway'],
        riskReductionPct: 60,
        targetServicesRecovered: ['api-gateway'],
        estimatedRecoveryTimeSec: 15,
        userImpactEstimate: 'MODERATE',
        operationalComplexity: 'MEDIUM',
        tradeOffs: ['Some users will receive HTTP 429 Too Many Requests.'],
        potentialSideEffects: ['Customer support complaints.'],
        actionType: 'TRAFFIC_SHED',
        score: 0,
      },
    ];
  }

  // Deterministic scoring formula:
  // Score = (RiskReduction * wRisk) + ((120 - RecoveryTime) / 120 * 100 * wSpeed) + (ComplexityScore * wComplexity)
  const { riskReduction: wR, speed: wS, lowComplexity: wC } = settings.recoveryWeights;
  const totalWeight = wR + wS + wC;

  return rawStrategies.map((strat) => {
    const complexityScore = strat.operationalComplexity === 'LOW' ? 100 : strat.operationalComplexity === 'MEDIUM' ? 65 : 35;
    const speedScore = Math.max(0, Math.min(100, ((90 - strat.estimatedRecoveryTimeSec) / 90) * 100));
    const rawScore = (strat.riskReductionPct * wR + speedScore * wS + complexityScore * wC) / totalWeight;

    return {
      ...strat,
      score: Math.round(rawScore),
    };
  }).sort((a, b) => b.score - a.score);
}

/**
 * Simulates executing a recovery strategy.
 * Restores affected services gradually to Healthy or Recovering states.
 */
export function executeSimulatedRecovery(
  strategy: RecoveryStrategy,
  currentServices: Record<ServiceId, ServiceNode>
): {
  recoveredServices: Record<ServiceId, ServiceNode>;
  summary: string;
  recoveryLogs: string[];
} {
  const result: Record<ServiceId, ServiceNode> = JSON.parse(JSON.stringify(currentServices));
  const baseline: Record<ServiceId, ServiceNode> = JSON.parse(JSON.stringify(INITIAL_SERVICES));

  const recoveryLogs: string[] = [
    `[INFO] [ORCHESTRATOR] Initiating automated recovery strategy: "${strategy.title}"`,
    `[INFO] [ORCHESTRATOR] Applying mitigation across target services: ${strategy.targetServicesRecovered.join(', ')}`,
  ];

  strategy.targetServicesRecovered.forEach((serviceId) => {
    if (result[serviceId]) {
      const base = baseline[serviceId];
      result[serviceId].state = 'Healthy';
      result[serviceId].riskScore = Math.min(18, base.riskScore + 3);
      result[serviceId].latency = base.latency;
      result[serviceId].errorRate = base.errorRate;
      result[serviceId].cpu = base.cpu;
      result[serviceId].memory = base.memory;
      if (serviceId === 'postgres-db') {
        result[serviceId].connectionPoolUtil = 36;
      }
      if (serviceId === 'orders-service') {
        result[serviceId].replicas = 4;
      }
      result[serviceId].riskFactors = [
        `Stabilized post-mitigation via ${strategy.title}`,
        'Telemetry returning to nominal SLA envelopes',
      ];
      recoveryLogs.push(`[INFO] [${serviceId}] Recovery action confirmed. Health check 200 OK. Risk score dropped to ${result[serviceId].riskScore}/100`);
    }
  });

  // Ensure remaining services also adjust if their dependencies recovered
  Object.values(result).forEach((srv) => {
    if (srv.state === 'Degraded' || srv.state === 'At Risk') {
      srv.state = 'Healthy';
      srv.riskScore = 15;
      srv.latency = baseline[srv.id].latency;
      srv.errorRate = baseline[srv.id].errorRate;
      srv.riskFactors = ['Nominal operating state restored'];
      recoveryLogs.push(`[INFO] [${srv.id}] Upstream cascade cleared. Restored nominal operations.`);
    }
  });

  recoveryLogs.push(`[INFO] [ORCHESTRATOR] Recovery simulation complete. System availability restored to 99.98%.`);

  return {
    recoveredServices: result,
    summary: `Successfully executed "${strategy.title}". Reduced cluster risk by ${strategy.riskReductionPct}%. Recovered ${strategy.targetServicesRecovered.length} critical services.`,
    recoveryLogs,
  };
}
