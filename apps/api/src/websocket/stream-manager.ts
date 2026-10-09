import { WebSocket } from "ws";
import { BlackBoxEvent, IncidentBundle } from "@blackbox/schema";

export type StreamMessageType =
  | "event"
  | "incident_freeze"
  | "lock_state"
  | "system_metrics"
  | "ping";

export interface StreamMessage {
  type: StreamMessageType;
  payload: unknown;
  timestamp: number;
}

export class StreamManager {
  private clients = new Set<WebSocket>();

  addClient(socket: WebSocket): void {
    this.clients.add(socket);

    socket.on("close", () => {
      this.clients.delete(socket);
    });

    // Send initial greeting / state
    this.sendToSocket(socket, {
      type: "lock_state",
      payload: { status: "LIVE" },
      timestamp: Date.now(),
    });
  }

  broadcast(type: StreamMessageType, payload: unknown): void {
    const msg: StreamMessage = {
      type,
      payload,
      timestamp: Date.now(),
    };
    const serialized = JSON.stringify(msg);

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(serialized);
        } catch (err) {
          console.error("[StreamManager] Failed to send message to client:", err);
        }
      }
    }
  }

  broadcastEvent(event: BlackBoxEvent): void {
    this.broadcast("event", event);
  }

  broadcastIncidentFreeze(bundle: IncidentBundle): void {
    // 1. Send FREEZING state
    this.broadcast("lock_state", { status: "FREEZING", incidentId: bundle.metadata.incidentId });

    setTimeout(() => {
      // 2. Broadcast incident bundle
      this.broadcast("incident_freeze", bundle);
      // 3. Set FROZEN state
      this.broadcast("lock_state", { status: "FROZEN", incidentId: bundle.metadata.incidentId });
    }, 400);
  }

  private sendToSocket(socket: WebSocket, message: StreamMessage): void {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }
}
