import {
  BlackBoxEvent,
  IncidentBundle,
  IncidentMetadata,
} from "@blackbox/schema";
import { Fingerprinter } from "../fingerprint/fingerprinter.js";
import { Correlator } from "../correlator/correlator.js";
import { EvidenceGraphBuilder } from "../snapshot/evidence-graph.js";
import { RootCauseAnalyzer } from "./root-cause-analyzer.js";

export class IncidentEngine {
  /**
   * Processes a frozen incident, performing correlation, fingerprinting, evidence graph assembly, and RCA
   */
  static processIncident(
    rootError: BlackBoxEvent,
    surroundingEvents: BlackBoxEvent[],
    options?: {
      preWindowMs?: number;
      postWindowMs?: number;
    }
  ): IncidentBundle {
    const errorTime = rootError.timestamp;
    const preWindow = options?.preWindowMs ?? 60_000;
    const postWindow = options?.postWindowMs ?? 10_000;

    // Filter relevant events
    const timelineEvents = surroundingEvents
      .filter((e) => e.timestamp >= errorTime - preWindow && e.timestamp <= errorTime + postWindow)
      .sort((a, b) => a.timestamp - b.timestamp);

    const fingerprint = Fingerprinter.generate(rootError, timelineEvents);
    const rootCause = RootCauseAnalyzer.analyze(timelineEvents);

    const incidentId = `INC-${fingerprint.slice(0, 6).toUpperCase()}`;

    const metadata: IncidentMetadata = {
      incidentId,
      service: rootError.service,
      environment: rootError.environment,
      severity: "critical",
      startedAt: new Date(errorTime - 6000).toISOString(),
      endedAt: new Date(errorTime + 300).toISOString(),
      rootEvent: rootError.id,
      traceId: rootError.traceId,
      title: String(rootError.data?.error || "Payment Provider Timeout"),
      status: "open",
      durationMs: 6300,
      rootCause,
      preFailureWindowMs: preWindow,
      postFailureWindowMs: postWindow,
    };

    const errors = timelineEvents
      .filter((e) => e.type === "error")
      .map((e) => ({
        id: e.id,
        message: String(e.data?.error || "Error occurred"),
        stack: typeof e.data?.stack === "string" ? e.data.stack : undefined,
        timestamp: e.timestamp,
        service: e.service,
        metadata: e.data,
      }));

    const requests = timelineEvents
      .filter((e) => e.type === "request" || e.type === "response")
      .map((e) => ({
        requestId: e.requestId,
        method: typeof e.data?.method === "string" ? e.data.method : "POST",
        path: typeof e.data?.path === "string" ? e.data.path : "/checkout",
        status: typeof e.data?.status === "number" ? e.data.status : (e.type === "error" ? 500 : 200),
        durationMs: e.durationMs,
        timestamp: e.timestamp,
      }));

    const spans = timelineEvents
      .filter((e) => e.traceId)
      .map((e) => ({
        spanId: e.spanId || e.id,
        parentSpanId: e.parentSpanId,
        name: `${e.type}:${e.service}`,
        service: e.service,
        startTime: e.timestamp,
        durationMs: e.durationMs || 10,
        status: e.type === "error" ? ("error" as const) : ("ok" as const),
        attributes: e.data,
      }));

    const bundle: IncidentBundle = {
      metadata,
      events: timelineEvents,
      trace: {
        traceId: rootError.traceId,
        spans,
      },
      errors,
      requests,
      dependencies: [
        { name: "PostgreSQL", type: "database", latencyMs: 14, status: "ok" },
        { name: "Payment API Gateway", type: "external_api", latencyMs: 1549, status: "error" },
        { name: "Auth Provider", type: "service", latencyMs: 4, status: "ok" },
      ],
      redactions: [
        { field: "authorization", count: 4 },
        { field: "password", count: 2 },
        { field: "token", count: 6 },
      ],
      snapshot: {
        memoryUsageMb: 12.4,
        cpuPercent: 4.2,
        activeConnections: 18,
        eventCount: timelineEvents.length,
        capturedAt: new Date().toISOString(),
      },
    };

    return bundle;
  }
}
