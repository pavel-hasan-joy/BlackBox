# BLACKBOX

### Production Failure Recorder & Incident Intelligence Platform

> [!NOTE]
> **Project Status: Work In Progress (Active Development — Not Yet Complete)**  
> BlackBox is currently under active development. Core bounded ring-buffer telemetry recording, pre-failure freeze engine, recursive secret redaction, causal evidence graph generation, and time-scrubbing are functional. Extended distributed tracing sinks, analytical storage adapters (ClickHouse), and multi-service mesh integrations are currently in progress.

> *"When production breaks, BlackBox remembers what happened before it broke."*  
> **Tagline:** Observe less. Remember better.  
> **Core Principle:** Logs tell you what happened. BlackBox tells you what led to the failure.

[![CI](https://github.com/pavel-hasan-joy/BlackBox/actions/workflows/ci.yml/badge.svg)](https://github.com/pavel-hasan-joy/BlackBox/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Benchmarks](https://img.shields.io/badge/Overhead-0.004ms-brightgreen.svg)](#-performance-benchmarks-empirical-proof)

---

## ⚡ Why BlackBox?

Traditional observability tools (logging aggregators, APMs) suffer from a fundamental flaw: **they tell you what failed, but not the complete sequence of events that led to the failure**. Keeping indefinite logs of every debug event in high-throughput services is cost-prohibitive.

**BlackBox acts as an aircraft flight data recorder for microservices:**
1. **Low-Overhead Ring Buffer:** Continuously records the last $N$ telemetry events in process memory ($O(1)$ writes).
2. **Incident Freeze:** When an unhandled error or SLO breach occurs, it freezes the pre-failure ($T-60\text{s}$) and post-failure ($T+10\text{s}$) window.
3. **Immutable Forensic Bundle:** Bundles timeline events, distributed traces, redaction logs, and process snapshots.
4. **Evidence Graph & Time-Scrubbing:** Enables engineers to scrub backwards in time: *"What did the system look like 1.8 seconds before the failure?"*
5. **AI Root Cause Investigator:** Deterministic rule engine combined with AI synthesis to diagnose root causes with confidence scoring.

---

## 🏛️ Architecture

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
Next.js / Vite Dashboard
```

---

## 🚀 Quick Start

### 1. Install & Integrate SDK

```bash
npm install @blackbox/sdk
```

```typescript
import { BlackBox, TraceContextManager } from "@blackbox/sdk";

// Initialize BlackBox Flight Recorder
const blackbox = new BlackBox({
  service: "payment-service",
  environment: "production",
  bufferSize: 10_000,
  redactKeys: ["password", "token", "authorization", "creditCard"],
  apiEndpoint: "http://localhost:4000",
});

blackbox.start();

// Record telemetry in high-throughput paths (negligible ~4µs overhead)
blackbox.record({
  type: "custom",
  data: { action: "payment_started", orderId: "ord_1024" },
});

// Automatically capture exceptions and freeze forensic bundle
try {
  await processPayment();
} catch (error) {
  blackbox.captureException(error);
  throw error;
}
```

### 2. Run the Full Stack Locally

```bash
# Clone the repository
git clone https://github.com/mdpavel/BlackBox.git
cd BlackBox

# Install dependencies across all workspaces
npm install

# Build all packages
npm run build

# Start API Backend (Port 4000) & Web Console (Port 3000)
npm run dev
```

Visit the Web Console at `http://localhost:3000`.

---

## 🔬 Performance Benchmarks (Empirical Proof)

BlackBox was benchmarked using empirical production workloads:

| Test Case | Metric | Measured Value | Notes |
| :--- | :--- | :--- | :--- |
| **RingBuffer Writes** | Throughput | **52,870,889 ops/sec** | Strictly $O(1)$ in-place circular writes |
| **RingBuffer vs Array.shift** | Speedup | **5.9x Faster** | Zero V8 Garbage Collection reallocations |
| **SDK Recording Overhead** | Mean Latency | **4.04 µs (0.004 ms)** | With deep recursive redaction |
| **P95 Latency Overhead** | Latency | **7.20 µs** | Negligible for production services |
| **Forensic Reconstruction** | Bundle Creation | **0.12 ms** per incident | 8,477 full incident bundles/sec |

Run the benchmarks locally at any time:
```bash
npm run benchmark
```

---

## 🔒 Security & Privacy by Design

BlackBox enforces recursive secret redaction before telemetry ever leaves memory:
- Automatically redacts: `password`, `token`, `authorization`, `apiKey`, `creditCard`, `cookie`, `sessionid`.
- Sanitizes HTTP headers (`Bearer eyJ...` -> `Bearer [REDACTED]`).
- Redaction manifests are audited in `redactions.json`.

---

## 🛒 Interactive E-Commerce Failure Demo

BlackBox includes an interactive demonstration of a real-world cascading microservice failure:

1. In the Web Console (`http://localhost:3000`), click **"SIMULATE INCIDENT"**.
2. BlackBox simulates:
   - `POST /checkout` -> API Gateway
   - Auth verified -> Auth Service
   - Order created -> Order Service
   - PostgreSQL transaction started
   - Inventory reserved
   - External Payment Gateway latency spikes (1549ms)
   - Retries #1 and #2 fail with timeout
   - Database transaction rolled back
   - `PaymentTimeout` 500 error triggered
3. The flight recorder freezes pre-failure context, updates the Evidence Graph with the failure path, and runs AI Root Cause analysis diagnosing the failure in under 1ms.

You can also run the headless simulation script:
```bash
cd examples/ecommerce-demo
npm start
```

---

## 📦 Monorepo Structure

```
blackbox/
├── apps/
│   ├── web/                # Vite + React + Tailwind + Motion Web Console
│   └── api/                # Fastify + WebSocket + REST Ingest & Query API
├── packages/
│   ├── sdk/                # Flight recorder client, RingBuffer, Redactor
│   ├── core/               # Incident Engine, Correlator, Evidence Graph, RCA
│   └── schema/             # Canonical event and incident bundle types
├── examples/
│   └── ecommerce-demo/     # Live microservices failure scenario demo
├── benchmarks/             # Microsecond-accurate empirical benchmark suite
├── docs/                   # Architecture, ADRs, privacy, and event models
└── docker-compose.yml      # Container orchestration
```

---

## 📜 License

MIT License. Designed & engineered by [mdpavel](https://github.com/mdpavel).
