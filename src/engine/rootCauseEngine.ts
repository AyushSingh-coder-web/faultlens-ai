import { EvidenceItem, FailureScenarioId, LogEntry, RootCauseAnalysis, ServiceId, ServiceNode } from '../types';

export function runRootCauseAnalysis(
  scenarioId: FailureScenarioId | null,
  services: Record<ServiceId, ServiceNode>,
  logs: LogEntry[]
): RootCauseAnalysis {
  const incidentId = `INC-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
  const timestamp = new Date().toISOString();

  // Find most critical services and early error logs
  const criticalServices = Object.values(services).filter((s) => s.state === 'Critical' || s.riskScore >= 75);
  const anomalyLogs = logs.filter((l) => l.isAnomaly || l.severity === 'ERROR' || l.severity === 'FATAL');

  // Check if PostgreSQL connection pool exhaustion signature is detected
  const isDbExhaustion =
    services['postgres-db']?.connectionPoolUtil !== undefined &&
    services['postgres-db'].connectionPoolUtil >= 85;

  const isAuthCrash =
    services['auth-service']?.replicas === 0 ||
    services['auth-service']?.errorRate >= 60;

  const isMemoryLeak =
    services['orders-service']?.memory >= 90;

  if (isDbExhaustion || scenarioId === 'db-connection-pool-exhaustion') {
    const supportingEvidence: EvidenceItem[] = [
      {
        id: 'ev-01',
        type: 'METRIC',
        title: 'Connection Pool Saturation Threshold Breached',
        description: `PostgreSQL connection pool utilization hit ${services['postgres-db']?.connectionPoolUtil || 98}% (warning threshold: 80%, hard cap: 100).`,
        service: 'postgres-db',
        confidenceImpact: 35,
      },
      {
        id: 'ev-02',
        type: 'LOG',
        title: 'HikariCP Semaphore Acquisition Timeouts',
        description: 'Multiple HikariPool-1 connection acquisition timeout exceptions recorded in database and caller logs before upstream errors began.',
        service: 'postgres-db',
        confidenceImpact: 30,
      },
      {
        id: 'ev-03',
        type: 'TOPOLOGY',
        title: 'Direct Synchronous Dependency Link',
        description: 'Topology maps Orders Service and Payment Service with synchronous TCP/Pool edges directly upstream of PostgreSQL Database.',
        service: 'orders-service',
        confidenceImpact: 15,
      },
      {
        id: 'ev-04',
        type: 'METRIC',
        title: 'Temporal Lag in Ingress Degradation',
        description: 'API Gateway latency and HTTP 504 errors manifested 10 seconds after PostgreSQL pool saturation, confirming upward ripple propagation.',
        service: 'api-gateway',
        confidenceImpact: 12,
      },
    ];

    const totalConfidence = Math.min(94, supportingEvidence.reduce((acc, ev) => acc + ev.confidenceImpact, 0));

    return {
      incidentId,
      timestamp,
      probableCause: 'PostgreSQL Connection-Pool Exhaustion with Upstream Thread Starvation',
      rootService: 'postgres-db',
      rootServiceName: 'PostgreSQL Database',
      confidence: totalConfidence,
      uncertaintyLevel: 'LOW',
      observations: [
        'PostgreSQL connection pool utilization reached 98% with 42 pending thread waiters.',
        'HikariPool acquisition timeouts (15000ms SLA breach) logged at T+04s.',
        'Orders Service checkout thread pool saturated with blocked database queries at T+09s.',
        'API Gateway tripped circuit breaker to OPEN state after 34.2% error rate at T+16s.',
      ],
      hypotheses: [
        'Unindexed slow analytics queries or transaction leak held connections open, starving rapid checkout transactions.',
        'HikariCP maximum connection pool size (100) is under-provisioned for peak aggregate traffic across 4 dependent services.',
      ],
      supportingEvidence,
      alternativeExplanations: [
        'An abrupt upstream marketing traffic surge on API Gateway may have overwhelmed nominal capacity rather than an internal query leak.',
        'Network packet loss or TCP half-open connections between Orders Service and the database host could simulate connection exhaustion.',
      ],
      recommendedInvestigation: [
        'Inspect pg_stat_activity for long-running transactions and active idle-in-transaction states.',
        'Audit HikariCP leakDetectionThreshold and connectionTimeout parameters across Orders Service configuration.',
        'Verify if a database read-replica can offload non-transactional read queries.',
        'Evaluate adding connection pooler proxy (e.g. PgBouncer) to multiplex persistent backend connections.',
      ],
    };
  } else if (isAuthCrash || scenarioId === 'service-crash') {
    return {
      incidentId,
      timestamp,
      probableCause: 'Authentication Service Process CrashLoop & Pod Termination',
      rootService: 'auth-service',
      rootServiceName: 'Authentication Service',
      confidence: 96,
      uncertaintyLevel: 'LOW',
      observations: [
        'All 3 Auth Service replicas terminated with exit code 139 (SIGSEGV).',
        'Ingress reverse proxy immediately began returning HTTP 503 for all unauthenticated routes.',
      ],
      hypotheses: [
        'Malformed JWT token payload triggered a buffer overrun or unhandled null dereference in the native cryptography layer.',
      ],
      supportingEvidence: [
        {
          id: 'ev-crash-1',
          type: 'LOG',
          title: 'Native SIGSEGV Stack Trace Logged',
          description: 'Fatal SIGSEGV signal emitted from libcrypto native extension during token verification.',
          service: 'auth-service',
          confidenceImpact: 50,
        },
        {
          id: 'ev-crash-2',
          type: 'METRIC',
          title: 'Zero Ready Replicas',
          description: 'Kubernetes deployment reported 0/3 healthy ready endpoints.',
          service: 'auth-service',
          confidenceImpact: 46,
        },
      ],
      alternativeExplanations: [
        'Underlying node OOM killer terminated the container due to host memory constraint.',
      ],
      recommendedInvestigation: [
        'Inspect container core dumps via coredumpctl.',
        'Roll back recent authentication library deployment or update security patch.',
      ],
    };
  } else {
    // General / multi-factor analysis
    const primarySuspect = criticalServices[0] || services['postgres-db'];
    return {
      incidentId,
      timestamp,
      probableCause: `Degraded Telemetry Baseline in ${primarySuspect.name}`,
      rootService: primarySuspect.id,
      rootServiceName: primarySuspect.name,
      confidence: 76,
      uncertaintyLevel: 'MEDIUM',
      observations: [
        `${primarySuspect.name} exhibits risk score of ${primarySuspect.riskScore}/100.`,
        'Downstream service calls experiencing anomalous latency drag.',
      ],
      hypotheses: [
        'Resource contention or concurrency lockup causing progressive throughput degradation.',
      ],
      supportingEvidence: [
        {
          id: 'ev-gen-1',
          type: 'METRIC',
          title: 'Abnormal Risk Score Deviation',
          description: `Telemetry risk scoring engine flagged ${primarySuspect.name} with score exceeding critical boundary.`,
          service: primarySuspect.id,
          confidenceImpact: 45,
        },
      ],
      alternativeExplanations: [
        'Transient cloud provider network latency or noisy neighbor hypervisor contention.',
      ],
      recommendedInvestigation: [
        'Correlate infrastructure CPU/memory time-series with application telemetry logs.',
        'Review recent deployment change events and configuration diffs.',
      ],
    };
  }
}
