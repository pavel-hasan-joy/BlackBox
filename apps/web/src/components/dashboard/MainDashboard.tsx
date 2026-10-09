import React, { useState } from "react";
import { IncidentMetadata } from "@blackbox/schema";
import {
  Flame,
  AlertTriangle,
  Server,
  Activity,
  Layers,
  Search,
  Zap,
  CheckCircle2,
  Play,
  RotateCw,
  Cpu,
} from "lucide-react";
import { PerformanceCard } from "./PerformanceCard.js";

interface MainDashboardProps {
  incidents: IncidentMetadata[];
  onSelectIncident: (id: string) => void;
  onSimulateIncident: () => void;
  isSimulating: boolean;
  onOpenCommandPalette: () => void;
  metrics: any;
  liveState: "LIVE" | "FREEZING" | "FROZEN";
}

export const MainDashboard: React.FC<MainDashboardProps> = ({
  incidents,
  onSelectIncident,
  onSimulateIncident,
  isSimulating,
  onOpenCommandPalette,
  metrics,
  liveState,
}) => {
  const [activeNav, setActiveNav] = useState("overview");

  const services = [
    { name: "API Gateway", status: "Healthy", p95: "14ms", uptime: "99.99%" },
    { name: "Auth Service", status: "Healthy", p95: "5ms", uptime: "100.0%" },
    { name: "Order Service", status: "Healthy", p95: "24ms", uptime: "99.95%" },
    { name: "Payment Service", status: "Degraded", p95: "1549ms", uptime: "98.40%", alert: true },
    { name: "Inventory Service", status: "Healthy", p95: "12ms", uptime: "99.99%" },
    { name: "PostgreSQL Primary", status: "Healthy", p95: "8ms", uptime: "99.98%" },
  ];

  return (
    <div className="space-y-6 font-mono animate-fadeIn">
      {/* Top Banner & Simulation Trigger Bar */}
      <div className="rounded-xl border border-border-subtle bg-panel p-5 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 uppercase font-semibold">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            Flight Recorder Active
          </div>
          <h2 className="text-base text-slate-100 font-sans font-semibold mt-0.5">
            "When production breaks, BlackBox remembers what happened before it broke."
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Logs tell you what happened. BlackBox tells you what led to the failure.
          </p>
        </div>

        {/* E-Commerce Disaster Scenario Simulation Button (PDF Page 21-22) */}
        <div className="flex items-center gap-3">
          <button
            onClick={onSimulateIncident}
            disabled={isSimulating}
            className={`px-4 py-2.5 rounded-lg font-bold text-xs flex items-center gap-2 shadow-lg transition ${
              isSimulating
                ? "bg-red-900/60 text-red-300 border border-red-500 animate-pulse cursor-wait"
                : "bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white border border-red-400 glow-crimson"
            }`}
          >
            {isSimulating ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>INJECTING DISASTER & FREEZING BUFFER...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>SIMULATE INCIDENT (E-Commerce Timeout)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border-subtle bg-panel">
          <span className="text-[11px] text-slate-400 uppercase">Monitored Services</span>
          <p className="text-2xl font-bold text-slate-100 mt-1">8 Services</p>
          <span className="text-[10px] text-emerald-400">All registered in mesh</span>
        </div>

        <div className="p-4 rounded-xl border border-border-subtle bg-panel">
          <span className="text-[11px] text-slate-400 uppercase">Active Incidents</span>
          <p className="text-2xl font-bold text-red-400 mt-1">
            {incidents.length} Recorded
          </p>
          <span className="text-[10px] text-amber-400">1 Critical • 1 High</span>
        </div>

        <div className="p-4 rounded-xl border border-border-subtle bg-panel">
          <span className="text-[11px] text-slate-400 uppercase">Platform Uptime</span>
          <p className="text-2xl font-bold text-cyan-300 mt-1">99.97%</p>
          <span className="text-[10px] text-slate-500">Trailing 30 days</span>
        </div>

        <div className="p-4 rounded-xl border border-border-subtle bg-panel">
          <span className="text-[11px] text-slate-400 uppercase">Flight Buffer Capacity</span>
          <p className="text-2xl font-bold text-purple-300 mt-1">10,000 evt</p>
          <span className="text-[10px] text-cyan-400">Strictly O(1) writes</span>
        </div>
      </div>

      {/* Two Column Layout: Services Health & Error Rate Sparkline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Services Health List */}
        <div className="lg:col-span-1 rounded-xl border border-border-subtle bg-panel p-5">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-3">
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Services Topology
            </span>
            <span className="text-[10px] text-slate-400">STATUS</span>
          </div>

          <div className="space-y-2.5">
            {services.map((svc, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-lg bg-panel-lighter border border-border-subtle/50 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      svc.alert ? "bg-amber-400 animate-ping" : "bg-emerald-400"
                    }`}
                  />
                  <span className="text-slate-200 font-medium">{svc.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-[11px]">{svc.p95}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      svc.alert
                        ? "bg-amber-950 text-amber-300 border border-amber-800"
                        : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                    }`}
                  >
                    {svc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Error Rate Visualizer (ASCII & Metrics) */}
        <div className="lg:col-span-2 rounded-xl border border-border-subtle bg-panel p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-3">
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                System Error Rate & Failure Spike
              </span>
              <span className="text-xs text-red-400 font-bold">Spike: +4.82% at 12:42</span>
            </div>

            {/* ASCII Sparkline Graphic as shown in PDF Page 7 */}
            <div className="p-4 rounded-lg bg-black/60 border border-slate-800 font-mono text-cyan-400 text-xs leading-relaxed overflow-x-auto">
              <div className="text-slate-500 mb-1"># ERROR RATE SPIKE (TRAILING 60 SECONDS)</div>
              <div className="text-red-400">
                {"               ╱╲    ╱╲    "}
              </div>
              <div className="text-amber-400">
                {"    ──────────╯  ╲___╱  ╲────────────── (FAILURE TRIGGER POINT)"}
              </div>
              <div className="text-slate-600 mt-2 text-[10px]">
                T-60s ........... T-30s ........... T-10s .......... T+0s (Freeze)
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border-subtle/60 flex items-center justify-between text-xs text-slate-400">
            <span>Ring Buffer Window: 60s pre-failure context</span>
            <span className="text-cyan-400">Zero data dropped during incident</span>
          </div>
        </div>
      </div>

      {/* Recent Incidents (Shared Element Cards - PDF Page 7 & 19) */}
      <div className="rounded-xl border border-border-subtle bg-panel p-5">
        <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-400" />
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Recent Forensic Incidents (Click to expand workspace)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Showing {incidents.length} incidents
          </span>
        </div>

        <div className="space-y-3">
          {incidents.map((inc) => (
            <div
              key={inc.incidentId}
              onClick={() => onSelectIncident(inc.incidentId)}
              className="group cursor-pointer p-4 rounded-lg bg-panel-lighter border border-border-subtle hover:border-cyan-400/80 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md hover:shadow-cyan-950/20"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-cyan-300 group-hover:text-cyan-200 font-mono">
                  {inc.incidentId}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    inc.severity === "critical"
                      ? "bg-red-950 text-red-300 border border-red-800"
                      : "bg-amber-950 text-amber-300 border border-amber-800"
                  }`}
                >
                  {inc.severity}
                </span>
                <span className="text-xs text-slate-200 font-medium">
                  {inc.title}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>{inc.service}</span>
                <span className="text-slate-500">•</span>
                <span>{new Date(inc.startedAt).toLocaleTimeString()}</span>
                <span className="px-2.5 py-1 rounded bg-panel text-[11px] text-cyan-400 font-medium group-hover:bg-cyan-500 group-hover:text-black transition">
                  Investigate →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Internals Card (PDF Page 20) */}
      <PerformanceCard metrics={metrics} />
    </div>
  );
};
