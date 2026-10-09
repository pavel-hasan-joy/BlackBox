import { BlackBoxEvent } from "@blackbox/schema";

export interface CorrelatedSession {
  traceId?: string;
  requestId?: string;
  events: BlackBoxEvent[];
  startedAt: number;
  endedAt: number;
  servicesInvolved: string[];
  hasError: boolean;
  rootError?: BlackBoxEvent;
}

export class Correlator {
  /**
   * Correlates an unordered array of events into cohesive trace & request sessions
   */
  static correlateByTrace(events: BlackBoxEvent[]): Map<string, CorrelatedSession> {
    const traceMap = new Map<string, CorrelatedSession>();

    for (const evt of events) {
      const key = evt.traceId || evt.requestId || "unassociated";

      let session = traceMap.get(key);
      if (!session) {
        session = {
          traceId: evt.traceId,
          requestId: evt.requestId,
          events: [],
          startedAt: evt.timestamp,
          endedAt: evt.timestamp,
          servicesInvolved: [],
          hasError: false,
        };
        traceMap.set(key, session);
      }

      session.events.push(evt);
      session.startedAt = Math.min(session.startedAt, evt.timestamp);
      session.endedAt = Math.max(session.endedAt, evt.timestamp);

      if (!session.servicesInvolved.includes(evt.service)) {
        session.servicesInvolved.push(evt.service);
      }

      if (evt.type === "error") {
        session.hasError = true;
        if (!session.rootError) {
          session.rootError = evt;
        }
      }
    }

    // Sort events within each session chronologically
    for (const session of traceMap.values()) {
      session.events.sort((a, b) => a.timestamp - b.timestamp);
    }

    return traceMap;
  }

  /**
   * Extracts chronological call sequence from correlated events
   */
  static buildExecutionPath(events: BlackBoxEvent[]): string[] {
    const path: string[] = [];
    for (const evt of events) {
      const nodeName = evt.service;
      if (path.length === 0 || path[path.length - 1] !== nodeName) {
        path.push(nodeName);
      }
    }
    return path;
  }
}
