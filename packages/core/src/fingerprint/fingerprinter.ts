import { createHash } from "node:crypto";
import { BlackBoxEvent } from "@blackbox/schema";

export class Fingerprinter {
  /**
   * Generates a stable deterministic fingerprint string for an incident
   */
  static generate(errorEvent: BlackBoxEvent, relatedEvents: BlackBoxEvent[] = []): string {
    const errorMsg = String(errorEvent.data?.error || "unknown_error");
    const service = errorEvent.service;
    
    // Extract sanitized stack frame or call sequence
    const tracePath = relatedEvents
      .filter((e) => e.service)
      .map((e) => `${e.service}:${e.type}`)
      .slice(-5)
      .join("->");

    const raw = `${service}|${errorMsg.replace(/[0-9a-f]{8,}/gi, "HEX")}|${tracePath}`;
    return createHash("sha256").update(raw).digest("hex").slice(0, 16);
  }
}
