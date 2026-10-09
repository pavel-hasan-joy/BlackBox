import { describe, it, expect } from "vitest";
import { BlackBoxEvent } from "@blackbox/schema";
import {
  Fingerprinter,
  Correlator,
  EvidenceGraphBuilder,
  RootCauseAnalyzer,
  IncidentEngine,
} from "../src/index.js";

describe("packages/core", () => {
  const mockEvents: BlackBoxEvent[] = [
    {
      id: "evt_1",
      timestamp: 1000,
      type: "request",
      service: "api-gateway",
      environment: "production",
      traceId: "trace_abc",
      data: { path: "/checkout", method: "POST" },
    },
    {
      id: "evt_2",
      timestamp: 1050,
      type: "auth",
      service: "auth-service",
      environment: "production",
      traceId: "trace_abc",
      durationMs: 5,
      data: { user: "u123" },
    },
    {
      id: "evt_3",
      timestamp: 1100,
      type: "db_query",
      service: "order-service",
      environment: "production",
      traceId: "trace_abc",
      durationMs: 14,
      data: { query: "INSERT INTO orders..." },
    },
    {
      id: "evt_4",
      timestamp: 2500,
      type: "external_api",
      service: "payment-service",
      environment: "production",
      traceId: "trace_abc",
      durationMs: 1549,
      data: { action: "charge", error: "Payment API slow" },
    },
    {
      id: "evt_5",
      timestamp: 4500,
      type: "custom",
      service: "payment-service",
      environment: "production",
      traceId: "trace_abc",
      data: { action: "payment_retry_#1" },
    },
    {
      id: "evt_6",
      timestamp: 6800,
      type: "error",
      service: "payment-service",
      environment: "production",
      traceId: "trace_abc",
      data: { error: "PaymentTimeout: Provider failed to respond" },
    },
  ];

  it("Fingerprinter produces deterministic hash for identical error profiles", () => {
    const errorEvt = mockEvents[5];
    const fp1 = Fingerprinter.generate(errorEvt, mockEvents);
    const fp2 = Fingerprinter.generate(errorEvt, mockEvents);
    expect(fp1).toBe(fp2);
    expect(fp1.length).toBe(16);
  });

  it("Correlator organizes events into trace sessions", () => {
    const sessions = Correlator.correlateByTrace(mockEvents);
    expect(sessions.has("trace_abc")).toBe(true);
    const session = sessions.get("trace_abc")!;
    expect(session.hasError).toBe(true);
    expect(session.events.length).toBe(6);
    expect(session.servicesInvolved).toContain("payment-service");
  });

  it("RootCauseAnalyzer identifies latency and timeout patterns with high confidence", () => {
    const rca = RootCauseAnalyzer.analyze(mockEvents);
    expect(rca.confidence).toBeGreaterThanOrEqual(85);
    expect(rca.evidence.length).toBeGreaterThan(2);
    expect(rca.suggestedFix).toBeDefined();
  });

  it("EvidenceGraphBuilder generates nodes, edges, and handles time-scrubbing slicing", () => {
    // Sliced before error
    const graphBefore = EvidenceGraphBuilder.build(mockEvents, 1200);
    const errorNodeBefore = graphBefore.nodes.find((n) => n.id === "error_node");
    expect(errorNodeBefore).toBeUndefined();

    // Sliced after error
    const graphAfter = EvidenceGraphBuilder.build(mockEvents, 7000);
    const errorNodeAfter = graphAfter.nodes.find((n) => n.id === "error_node");
    expect(errorNodeAfter).toBeDefined();
    expect(graphAfter.failurePath.length).toBeGreaterThan(0);
  });

  it("IncidentEngine packages full incident bundle", () => {
    const bundle = IncidentEngine.processIncident(mockEvents[5], mockEvents);
    expect(bundle.metadata.incidentId).toMatch(/^INC-/);
    expect(bundle.metadata.severity).toBe("critical");
    expect(bundle.events.length).toBe(6);
    expect(bundle.snapshot.eventCount).toBe(6);
  });
});
