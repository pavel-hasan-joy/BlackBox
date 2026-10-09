# BlackBox Architecture

BlackBox is a production failure recorder and incident intelligence platform. Unlike traditional logging systems that record only what happened at or after an error, BlackBox maintains a bounded, in-memory flight recording of telemetry events that led up to the failure.

```
 ┌─────────────────────┐
 │  Your Application   │
 └──────────┬──────────┘
            │
      BlackBox SDK
            │
            ▼
 ┌─────────────────────┐
 │   Local Recorder    │
 │    Ring Buffer      │
 └──────────┬──────────┘
            │
       Error/Event
            │
            ▼
 ┌─────────────────────┐
 │   Incident Engine   │
 └──────────┬──────────┘
            │
 ┌──────────┼──────────┐
 ▼          ▼          ▼
Redactor  Correlator  Snapshot
 │          │          │
 └──────────┼──────────┘
            ▼
 ┌─────────────────────┐
 │     Ingest API      │
 └──────────┬──────────┘
            │
 ┌──────────┴──────────┐
 ▼                     ▼
PostgreSQL           Redis / Memory
 │
 ▼
Query / API Layer
 │
 ▼
Next.js / Vite Dashboard
```

## Subsystems

1. **Local Recorder & Ring Buffer** (`@blackbox/sdk`):
   - In-memory circular buffer with fixed capacity (default: 10,000 events).
   - Guarantees $O(1)$ write operations with zero memory allocations after startup.
   - When capacity is reached, the oldest event is replaced automatically.

2. **Incident Engine & Freeze Pipeline** (`@blackbox/core`):
   - Detects failure signals (exceptions, HTTP 5xx, or SLO breaches).
   - Freezes pre-failure context ($T-60\text{s}$) and post-failure window ($T+10\text{s}$).
   - Packages an immutable forensic **Incident Bundle**.

3. **Recursive Redactor**:
   - Deeply scans headers, payloads, query parameters, and stack frames.
   - Masks sensitive credentials (`password`, `token`, `authorization`, `creditCard`, `apiKey`).

4. **Correlator & Evidence Graph**:
   - Correlates traces across distributed microservices using W3C Trace Context headers.
   - Builds causal dependency graphs with latency tracking and failure paths.

5. **AI Root Cause Investigator**:
   - Deterministic rule engine analyzing timeout clusters, retry loops, and latency spikes.
   - Computes statistical confidence scores and structured remediation advice.
