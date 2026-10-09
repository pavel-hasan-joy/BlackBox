# BlackBox Event Model

All telemetry events collected by BlackBox adhere to a normalized schema compatible with OpenTelemetry semantic conventions.

## Canonical Event Structure

```typescript
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
  id: string;               // Unique ID, e.g. "evt_4b5367d5"
  timestamp: number;        // Epoch milliseconds (high-resolution)
  type: EventType;          // Event categorization
  service: string;          // Originating microservice
  environment: string;      // "production", "staging"
  traceId?: string;         // W3C Distributed Trace ID (16 bytes hex)
  spanId?: string;          // Current span ID (8 bytes hex)
  parentSpanId?: string;    // Parent span ID
  requestId?: string;       // Ingress request identifier
  durationMs?: number;      // Operation latency in milliseconds
  data: Record<string, unknown>; // Redacted payload and attributes
}
```

## Immutable Incident Bundle Layout

When an incident triggers a freeze, BlackBox persists an immutable directory / archive:

```
incident_01HXYZ/
├── metadata.json       # Severity, timestamps, root event, service, RCA summary
├── events.jsonl        # Complete chronological telemetry before & during failure
├── trace.json          # Span breakdown & parent-child hierarchies
├── errors.json         # Stack traces and unhandled exception details
├── requests.json       # Ingress and egress HTTP/gRPC transactions
├── dependencies.json   # External databases and third-party APIs health
├── redactions.json     # Audit trail of redacted fields and counts
└── snapshot.json       # Process telemetry (CPU, Heap memory, Active handles)
```
