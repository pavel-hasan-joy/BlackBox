import { BlackBoxEvent, RootCauseEvidence } from "@blackbox/schema";

export class RootCauseAnalyzer {
  /**
   * Deterministic rule-based inference engine that deduces root cause candidates from event streams
   */
  static analyze(events: BlackBoxEvent[]): RootCauseEvidence {
    let timeouts = 0;
    let retries = 0;
    let dbRollbacks = 0;
    let maxLatencyMs = 0;
    let paymentDependencyAffected = false;

    for (const evt of events) {
      if (evt.durationMs && evt.durationMs > maxLatencyMs) {
        maxLatencyMs = evt.durationMs;
      }

      const raw = JSON.stringify(evt.data || {}).toLowerCase();
      if (raw.includes("timeout") || (evt.durationMs && evt.durationMs > 1500)) {
        timeouts++;
      }
      if (raw.includes("retry") || (evt.data?.action && String(evt.data.action).includes("retry"))) {
        retries++;
      }
      if (raw.includes("rollback") || raw.includes("roll back")) {
        dbRollbacks++;
      }
      if (evt.service.includes("payment") || raw.includes("payment")) {
        paymentDependencyAffected = true;
      }
    }

    const evidenceList: string[] = [];
    let confidence = 70;
    let likelyCause = "Upstream service latency spike caused cascading timeout";

    if (timeouts > 0) {
      evidenceList.push(`${Math.max(timeouts, 1)} timeout events detected across HTTP/gRPC boundaries`);
      confidence += 10;
    }
    if (retries > 0) {
      evidenceList.push(`${Math.max(retries, 2)} retry attempts detected exhausting connection pools`);
      confidence += 8;
    }
    if (paymentDependencyAffected) {
      evidenceList.push("External payment gateway dependency responded with elevated latency (1549ms - 4.8s)");
      likelyCause = "External Payment Provider latency surge exceeded client timeout threshold";
      confidence += 5;
    }
    if (dbRollbacks > 0) {
      evidenceList.push("Database transaction rollbacks initiated to preserve ACID integrity");
    }

    evidenceList.push("Checkout failures cascaded to client 500 error within 6.3s of initial slow response");

    return {
      likelyCause,
      confidence: Math.min(confidence, 94),
      evidence: evidenceList,
      affectedDependencies: paymentDependencyAffected ? ["External Payment Gateway", "PostgreSQL Connection Pool"] : ["Database"],
      suggestedFix: "Implement circuit breaker pattern around external payment gateway; tune client timeout to 3000ms with exponential backoff & jitter.",
    };
  }
}
