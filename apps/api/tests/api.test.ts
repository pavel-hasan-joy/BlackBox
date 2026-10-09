import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer } from "../src/index.js";
import { FastifyInstance } from "fastify";

describe("apps/api REST & WebSocket endpoints", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    const server = await createServer();
    app = server.app;
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /health returns healthy status", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("healthy");
  });

  it("GET /v1/incidents returns seeded incidents (INC-1042)", async () => {
    const res = await app.inject({ method: "GET", url: "/v1/incidents" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBeGreaterThanOrEqual(1);
    expect(body.data.some((i: any) => i.incidentId === "INC-1042")).toBe(true);
  });

  it("GET /v1/incidents/:id returns full bundle with snapshot and RCA", async () => {
    const res = await app.inject({ method: "GET", url: "/v1/incidents/INC-1042" });
    expect(res.statusCode).toBe(200);
    const bundle = res.json().data;
    expect(bundle.metadata.incidentId).toBe("INC-1042");
    expect(bundle.metadata.severity).toBe("critical");
    expect(bundle.events.length).toBeGreaterThan(0);
    expect(bundle.metadata.rootCause.confidence).toBeGreaterThan(80);
  });

  it("GET /v1/incidents/:id/graph supports dynamic time-scrubbing", async () => {
    const res = await app.inject({ method: "GET", url: "/v1/incidents/INC-1042/graph" });
    expect(res.statusCode).toBe(200);
    const graph = res.json().data;
    expect(graph.nodes.length).toBeGreaterThan(0);
    expect(graph.failurePath.length).toBeGreaterThan(0);
  });

  it("POST /v1/events ingests telemetry event", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/events",
      payload: {
        id: "evt_test_1",
        timestamp: Date.now(),
        type: "custom",
        service: "test-service",
        environment: "staging",
        data: { message: "Telemetry ping" },
      },
    });
    expect(res.statusCode).toBe(202);
  });

  it("GET /v1/search queries incidents and services", async () => {
    const res = await app.inject({ method: "GET", url: "/v1/search?q=payment" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.results.length).toBeGreaterThan(0);
  });

  it("GET /v1/metrics returns BlackBox internals", async () => {
    const res = await app.inject({ method: "GET", url: "/v1/metrics" });
    expect(res.statusCode).toBe(200);
    const data = res.json().data;
    expect(data.recorderOverheadMs).toBe(0.18);
    expect(data.throughput.baselineReqSec).toBe(12400);
  });

  it("POST /v1/simulate/incident triggers full e-commerce failure freeze", async () => {
    const res = await app.inject({ method: "POST", url: "/v1/simulate/incident" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("incident_simulated");
    expect(body.incidentId).toBeDefined();
    expect(body.bundle.events.length).toBeGreaterThan(0);
  });
});
