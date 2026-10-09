# Performance Benchmarks & Empirical Proof

BlackBox is designed with strict performance budgets so it can run inside high-throughput mission-critical services with zero noticeable latency impact.

## Empirical Benchmark Results

Measured locally on Node.js v24 (x64 Windows runtime):

### 1. RingBuffer vs. Native Array.shift()

| Implementation | Capacity | Iterations | Total Time | Throughput | Avg Latency | Memory Impact |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `Array + shift()` | 10,000 | 100,000 | 11.07 ms | 9,033,260 ops/s | 0.00011 ms | High GC churn |
| **BlackBox RingBuffer** | **10,000** | **100,000** | **1.89 ms** | **52,870,889 ops/s** | **0.00002 ms** | **Zero GC churn** |

> **Result:** RingBuffer is **5.9x faster** with strictly bounded $O(1)$ writes.

### 2. Full Telemetry Ingest with Recursive Redaction

- **Dataset:** 50,000 events with nested JSON payload, authorization headers, and tokens.
- **Mean Recording Overhead:** **4.04 µs (0.004 ms)**
- **P50 Latency:** **2.60 µs**
- **P95 Latency:** **7.20 µs**
- **P99 Latency:** **14.00 µs**
- **Throughput:** **240,268 events/sec** per single Node.js thread.

### 3. Forensic Reconstruction Pipeline

- **Benchmark:** Assembling 1,000 full incident bundles with 100 correlated events, dependency graphs, and RCA.
- **Latency:** **0.12 ms** per bundle.
- **Throughput:** **8,477 incidents/sec**.
