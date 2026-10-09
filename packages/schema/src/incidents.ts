import { BlackBoxEvent } from "./events.js";

export type IncidentSeverity = "critical" | "high" | "medium" | "low";

export interface RootCauseEvidence {
  likelyCause: string;
  confidence: number; // 0-100%
  evidence: string[];
  affectedDependencies: string[];
  suggestedFix?: string;
}

export interface IncidentMetadata {
  incidentId: string;
  service: string;
  environment: string;
  severity: IncidentSeverity;
  startedAt: string; // ISO-8601
  endedAt: string; // ISO-8601
  rootEvent: string;
  traceId?: string;
  title: string;
  status: "open" | "mitigated" | "resolved";
  durationMs: number;
  rootCause?: RootCauseEvidence;
  preFailureWindowMs: number;
  postFailureWindowMs: number;
}

export interface ServiceNode {
  id: string;
  name: string;
  type: "service" | "database" | "external_api" | "cache";
  status: "healthy" | "degraded" | "failed";
  latencyMs?: number;
  errorMessage?: string;
}

export interface ServiceEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  status: "ok" | "slow" | "error";
  durationMs?: number;
}

export interface EvidenceGraphData {
  nodes: ServiceNode[];
  edges: ServiceEdge[];
  failurePath: string[]; // Node IDs involved in the direct failure path
  timestamp: number;
}

export interface IncidentBundle {
  metadata: IncidentMetadata;
  events: BlackBoxEvent[];
  trace: {
    traceId?: string;
    spans: Array<{
      spanId: string;
      parentSpanId?: string;
      name: string;
      service: string;
      startTime: number;
      durationMs: number;
      status: "ok" | "error";
      attributes: Record<string, unknown>;
    }>;
  };
  errors: Array<{
    id: string;
    message: string;
    stack?: string;
    timestamp: number;
    service: string;
    metadata?: Record<string, unknown>;
  }>;
  requests: Array<{
    requestId?: string;
    method?: string;
    path?: string;
    status?: number;
    durationMs?: number;
    timestamp: number;
  }>;
  dependencies: Array<{
    name: string;
    type: string;
    latencyMs: number;
    status: "ok" | "slow" | "error";
  }>;
  redactions: Array<{
    field: string;
    count: number;
  }>;
  snapshot: {
    memoryUsageMb: number;
    cpuPercent?: number;
    activeConnections?: number;
    eventCount: number;
    capturedAt: string;
  };
}
