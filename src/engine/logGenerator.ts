import { FailureScenarioId, LogEntry, ServiceId, ServiceNode } from '../types';

export function generateInitialLogs(): LogEntry[] {
  const now = Date.now();
  const formatTime = (offsetMs: number) => new Date(now - offsetMs).toISOString().replace('T', ' ').substring(11, 19);

  return [
    {
      id: 'log-001',
      timestamp: formatTime(600000),
      severity: 'INFO',
      service: 'api-gateway',
      serviceName: 'API Gateway',
      message: 'Ingress router health probe OK. Active connections: 412, SSL session cache hit: 98.4%',
      correlationId: 'req-0f8a-9921',
      latencyMs: 14,
    },
    {
      id: 'log-002',
      timestamp: formatTime(540000),
      severity: 'INFO',
      service: 'auth-service',
      serviceName: 'Authentication Service',
      message: 'Token verification batch completed. 842 tokens validated in 18ms via Redis cache',
      correlationId: 'req-0f8a-9922',
      latencyMs: 18,
    },
    {
      id: 'log-003',
      timestamp: formatTime(480000),
      severity: 'INFO',
      service: 'orders-service',
      serviceName: 'Orders Service',
      message: 'Order #ORD-98421 placed successfully. Total: $148.50. Event published to message queue',
      correlationId: 'req-0f8a-9923',
      latencyMs: 38,
    },
    {
      id: 'log-004',
      timestamp: formatTime(420000),
      severity: 'INFO',
      service: 'postgres-db',
      serviceName: 'PostgreSQL Database',
      message: 'Checkpoint completed: wrote 142 buffers (0.1%); 0 WAL files recycled; stats reset',
      correlationId: 'sys-chk-1102',
      metadata: { poolUtilization: 32, activeConnections: 32, maxPool: 100 },
    },
    {
      id: 'log-005',
      timestamp: formatTime(360000),
      severity: 'INFO',
      service: 'redis-cache',
      serviceName: 'Redis Cache',
      message: 'MEMORY STATS: used_memory_human=1.24G, instantaneous_ops_per_sec=2180, hit_rate=96.4%',
      correlationId: 'sys-red-0941',
    },
    {
      id: 'log-006',
      timestamp: formatTime(300000),
      severity: 'INFO',
      service: 'payment-service',
      serviceName: 'Payment Service',
      message: 'Stripe transaction auth succeeded for txn_99182a in 64ms. Settlement ledger record written',
      correlationId: 'req-0f8a-9924',
      latencyMs: 64,
    },
    {
      id: 'log-007',
      timestamp: formatTime(240000),
      severity: 'INFO',
      service: 'inventory-service',
      serviceName: 'Inventory Service',
      message: 'Stock reservation lock confirmed for SKU-49102 (Qty: 2). Lock release scheduled in 15min',
      correlationId: 'req-0f8a-9925',
      latencyMs: 22,
    },
    {
      id: 'log-008',
      timestamp: formatTime(180000),
      severity: 'INFO',
      service: 'message-queue',
      serviceName: 'Message Queue',
      message: 'RabbitMQ vhost /production consumer acknowledgments steady at 720 msg/sec. Lag: 42',
      correlationId: 'sys-mq-4410',
    },
    {
      id: 'log-009',
      timestamp: formatTime(120000),
      severity: 'INFO',
      service: 'notification-service',
      serviceName: 'Notification Service',
      message: 'Dispatched 48 transactional notification emails via SES webhook with 0 retry errors',
      correlationId: 'req-0f8a-9926',
      latencyMs: 31,
    },
    {
      id: 'log-010',
      timestamp: formatTime(60000),
      severity: 'INFO',
      service: 'api-gateway',
      serviceName: 'API Gateway',
      message: 'Cluster heartbeat: All 9 upstream target groups reports HEALTHY',
      correlationId: 'sys-gw-0001',
      latencyMs: 16,
    },
  ];
}

export function generateIncidentLogs(
  scenarioId: FailureScenarioId,
  currentServices: Record<ServiceId, ServiceNode>
): LogEntry[] {
  const baseLogs = generateInitialLogs();
  const now = Date.now();
  const formatTime = (offsetSec: number) => new Date(now - (30 - offsetSec) * 1000).toISOString().replace('T', ' ').substring(11, 19);

  let incidentLogs: LogEntry[] = [];

  if (scenarioId === 'db-connection-pool-exhaustion') {
    incidentLogs = [
      {
        id: 'inc-log-01',
        timestamp: formatTime(2),
        severity: 'WARN',
        service: 'postgres-db',
        serviceName: 'PostgreSQL Database',
        message: 'PostgreSQL connection pool utilization exceeded 85% threshold (86/100 active connections)',
        correlationId: 'corr-db-pool-01',
        metadata: { activeConnections: 86, maxConnections: 100, pendingWaiters: 4 },
        isAnomaly: true,
      },
      {
        id: 'inc-log-02',
        timestamp: formatTime(4),
        severity: 'ERROR',
        service: 'postgres-db',
        serviceName: 'PostgreSQL Database',
        message: 'HikariPool-1 - Connection is not available, request timed out after 15000ms. Active: 98/100, Idle: 0, Waiting: 42',
        correlationId: 'corr-db-pool-02',
        errorCode: 'SQLSTATE[08001]',
        metadata: { activeConnections: 98, pendingWaiters: 42 },
        isAnomaly: true,
      },
      {
        id: 'inc-log-03',
        timestamp: formatTime(6),
        severity: 'WARN',
        service: 'orders-service',
        serviceName: 'Orders Service',
        message: 'OrdersService.saveOrder(): connection acquisition latency spiked to 3200ms (> 250ms threshold)',
        correlationId: 'corr-ord-771a',
        latencyMs: 3200,
        isAnomaly: true,
      },
      {
        id: 'inc-log-04',
        timestamp: formatTime(8),
        severity: 'ERROR',
        service: 'orders-service',
        serviceName: 'Orders Service',
        message: 'CheckoutWorkflowException: org.postgresql.util.PSQLException: Connection refused or timed out in pool',
        correlationId: 'corr-ord-771b',
        errorCode: 'ERR_DB_TIMEOUT_CASCADE',
        latencyMs: 4500,
        isAnomaly: true,
      },
      {
        id: 'inc-log-05',
        timestamp: formatTime(10),
        severity: 'ERROR',
        service: 'payment-service',
        serviceName: 'Payment Service',
        message: 'PaymentRecordRepository.insert(): transaction failed after 3 retries due to database connection starvation',
        correlationId: 'corr-pay-992c',
        errorCode: 'ERR_LEDGER_WRITE_FAIL',
        latencyMs: 3950,
        isAnomaly: true,
      },
      {
        id: 'inc-log-06',
        timestamp: formatTime(12),
        severity: 'WARN',
        service: 'orders-service',
        serviceName: 'Orders Service',
        message: 'Worker thread pool saturation: 128/128 threads blocked waiting on synchronous DB transactions',
        correlationId: 'corr-ord-771c',
        isAnomaly: true,
      },
      {
        id: 'inc-log-07',
        timestamp: formatTime(14),
        severity: 'ERROR',
        service: 'api-gateway',
        serviceName: 'API Gateway',
        message: 'HTTP 504 Gateway Timeout: Upstream target "orders-service/checkout" failed to respond within 3000ms SLA',
        correlationId: 'corr-gw-504a',
        latencyMs: 3002,
        errorCode: 'HTTP_504_GATEWAY_TIMEOUT',
        isAnomaly: true,
      },
      {
        id: 'inc-log-08',
        timestamp: formatTime(16),
        severity: 'FATAL',
        service: 'api-gateway',
        serviceName: 'API Gateway',
        message: 'CircuitBreaker[orders-service]: Failure rate at 34.2% exceeded trip threshold (20%). State transitioned to OPEN',
        correlationId: 'corr-gw-cb-trip',
        errorCode: 'CIRCUIT_BREAKER_OPEN',
        isAnomaly: true,
      },
    ];
  } else if (scenarioId === 'service-crash') {
    incidentLogs = [
      {
        id: 'inc-crash-01',
        timestamp: formatTime(2),
        severity: 'FATAL',
        service: 'auth-service',
        serviceName: 'Authentication Service',
        message: 'FATAL SIGSEGV in libcrypto.so during ECDSA token signature verification. Pod auth-service-76b9d terminated',
        correlationId: 'crash-pod-01',
        errorCode: 'EXIT_CODE_139',
        isAnomaly: true,
      },
      {
        id: 'inc-crash-02',
        timestamp: formatTime(5),
        severity: 'ERROR',
        service: 'api-gateway',
        serviceName: 'API Gateway',
        message: 'Upstream connection refused to auth-service:50051 (gRPC status: UNAVAILABLE, no endpoints available)',
        correlationId: 'crash-gw-02',
        errorCode: 'GRPC_UNAVAILABLE',
        isAnomaly: true,
      },
      {
        id: 'inc-crash-03',
        timestamp: formatTime(7),
        severity: 'ERROR',
        service: 'api-gateway',
        serviceName: 'API Gateway',
        message: 'Dropping ingress traffic: Inbound JWT validation required, 84% requests rejected with HTTP 503',
        correlationId: 'crash-gw-03',
        errorCode: 'HTTP_503_SERVICE_UNAVAILABLE',
        isAnomaly: true,
      },
    ];
  } else {
    incidentLogs = [
      {
        id: 'inc-gen-01',
        timestamp: formatTime(2),
        severity: 'WARN',
        service: currentServices[Object.keys(currentServices)[0] as ServiceId].id,
        serviceName: currentServices[Object.keys(currentServices)[0] as ServiceId].name,
        message: 'Abnormal telemetry deviation detected across service metrics envelope',
        correlationId: 'corr-gen-01',
        isAnomaly: true,
      },
      {
        id: 'inc-gen-02',
        timestamp: formatTime(6),
        severity: 'ERROR',
        service: 'api-gateway',
        serviceName: 'API Gateway',
        message: 'Elevated downstream error cascade causing ingress degradation',
        correlationId: 'corr-gen-02',
        isAnomaly: true,
      },
    ];
  }

  return [...incidentLogs, ...baseLogs];
}
