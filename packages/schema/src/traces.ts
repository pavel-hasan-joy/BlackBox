export interface SpanContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  traceFlags?: number;
}

export interface TraceSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  service: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  statusCode: "UNSET" | "OK" | "ERROR";
  statusMessage?: string;
  attributes: Record<string, unknown>;
  events: Array<{
    name: string;
    timestamp: number;
    attributes?: Record<string, unknown>;
  }>;
}
