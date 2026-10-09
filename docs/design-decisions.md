# Architecture Design Decisions (ADR)

## ADR-001: Bounded Circular Ring Buffer over Unbounded Arrays

### Context
Production services cannot allow memory leaks or unbounded queues when recording telemetry. Naive array appending with `array.shift()` incurs $O(N)$ memory element re-indexing and heavy V8 GC pressure.

### Decision
Implement a pre-allocated circular RingBuffer with fixed capacity (e.g. 10,000 items). Writes are guaranteed $O(1)$. When full, oldest entries are overwritten without memory reallocation.

---

## ADR-002: Interoperability with OpenTelemetry (Not Competition)

### Context
OpenTelemetry is the industry standard for telemetry collection, spans, and metrics. Building a proprietary signal format creates vendor lock-in.

### Decision
Tagline: *"Observe less. Remember better."*
Position BlackBox as a failure-reconstruction layer on top of OpenTelemetry:
- Use W3C Trace Context headers (`traceparent`, `tracestate`).
- Correlate events by `traceId` and `spanId`.
- Focus exclusively on pre-failure context retention and forensic timeline reconstruction.

---

## ADR-003: Deterministic Rule Engine Before AI Inference

### Context
Pure LLM/AI root cause analysis can hallucinate or introduce non-deterministic conclusions in engineering incidents.

### Decision
Layer 1: Deterministic rules (detect timeout bursts, calculate retry count, compute p95 latency divergence, check rollback states).
Layer 2: AI synthesis of validated evidence into actionable human-readable explanations with explicit confidence percentages.
