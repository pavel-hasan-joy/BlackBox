import { randomUUID } from "node:crypto";
import {
  BlackBoxEvent,
  IncidentBundle,
} from "@blackbox/schema";
import { IncidentEngine } from "@blackbox/core";
import { IncidentRepository } from "../repositories/incident-repository.js";
import { StreamManager } from "../websocket/stream-manager.js";

export class IncidentService {
  constructor(
    private readonly repository: IncidentRepository,
    private readonly streamManager: StreamManager
  ) {}

  ingestEvent(event: BlackBoxEvent): void {
    this.repository.saveEvent(event);
    this.streamManager.broadcastEvent(event);

    if (event.type === "error") {
      const surrounding = this.repository.getEvents(100);
      const bundle = IncidentEngine.processIncident(event, surrounding);
      this.repository.saveIncident(bundle);
      this.streamManager.broadcastIncidentFreeze(bundle);
    }
  }

  saveIncidentBundle(bundle: IncidentBundle): void {
    this.repository.saveIncident(bundle);
    this.streamManager.broadcastIncidentFreeze(bundle);
  }

  /**
   * Simulates the exact e-commerce checkout disaster scenario from PDF Page 2 & 21-22
   */
  async simulateIncidentScenario(): Promise<IncidentBundle> {
    const traceId = randomUUID().replace(/-/g, "").slice(0, 32);
    const reqId = `req_${randomUUID().slice(0, 8)}`;
    const now = Date.now();

    const sequence: Array<{ delay: number; event: BlackBoxEvent }> = [
      {
        delay: 0,
        event: {
          id: `evt_${randomUUID().slice(0, 8)}`,
          timestamp: now,
          type: "request",
          service: "api-gateway",
          environment: "production",
          traceId,
          requestId: reqId,
          durationMs: 4,
          data: { method: "POST", path: "/checkout", authorization: "Bearer eyJhbGciOi..." },
        },
      },
      {
        delay: 50,
        event: {
          id: `evt_${randomUUID().slice(0, 8)}`,
          timestamp: now + 50,
          type: "auth",
          service: "auth-service",
          environment: "production",
          traceId,
          requestId: reqId,
          durationMs: 6,
          data: { action: "auth_success", userId: "usr_9982" },
        },
      },
      {
        delay: 100,
        event: {
          id: `evt_${randomUUID().slice(0, 8)}`,
          timestamp: now + 100,
          type: "db_query",
          service: "order-service",
          environment: "production",
          traceId,
          requestId: reqId,
          durationMs: 14,
          data: { query: "INSERT INTO orders (id, amount) VALUES ($1, $2)", status: "pending" },
        },
      },
      {
        delay: 150,
        event: {
          id: `evt_${randomUUID().slice(0, 8)}`,
          timestamp: now + 150,
          type: "custom",
          service: "inventory-service",
          environment: "production",
          traceId,
          requestId: reqId,
          durationMs: 9,
          data: { action: "inventory_checked", status: "reserved_stock" },
        },
      },
      {
        delay: 200,
        event: {
          id: `evt_${randomUUID().slice(0, 8)}`,
          timestamp: now + 200,
          type: "external_api",
          service: "payment-service",
          environment: "production",
          traceId,
          requestId: reqId,
          durationMs: 1549,
          data: { target: "https://api.stripe-gateway.com/v1/charges", action: "Payment API called", latencyMs: 1549 },
        },
      },
      {
        delay: 800,
        event: {
          id: `evt_${randomUUID().slice(0, 8)}`,
          timestamp: now + 800,
          type: "custom",
          service: "payment-service",
          environment: "production",
          traceId,
          requestId: reqId,
          data: { action: "Payment API slow: 1549ms", status: "timeout_approaching" },
        },
      },
      {
        delay: 1400,
        event: {
          id: `evt_${randomUUID().slice(0, 8)}`,
          timestamp: now + 1400,
          type: "custom",
          service: "payment-service",
          environment: "production",
          traceId,
          requestId: reqId,
          data: { action: "Payment retry #1", status: "retry_dispatched" },
        },
      },
      {
        delay: 2000,
        event: {
          id: `evt_${randomUUID().slice(0, 8)}`,
          timestamp: now + 2000,
          type: "custom",
          service: "payment-service",
          environment: "production",
          traceId,
          requestId: reqId,
          data: { action: "Payment retry #2", status: "retry_dispatched" },
        },
      },
      {
        delay: 2400,
        event: {
          id: `evt_${randomUUID().slice(0, 8)}`,
          timestamp: now + 2400,
          type: "db_query",
          service: "order-service",
          environment: "production",
          traceId,
          requestId: reqId,
          durationMs: 8,
          data: { action: "DB transaction rollback", query: "ROLLBACK TO SAVEPOINT order_init" },
        },
      },
      {
        delay: 2600,
        event: {
          id: `evt_${randomUUID().slice(0, 8)}`,
          timestamp: now + 2600,
          type: "error",
          service: "payment-service",
          environment: "production",
          traceId,
          requestId: reqId,
          durationMs: 2600,
          data: {
            error: "PaymentTimeout: External payment gateway connection dropped after 3 attempts (HTTP 500)",
            code: "ERR_PAYMENT_GATEWAY_TIMEOUT",
            stack: "Error: PaymentTimeout: External payment gateway connection dropped\n    at PaymentService.charge (payment.ts:62)\n    at OrderCoordinator.checkout (order.ts:114)",
          },
        },
      },
    ];

    // Emit live events progressively
    for (const step of sequence) {
      if (step.delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, Math.min(step.delay / 10, 60)));
      }
      this.repository.saveEvent(step.event);
      this.streamManager.broadcastEvent(step.event);
    }

    const errorEvent = sequence[sequence.length - 1].event;
    const allEvents = sequence.map((s) => s.event);
    const bundle = IncidentEngine.processIncident(errorEvent, allEvents);

    this.repository.saveIncident(bundle);
    this.streamManager.broadcastIncidentFreeze(bundle);

    return bundle;
  }
}
