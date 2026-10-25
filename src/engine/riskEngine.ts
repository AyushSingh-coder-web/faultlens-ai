import { AppSettings, HealthState, ServiceId, ServiceNode } from '../types';

export interface RiskEvaluationResult {
  score: number; // 0 - 100
  state: HealthState;
  factors: string[];
  breakdown: {
    latencyRisk: number;
    errorRateRisk: number;
    resourceRisk: number;
    dependencyRisk: number;
    specializedRisk: number;
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  warningThreshold: 30,
  criticalThreshold: 80,
  propagationThreshold: 40,
  simulationSpeedMs: 1200,
  weights: {
    latency: 0.25,
    errorRate: 0.30,
    resourcePressure: 0.15,
    dependencyHealth: 0.20,
    connectionPool: 0.10,
  },
  recoveryWeights: {
    riskReduction: 0.50,
    speed: 0.30,
    lowComplexity: 0.20,
  },
};

/**
 * Deterministic, rule-based risk calculation function.
 * Pure function: takes a service node, full cluster state, and configuration settings.
 */
export function calculateServiceRisk(
  service: ServiceNode,
  allServices: Record<ServiceId, ServiceNode>,
  settings: AppSettings = DEFAULT_SETTINGS
): RiskEvaluationResult {
  const factors: string[] = [];

  // 1. Latency Anomaly Scoring
  // Baselines differ by tier and category
  let baselineLatency = 20;
  if (service.id === 'postgres-db' || service.id === 'redis-cache' || service.id === 'message-queue') {
    baselineLatency = 5;
  } else if (service.id === 'payment-service') {
    baselineLatency = 60;
  } else if (service.id === 'orders-service') {
    baselineLatency = 40;
  }

  const latencyRatio = Math.max(1, service.latency / baselineLatency);
  let latencyRisk = 0;
  if (latencyRatio >= 10) {
    latencyRisk = 100;
    factors.push(`Severe latency anomaly (${Math.round(service.latency)}ms vs ${baselineLatency}ms baseline, ${latencyRatio.toFixed(1)}x)`);
  } else if (latencyRatio >= 4) {
    latencyRisk = 75;
    factors.push(`Elevated response latency (${Math.round(service.latency)}ms, ${latencyRatio.toFixed(1)}x baseline)`);
  } else if (latencyRatio >= 2) {
    latencyRisk = 40;
    factors.push(`Moderate latency increase (${Math.round(service.latency)}ms)`);
  } else {
    latencyRisk = Math.min(25, (latencyRatio - 1) * 25);
  }

  // 2. Error Rate Anomaly Scoring
  let errorRateRisk = 0;
  if (service.errorRate >= 20) {
    errorRateRisk = 100;
    factors.push(`Critical error rate (${service.errorRate.toFixed(1)}% requests failing)`);
  } else if (service.errorRate >= 5) {
    errorRateRisk = 75;
    factors.push(`Elevated 5xx/4xx error rate (${service.errorRate.toFixed(1)}%)`);
  } else if (service.errorRate >= 1) {
    errorRateRisk = 45;
    factors.push(`Abnormal error rate above SLA baseline (${service.errorRate.toFixed(2)}%)`);
  } else if (service.errorRate > 0.2) {
    errorRateRisk = 20;
  }

  // 3. Resource Pressure (CPU + Memory)
  let resourceRisk = 0;
  const maxResource = Math.max(service.cpu, service.memory);
  if (maxResource >= 90) {
    resourceRisk = 95;
    factors.push(`Host saturation: ${service.cpu >= 90 ? `CPU at ${service.cpu}%` : ''} ${service.memory >= 90 ? `Memory at ${service.memory}%` : ''}`.trim());
  } else if (maxResource >= 80) {
    resourceRisk = 65;
    factors.push(`Elevated resource pressure (CPU: ${service.cpu}%, Mem: ${service.memory}%)`);
  } else if (maxResource >= 70) {
    resourceRisk = 30;
  }

  // 4. Specialized Metrics (DB Connection Pool, MQ Backlog)
  let specializedRisk = 0;
  if (service.id === 'postgres-db' && service.connectionPoolUtil !== undefined) {
    if (service.connectionPoolUtil >= 95) {
      specializedRisk = 100;
      factors.push(`HikariCP connection pool exhausted (${service.connectionPoolUtil}% utilization)`);
    } else if (service.connectionPoolUtil >= 80) {
      specializedRisk = 70;
      factors.push(`Connection pool nearing saturation (${service.connectionPoolUtil}%)`);
    } else if (service.connectionPoolUtil >= 60) {
      specializedRisk = 35;
    }
  } else if (service.id === 'message-queue' && service.queueBacklog !== undefined) {
    if (service.queueBacklog >= 50000) {
      specializedRisk = 95;
      factors.push(`Severe consumer lag: ${service.queueBacklog.toLocaleString()} messages pending`);
    } else if (service.queueBacklog >= 10000) {
      specializedRisk = 65;
      factors.push(`Queue consumer backlog accumulation (${service.queueBacklog.toLocaleString()} msgs)`);
    } else if (service.queueBacklog >= 2000) {
      specializedRisk = 30;
    }
  }

  // 5. Dependency Health (Downstream services that this service depends upon)
  let dependencyRisk = 0;
  const downstreamServices = service.downstream.map((id) => allServices[id]).filter(Boolean);
  if (downstreamServices.length > 0) {
    const criticalDownstream = downstreamServices.filter((s) => s.state === 'Critical' || s.riskScore >= 80);
    const degradedDownstream = downstreamServices.filter((s) => s.state === 'Degraded' || (s.riskScore >= 60 && s.riskScore < 80));
    const atRiskDownstream = downstreamServices.filter((s) => s.state === 'At Risk' || (s.riskScore >= 30 && s.riskScore < 60));

    if (criticalDownstream.length > 0) {
      dependencyRisk = 90;
      factors.push(`Critical downstream dependency failure: ${criticalDownstream.map((s) => s.name).join(', ')}`);
    } else if (degradedDownstream.length > 0) {
      dependencyRisk = 60;
      factors.push(`Degraded downstream dependency: ${degradedDownstream.map((s) => s.name).join(', ')}`);
    } else if (atRiskDownstream.length > 0) {
      dependencyRisk = 30;
      factors.push(`Downstream dependency showing abnormal risk: ${atRiskDownstream.map((s) => s.name).join(', ')}`);
    }
  }

  // Weighted composition using configurable settings
  const { latency: wLat, errorRate: wErr, resourcePressure: wRes, dependencyHealth: wDep, connectionPool: wSpec } = settings.weights;
  const totalWeight = wLat + wErr + wRes + wDep + wSpec;

  const rawScore =
    (latencyRisk * wLat +
      errorRateRisk * wErr +
      resourceRisk * wRes +
      dependencyRisk * wDep +
      specializedRisk * wSpec) /
    totalWeight;

  // Normalise and clamp between 0 and 100
  const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  // State evaluation according to configurable thresholds
  let state: HealthState = 'Healthy';
  if (finalScore >= settings.criticalThreshold) {
    state = 'Critical';
  } else if (finalScore >= (settings.warningThreshold + settings.criticalThreshold) / 2) {
    state = 'Degraded';
  } else if (finalScore >= settings.warningThreshold) {
    state = 'At Risk';
  }

  if (factors.length === 0) {
    factors.push('Metrics within nominal SLA thresholds');
  }

  return {
    score: finalScore,
    state,
    factors,
    breakdown: {
      latencyRisk,
      errorRateRisk,
      resourceRisk,
      dependencyRisk,
      specializedRisk,
    },
  };
}
