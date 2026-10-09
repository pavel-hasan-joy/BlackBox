import {
  BlackBoxEvent,
  EvidenceGraphData,
  ServiceEdge,
  ServiceNode,
} from "@blackbox/schema";

export class EvidenceGraphBuilder {
  /**
   * Generates graph nodes and edges for the full incident or sliced at a specific point in time (Time Scrubbing)
   */
  static build(
    events: BlackBoxEvent[],
    targetTimestamp?: number
  ): EvidenceGraphData {
    // Slicing for Time-Scrubbing
    const activeEvents =
      targetTimestamp !== undefined
        ? events.filter((e) => e.timestamp <= targetTimestamp)
        : events;

    const nodesMap = new Map<string, ServiceNode>();
    const edges: ServiceEdge[] = [];
    const failurePath: string[] = [];

    // Base standard service nodes
    const ensureNode = (
      id: string,
      name: string,
      type: ServiceNode["type"],
      status: ServiceNode["status"] = "healthy",
      latencyMs?: number,
      errorMessage?: string
    ) => {
      if (!nodesMap.has(id)) {
        nodesMap.set(id, { id, name, type, status, latencyMs, errorMessage });
      } else {
        const existing = nodesMap.get(id)!;
        if (status === "failed" || (status === "degraded" && existing.status === "healthy")) {
          existing.status = status;
        }
        if (latencyMs !== undefined) existing.latencyMs = latencyMs;
        if (errorMessage) existing.errorMessage = errorMessage;
      }
    };

    // Prepopulate known architecture baseline
    ensureNode("client", "POST /checkout", "service");
    ensureNode("auth", "Auth Service", "service");
    ensureNode("order", "Order Service", "service");
    ensureNode("db", "PostgreSQL", "database");
    ensureNode("payment", "Payment Service / API", "external_api");

    let prevNodeId = "client";

    for (const evt of activeEvents) {
      if (evt.type === "request" && evt.data?.path === "/checkout") {
        ensureNode("client", "POST /checkout", "service", "healthy");
      }

      if (evt.service.includes("auth") || evt.type === "auth") {
        ensureNode("auth", "Auth Service", "service", "healthy", evt.durationMs || 4);
        edges.push({
          id: `edge_client_auth_${evt.id}`,
          source: "client",
          target: "auth",
          status: "ok",
          durationMs: evt.durationMs || 4,
        });
        prevNodeId = "auth";
      }

      if (evt.service.includes("order")) {
        ensureNode("order", "Order Service", "service", "healthy", evt.durationMs || 18);
        edges.push({
          id: `edge_auth_order_${evt.id}`,
          source: "auth",
          target: "order",
          status: "ok",
          durationMs: evt.durationMs || 18,
        });
        prevNodeId = "order";
      }

      if (evt.type === "db_query") {
        const isSlow = (evt.durationMs || 0) > 1000;
        ensureNode("db", "PostgreSQL", "database", isSlow ? "degraded" : "healthy", evt.durationMs || 14);
        edges.push({
          id: `edge_order_db_${evt.id}`,
          source: "order",
          target: "db",
          status: isSlow ? "slow" : "ok",
          durationMs: evt.durationMs || 14,
        });
      }

      if (evt.service.includes("payment") || evt.type === "external_api") {
        const isTimeout =
          String(evt.data?.error || "").includes("Timeout") ||
          (evt.durationMs || 0) > 1500;
        const status = isTimeout ? "degraded" : "healthy";
        ensureNode("payment", "Payment Service / API", "external_api", status, evt.durationMs || 1549);

        edges.push({
          id: `edge_order_payment_${evt.id}`,
          source: "order",
          target: "payment",
          label: evt.data?.action ? String(evt.data.action) : undefined,
          status: isTimeout ? "slow" : "ok",
          durationMs: evt.durationMs || 1549,
        });
      }

      if (evt.type === "error") {
        const errMsg = String(evt.data?.error || "Error");
        ensureNode("error_node", `CRITICAL: ${errMsg}`, "service", "failed", 0, errMsg);

        edges.push({
          id: `edge_fail_${evt.id}`,
          source: "payment",
          target: "error_node",
          status: "error",
          label: "FAILURE TIMEOUT",
        });

        failurePath.push("client", "auth", "order", "payment", "error_node");
      }
    }

    return {
      nodes: Array.from(nodesMap.values()),
      edges,
      failurePath: Array.from(new Set(failurePath)),
      timestamp: targetTimestamp || (activeEvents[activeEvents.length - 1]?.timestamp ?? Date.now()),
    };
  }
}
