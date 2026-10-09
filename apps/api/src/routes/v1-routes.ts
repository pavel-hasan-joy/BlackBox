import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { BlackBoxEvent, IncidentBundle } from "@blackbox/schema";
import { IncidentRepository } from "../repositories/incident-repository.js";
import { IncidentService } from "../services/incident-service.js";

export function registerV1Routes(
  app: FastifyInstance,
  repository: IncidentRepository,
  service: IncidentService
): void {
  // POST /v1/events
  app.post("/v1/events", async (request: FastifyRequest<{ Body: BlackBoxEvent }>, reply: FastifyReply) => {
    const event = request.body;
    if (!event || !event.type || !event.service) {
      return reply.status(400).send({ error: "Invalid event payload: type and service are required" });
    }
    service.ingestEvent(event);
    return reply.status(202).send({ status: "accepted", id: event.id });
  });

  // POST /v1/incidents
  app.post("/v1/incidents", async (request: FastifyRequest<{ Body: IncidentBundle }>, reply: FastifyReply) => {
    const bundle = request.body;
    if (!bundle?.metadata?.incidentId) {
      return reply.status(400).send({ error: "Invalid incident bundle: metadata.incidentId required" });
    }
    service.saveIncidentBundle(bundle);
    return reply.status(201).send({ status: "stored", incidentId: bundle.metadata.incidentId });
  });

  // GET /v1/incidents
  app.get("/v1/incidents", async (_request, reply) => {
    const incidents = repository.listIncidents();
    return reply.send({ data: incidents, total: incidents.length });
  });

  // GET /v1/incidents/:id
  app.get("/v1/incidents/:id", async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const incident = repository.getIncident(request.params.id);
    if (!incident) {
      return reply.status(404).send({ error: `Incident ${request.params.id} not found` });
    }
    return reply.send({ data: incident });
  });

  // GET /v1/incidents/:id/timeline
  app.get("/v1/incidents/:id/timeline", async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const timeline = repository.getTimeline(request.params.id);
    return reply.send({ data: timeline, total: timeline.length });
  });

  // GET /v1/incidents/:id/graph
  app.get(
    "/v1/incidents/:id/graph",
    async (request: FastifyRequest<{ Params: { id: string }; Querystring: { timestamp?: string } }>, reply) => {
      const ts = request.query.timestamp ? Number(request.query.timestamp) : undefined;
      const graph = repository.getGraph(request.params.id, ts);
      if (!graph) {
        return reply.status(404).send({ error: `Incident ${request.params.id} not found` });
      }
      return reply.send({ data: graph });
    }
  );

  // GET /v1/traces/:traceId
  app.get("/v1/traces/:traceId", async (request: FastifyRequest<{ Params: { traceId: string } }>, reply) => {
    const trace = repository.getTrace(request.params.traceId);
    if (!trace) {
      return reply.status(404).send({ error: `Trace ${request.params.traceId} not found` });
    }
    return reply.send({ data: trace });
  });

  // GET /v1/services
  app.get("/v1/services", async (_request, reply) => {
    const services = [
      { name: "api-gateway", status: "healthy", errorRate: 0.01, p95Ms: 14, uptime: "99.99%" },
      { name: "auth-service", status: "healthy", errorRate: 0.00, p95Ms: 5, uptime: "100.00%" },
      { name: "order-service", status: "healthy", errorRate: 0.05, p95Ms: 24, uptime: "99.95%" },
      { name: "payment-service", status: "degraded", errorRate: 4.82, p95Ms: 1549, uptime: "98.40%" },
      { name: "inventory-service", status: "healthy", errorRate: 0.00, p95Ms: 12, uptime: "99.99%" },
    ];
    return reply.send({ data: services });
  });

  // GET /v1/services/:name
  app.get("/v1/services/:name", async (request: FastifyRequest<{ Params: { name: string } }>, reply) => {
    const name = request.params.name;
    return reply.send({
      data: {
        name,
        status: name.includes("payment") ? "degraded" : "healthy",
        activeIncidents: name.includes("payment") ? ["INC-1042"] : [],
      },
    });
  });

  // GET /v1/search
  app.get("/v1/search", async (request: FastifyRequest<{ Querystring: { q?: string } }>, reply) => {
    const query = request.query.q || "";
    const results = repository.search(query);
    return reply.send({ query, results });
  });

  // POST /v1/simulate/incident (e-commerce scenario trigger)
  app.post("/v1/simulate/incident", async (_request, reply) => {
    const bundle = await service.simulateIncidentScenario();
    return reply.status(200).send({
      status: "incident_simulated",
      incidentId: bundle.metadata.incidentId,
      message: "Checkout failure sequence injected, ring buffer frozen, and immutable bundle recorded.",
      bundle,
    });
  });

  // GET /v1/metrics (Performance Dashboard metrics from PDF Page 20)
  app.get("/v1/metrics", async (_request, reply) => {
    return reply.send({
      data: {
        recorderOverheadMs: 0.18,
        memoryUsageMb: 12.4,
        eventsPerSecond: 8420,
        droppedEventsPercent: 0.02,
        ingestLatencyP95Ms: 24,
        apiLatencyP95Ms: 41,
        incidentCreationMs: 11,
        throughput: {
          baselineReqSec: 12400,
          blackboxReqSec: 12210,
          overheadPercent: 1.5,
        },
      },
    });
  });
}
