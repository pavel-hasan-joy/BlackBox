import { describe, it, expect } from "vitest";
import { Recorder } from "../src/recorder/recorder.js";
import { TraceContextManager } from "../src/context/trace-context.js";

describe("Recorder", () => {
  it("records events and injects active trace context", () => {
    const recorder = new Recorder({
      service: "payment-service",
      environment: "production",
      bufferSize: 100,
    });

    const traceId = TraceContextManager.generateTraceId();
    const spanId = TraceContextManager.generateSpanId();

    TraceContextManager.run({ traceId, spanId }, () => {
      const evt = recorder.record({
        type: "request",
        data: { path: "/checkout", method: "POST" },
      });

      expect(evt.id).toMatch(/^evt_/);
      expect(evt.service).toBe("payment-service");
      expect(evt.traceId).toBe(traceId);
      expect(evt.spanId).toBe(spanId);
      expect(evt.data.path).toBe("/checkout");
    });
  });

  it("calculates metrics accurately", () => {
    const recorder = new Recorder({
      service: "order-service",
      bufferSize: 50,
    });

    for (let i = 0; i < 75; i++) {
      recorder.record({
        type: "db_query",
        data: { query: "SELECT 1" },
      });
    }

    const metrics = recorder.getMetrics();
    expect(metrics.totalRecorded).toBe(75);
    expect(metrics.droppedCount).toBe(25);
    expect(metrics.bufferSize).toBe(50);
    expect(metrics.memoryUsageMb).toBeGreaterThan(0);
  });
});
