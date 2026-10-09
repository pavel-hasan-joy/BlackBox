import {
  BlackBoxEvent,
  EvidenceGraphData,
  IncidentBundle,
  IncidentMetadata,
} from "@blackbox/schema";
import { EvidenceGraphBuilder } from "@blackbox/core";

export class IncidentRepository {
  private incidents = new Map<string, IncidentBundle>();
  private events: BlackBoxEvent[] = [];

  constructor() {
    this.seedDefaultIncidents();
  }

  saveIncident(bundle: IncidentBundle): void {
    this.incidents.set(bundle.metadata.incidentId, bundle);
  }

  getIncident(id: string): IncidentBundle | undefined {
    return this.incidents.get(id);
  }

  listIncidents(): IncidentMetadata[] {
    return Array.from(this.incidents.values()).map((bundle) => bundle.metadata);
  }

  getTimeline(incidentId: string): BlackBoxEvent[] {
    const bundle = this.incidents.get(incidentId);
    return bundle ? bundle.events : [];
  }

  getGraph(incidentId: string, timestamp?: number): EvidenceGraphData | null {
    const bundle = this.incidents.get(incidentId);
    if (!bundle) return null;
    return EvidenceGraphBuilder.build(bundle.events, timestamp);
  }

  saveEvent(evt: BlackBoxEvent): void {
    this.events.push(evt);
    // Keep max 10,000 in memory
    if (this.events.length > 10_000) {
      this.events.shift();
    }
  }

  getEvents(limit = 100): BlackBoxEvent[] {
    return this.events.slice(-limit);
  }

  getTrace(traceId: string): { traceId: string; events: BlackBoxEvent[] } | null {
    const matched = this.events.filter((e) => e.traceId === traceId);
    if (matched.length === 0) {
      // Also look through stored bundles
      for (const bundle of this.incidents.values()) {
        if (bundle.metadata.traceId === traceId) {
          return { traceId, events: bundle.events };
        }
      }
      return null;
    }
    return { traceId, events: matched };
  }

  search(query: string): Array<{ type: "incident" | "trace" | "service"; id: string; title: string; subtitle: string }> {
    const q = query.toLowerCase();
    const results: Array<{ type: "incident" | "trace" | "service"; id: string; title: string; subtitle: string }> = [];

    // Search incidents
    for (const bundle of this.incidents.values()) {
      const meta = bundle.metadata;
      if (
        meta.incidentId.toLowerCase().includes(q) ||
        meta.title.toLowerCase().includes(q) ||
        meta.service.toLowerCase().includes(q)
      ) {
        results.push({
          type: "incident",
          id: meta.incidentId,
          title: `${meta.incidentId} - ${meta.title}`,
          subtitle: `${meta.service} • ${meta.severity.toUpperCase()} • ${meta.startedAt}`,
        });
      }
    }

    // Services matches
    const services = ["api-gateway", "auth-service", "order-service", "payment-service", "inventory-service"];
    for (const s of services) {
      if (s.includes(q)) {
        results.push({
          type: "service",
          id: s,
          title: `Service: ${s}`,
          subtitle: s === "payment-service" ? "Degraded • 1 Incident" : "Healthy • 99.99% uptime",
        });
      }
    }

    return results;
  }

  private seedDefaultIncidents(): void {
    const now = Date.now();

    // Seed INC-1042: Payment timeout (as shown on PDF Page 2 & 7)
    const traceId1042 = "4b5367d540726a70afdbaf49240e6597";
    const startTime1042 = now - 180_000; // 3 mins ago

    const events1042: BlackBoxEvent[] = [
      {
        id: "evt_1001",
        timestamp: startTime1042,
        type: "request",
        service: "api-gateway",
        environment: "production",
        traceId: traceId1042,
        requestId: "req_9981",
        durationMs: 4,
        data: { method: "POST", path: "/checkout", clientIp: "192.168.1.1" },
      },
      {
        id: "evt_1002",
        timestamp: startTime1042 + 4,
        type: "auth",
        service: "auth-service",
        environment: "production",
        traceId: traceId1042,
        requestId: "req_9981",
        durationMs: 5,
        data: { action: "auth_success", userId: "usr_4492" },
      },
      {
        id: "evt_1003",
        timestamp: startTime1042 + 22,
        type: "db_query",
        service: "order-service",
        environment: "production",
        traceId: traceId1042,
        durationMs: 14,
        data: { query: "INSERT INTO orders (id, user_id) VALUES ($1, $2)", status: "started" },
      },
      {
        id: "evt_1004",
        timestamp: startTime1042 + 40,
        type: "custom",
        service: "inventory-service",
        environment: "production",
        traceId: traceId1042,
        durationMs: 8,
        data: { action: "inventory_checked", status: "reserved" },
      },
      {
        id: "evt_1005",
        timestamp: startTime1042 + 60,
        type: "external_api",
        service: "payment-service",
        environment: "production",
        traceId: traceId1042,
        durationMs: 1549,
        data: { target: "https://api.payment-gateway.internal/v1/charge", action: "Payment API called", latencyMs: 1549 },
      },
      {
        id: "evt_1006",
        timestamp: startTime1042 + 1609,
        type: "custom",
        service: "payment-service",
        environment: "production",
        traceId: traceId1042,
        data: { action: "Payment API slow: 1549ms", status: "retrying" },
      },
      {
        id: "evt_1007",
        timestamp: startTime1042 + 3620,
        type: "custom",
        service: "payment-service",
        environment: "production",
        traceId: traceId1042,
        data: { action: "Payment retry #1", status: "timeout" },
      },
      {
        id: "evt_1008",
        timestamp: startTime1042 + 5631,
        type: "custom",
        service: "payment-service",
        environment: "production",
        traceId: traceId1042,
        data: { action: "Payment retry #2", status: "timeout" },
      },
      {
        id: "evt_1009",
        timestamp: startTime1042 + 5700,
        type: "db_query",
        service: "order-service",
        environment: "production",
        traceId: traceId1042,
        durationMs: 4,
        data: { action: "DB transaction rollback", query: "ROLLBACK" },
      },
      {
        id: "evt_1010",
        timestamp: startTime1042 + 5704,
        type: "error",
        service: "payment-service",
        environment: "production",
        traceId: traceId1042,
        durationMs: 5704,
        data: {
          error: "PaymentTimeout: External payment gateway connection timed out after 3 attempts",
          code: 500,
          stack: "Error: PaymentTimeout\n    at PaymentGatewayClient.charge (payment.ts:48)\n    at processTicksAndRejections (task_queues:95)",
        },
      },
    ];

    const bundle1042: IncidentBundle = {
      metadata: {
        incidentId: "INC-1042",
        service: "payment-service",
        environment: "production",
        severity: "critical",
        startedAt: new Date(startTime1042).toISOString(),
        endedAt: new Date(startTime1042 + 5704).toISOString(),
        rootEvent: "evt_1010",
        traceId: traceId1042,
        title: "Payment timeout",
        status: "open",
        durationMs: 6300,
        rootCause: {
          likelyCause: "External payment provider latency increased from 320ms → 4.8s",
          confidence: 91,
          evidence: [
            "17 timeout events detected across HTTP/gRPC boundaries",
            "3 retries attempted before cascading exhaustion",
            "Payment dependency affected (PaymentGateway)",
            "Checkout failures started 11s later resulting in 500 status",
          ],
          affectedDependencies: ["Payment API Gateway", "PostgreSQL Connection Pool"],
          suggestedFix: "Tune payment gateway timeout from 1500ms to 3000ms with circuit breaker breaker fallback.",
        },
        preFailureWindowMs: 60_000,
        postFailureWindowMs: 10_000,
      },
      events: events1042,
      trace: {
        traceId: traceId1042,
        spans: [
          {
            spanId: "spn_1",
            name: "POST /checkout",
            service: "api-gateway",
            startTime: startTime1042,
            durationMs: 5704,
            status: "error",
            attributes: { path: "/checkout" },
          },
          {
            spanId: "spn_2",
            parentSpanId: "spn_1",
            name: "auth.verify",
            service: "auth-service",
            startTime: startTime1042 + 4,
            durationMs: 5,
            status: "ok",
            attributes: {},
          },
          {
            spanId: "spn_3",
            parentSpanId: "spn_1",
            name: "orders.create",
            service: "order-service",
            startTime: startTime1042 + 22,
            durationMs: 5680,
            status: "error",
            attributes: {},
          },
          {
            spanId: "spn_4",
            parentSpanId: "spn_3",
            name: "payments.charge",
            service: "payment-service",
            startTime: startTime1042 + 60,
            durationMs: 5644,
            status: "error",
            attributes: {},
          },
        ],
      },
      errors: [
        {
          id: "evt_1010",
          message: "PaymentTimeout: External payment gateway connection timed out",
          timestamp: startTime1042 + 5704,
          service: "payment-service",
          stack: "Error: PaymentTimeout\n    at PaymentGatewayClient.charge (payment.ts:48)",
        },
      ],
      requests: [
        {
          requestId: "req_9981",
          method: "POST",
          path: "/checkout",
          status: 500,
          durationMs: 5704,
          timestamp: startTime1042,
        },
      ],
      dependencies: [
        { name: "PostgreSQL", type: "database", latencyMs: 14, status: "ok" },
        { name: "Payment API Gateway", type: "external_api", latencyMs: 1549, status: "error" },
        { name: "Auth Service", type: "service", latencyMs: 5, status: "ok" },
      ],
      redactions: [
        { field: "authorization", count: 4 },
        { field: "password", count: 2 },
        { field: "token", count: 6 },
      ],
      snapshot: {
        memoryUsageMb: 12.4,
        cpuPercent: 4.8,
        activeConnections: 24,
        eventCount: events1042.length,
        capturedAt: new Date(startTime1042 + 5704).toISOString(),
      },
    };

    this.incidents.set("INC-1042", bundle1042);

    // Also seed INC-1041 (DB connection spike)
    const startTime1041 = now - 600_000;
    const bundle1041: IncidentBundle = {
      ...bundle1042,
      metadata: {
        ...bundle1042.metadata,
        incidentId: "INC-1041",
        title: "DB connection spike",
        severity: "high",
        service: "order-service",
        startedAt: new Date(startTime1041).toISOString(),
        endedAt: new Date(startTime1041 + 4200).toISOString(),
        status: "mitigated",
        durationMs: 4200,
        rootCause: {
          likelyCause: "Postgres max_connections saturated during flash sale event",
          confidence: 88,
          evidence: [
            "Active connections spiked from 42 -> 300",
            "Connection acquire timeout 5000ms exceeded",
          ],
          affectedDependencies: ["PostgreSQL Pool"],
          suggestedFix: "Increase pool buffer and enable connection queue limits.",
        },
      },
    };
    this.incidents.set("INC-1041", bundle1041);

    for (const ev of events1042) {
      this.events.push(ev);
    }
  }
}
