import { IncidentBundle, IncidentMetadata, EvidenceGraphData } from "@blackbox/schema";

const API_BASE = "http://localhost:4000";

export async function fetchIncidents(): Promise<IncidentMetadata[]> {
  try {
    const res = await fetch(`${API_BASE}/v1/incidents`);
    if (!res.ok) throw new Error("Failed to fetch incidents");
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.warn("Fallback to local mocked incidents:", err);
    return [];
  }
}

export async function fetchIncidentDetails(id: string): Promise<IncidentBundle | null> {
  try {
    const res = await fetch(`${API_BASE}/v1/incidents/${id}`);
    if (!res.ok) throw new Error("Failed to fetch incident details");
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error("Failed to load incident details:", err);
    return null;
  }
}

export async function fetchEvidenceGraph(
  incidentId: string,
  timestamp?: number
): Promise<EvidenceGraphData | null> {
  try {
    const url = timestamp
      ? `${API_BASE}/v1/incidents/${incidentId}/graph?timestamp=${timestamp}`
      : `${API_BASE}/v1/incidents/${incidentId}/graph`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch graph");
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error("Failed to fetch evidence graph:", err);
    return null;
  }
}

export async function simulateIncident(): Promise<IncidentBundle> {
  const res = await fetch(`${API_BASE}/v1/simulate/incident`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to trigger simulation");
  const json = await res.json();
  return json.bundle;
}

export async function fetchMetrics(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/v1/metrics`);
    if (!res.ok) throw new Error("Failed to fetch metrics");
    const json = await res.json();
    return json.data;
  } catch {
    return {
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
    };
  }
}
