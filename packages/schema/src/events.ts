export type EventType =
  | "request"
  | "response"
  | "db_query"
  | "external_api"
  | "auth"
  | "cache"
  | "error"
  | "custom"
  | "deploy";

export interface BlackBoxEvent {
  id: string;
  timestamp: number;
  type: EventType;
  service: string;
  environment: string;
  traceId?: string;
  spanId?: string;
  parentSpanId?: string;
  requestId?: string;
  durationMs?: number;
  data: Record<string, unknown>;
}

export interface RedactionRecord {
  fieldPath: string;
  reason: string;
  redactedAt: number;
}
