import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { IncidentRepository } from "./repositories/incident-repository.js";
import { StreamManager } from "./websocket/stream-manager.js";
import { IncidentService } from "./services/incident-service.js";
import { registerV1Routes } from "./routes/v1-routes.js";

export async function createServer() {
  const app = Fastify({
    logger: false,
  });

  await app.register(cors, {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  });

  await app.register(websocket);

  const repository = new IncidentRepository();
  const streamManager = new StreamManager();
  const service = new IncidentService(repository, streamManager);

  // Register WebSocket stream endpoint
  app.register(async function (fastify) {
    fastify.get("/v1/stream", { websocket: true }, (socket /* WebSocket */, _req) => {
      streamManager.addClient(socket);
    });
  });

  // Health check
  app.get("/health", async () => {
    return { status: "healthy", timestamp: Date.now(), service: "blackbox-api" };
  });

  // Register V1 routes
  registerV1Routes(app, repository, service);

  return { app, repository, service, streamManager };
}

// Start standalone server if run directly
const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || "0.0.0.0";

createServer().then(({ app }) => {
  app.listen({ port: PORT, host: HOST }, (err, address) => {
    if (err) {
      console.error("[BlackBox API] Start error:", err);
      process.exit(1);
    }
    console.log(`[BlackBox API] ⚡ Server listening at ${address}`);
    console.log(`[BlackBox API] 📡 WebSocket stream active at ws://${HOST}:${PORT}/v1/stream`);
  });
}).catch(console.error);
