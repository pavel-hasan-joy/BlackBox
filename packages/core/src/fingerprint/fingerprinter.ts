import { BlackBoxEvent } from "@blackbox/schema";

/**
 * Fast, isomorphic hash function (32-bit FNV-1a converted to hex)
 * Works flawlessly across both Node.js and modern Browser runtimes without external dependencies.
 */
function fnv1aHex(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

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
    const h1 = fnv1aHex(raw);
    const h2 = fnv1aHex(raw.split("").reverse().join(""));
    return `${h1}${h2}`;
  }
}
