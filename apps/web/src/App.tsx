import React, { useState, useEffect } from "react";
import {
  IncidentBundle,
  IncidentMetadata,
} from "@blackbox/schema";
import {
  fetchIncidents,
  fetchIncidentDetails,
  fetchMetrics,
  simulateIncident,
} from "./lib/api.js";
import { MainDashboard } from "./components/dashboard/MainDashboard.js";
import { IncidentWorkspace } from "./components/incident/IncidentWorkspace.js";
import { CommandPalette } from "./components/command-palette/CommandPalette.js";
import { Search, ShieldAlert, Radio, Terminal, Box } from "lucide-react";

export function App() {
  const [incidents, setIncidents] = useState<IncidentMetadata[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<IncidentBundle | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [metrics, setMetrics] = useState({
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
  });
  const [liveState, setLiveState] = useState<"LIVE" | "FREEZING" | "FROZEN">("LIVE");

  // Load initial data
  useEffect(() => {
    loadData();

    // Setup WebSocket connection to API /v1/stream (PDF Page 18)
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.hostname}:4000/v1/stream`;
    let ws: WebSocket;

    try {
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "lock_state") {
            setLiveState(msg.payload.status);
          } else if (msg.type === "incident_freeze") {
            // New incident arrived!
            const newBundle = msg.payload as IncidentBundle;
            setIncidents((prev) => [
              newBundle.metadata,
              ...prev.filter((i) => i.incidentId !== newBundle.metadata.incidentId),
            ]);
            setSelectedIncident(newBundle);
            setLiveState("FROZEN");
          }
        } catch (e) {
          console.warn("[App WS] Parse error:", e);
        }
      };

      ws.onclose = () => {
        console.log("[App WS] Stream disconnected, will retry");
      };
    } catch (err) {
      console.warn("[App WS] Failed to initialize stream:", err);
    }

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const loadData = async () => {
    const [incList, met] = await Promise.all([fetchIncidents(), fetchMetrics()]);
    if (incList && incList.length > 0) {
      setIncidents(incList);
    }
    if (met) {
      setMetrics(met);
    }
  };

  const handleSelectIncident = async (id: string) => {
    const details = await fetchIncidentDetails(id);
    if (details) {
      setSelectedIncident(details);
    }
  };

  const handleSimulateIncident = async () => {
    setIsSimulating(true);
    setLiveState("FREEZING");
    try {
      const bundle = await simulateIncident();
      setLiveState("FROZEN");
      setIncidents((prev) => [
        bundle.metadata,
        ...prev.filter((i) => i.incidentId !== bundle.metadata.incidentId),
      ]);
      setSelectedIncident(bundle);
    } catch (err) {
      console.error("Simulation failed:", err);
      setLiveState("LIVE");
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20">
      {/* Global Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-border-subtle bg-background/80 backdrop-blur-md px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Tagline */}
          <div
            onClick={() => setSelectedIncident(null)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 transition shadow-[0_0_15px_rgba(0,240,255,0.2)]">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <span className="font-mono text-base font-bold tracking-widest text-white group-hover:text-cyan-300 transition">
                BLACKBOX
              </span>
              <span className="hidden sm:inline-block text-[11px] font-mono text-slate-500 ml-3">
                Production Flight Recorder
              </span>
            </div>
          </div>

          {/* Search shortcut & Live indicator */}
          <div className="flex items-center gap-4">
            {/* Search Palette button (PDF Page 7 & 10) */}
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-panel border border-border-subtle hover:border-slate-600 text-xs text-slate-400 font-mono transition"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 border border-slate-700">
                ⌘K
              </kbd>
            </button>

            {/* Live / Frozen Indicator (PDF Page 9) */}
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider transition ${
                liveState === "LIVE"
                  ? "bg-emerald-950/80 border border-emerald-500/50 text-emerald-300"
                  : liveState === "FREEZING"
                  ? "bg-amber-950/80 border border-amber-500/50 text-amber-300 animate-pulse"
                  : "bg-red-950/80 border border-red-500/60 text-red-300"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  liveState === "LIVE"
                    ? "bg-emerald-400 animate-pulse"
                    : liveState === "FREEZING"
                    ? "bg-amber-400"
                    : "bg-red-400"
                }`}
              />
              <span>● {liveState}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {selectedIncident ? (
          <IncidentWorkspace
            bundle={selectedIncident}
            onBack={() => {
              setSelectedIncident(null);
              setLiveState("LIVE");
            }}
          />
        ) : (
          <MainDashboard
            incidents={incidents}
            onSelectIncident={handleSelectIncident}
            onSimulateIncident={handleSimulateIncident}
            isSimulating={isSimulating}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            metrics={metrics}
            liveState={liveState}
          />
        )}
      </main>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectIncident={handleSelectIncident}
      />
    </div>
  );
}
