import React, { useState, useEffect } from "react";
import {
  IncidentBundle,
  EvidenceGraphData,
  BlackBoxEvent,
} from "@blackbox/schema";
import {
  ArrowLeft,
  Flame,
  AlertTriangle,
  Clock,
  Sparkles,
  CheckCircle,
  FileText,
  Activity,
  Layers,
  Database,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { EvidenceGraph } from "../graph/EvidenceGraph.js";
import { TimeScrubber } from "./TimeScrubber.js";
import { EvidenceGraphBuilder } from "@blackbox/core";

interface IncidentWorkspaceProps {
  bundle: IncidentBundle;
  onBack: () => void;
}

export const IncidentWorkspace: React.FC<IncidentWorkspaceProps> = ({
  bundle,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<"evidence" | "timeline" | "trace" | "logs" | "metadata">("evidence");
  const [scrubTimestamp, setScrubTimestamp] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const events = bundle.events;
  const minTime = events.length > 0 ? events[0].timestamp : Date.now() - 60000;
  const maxTime = events.length > 0 ? events[events.length - 1].timestamp : Date.now();

  useEffect(() => {
    setScrubTimestamp(maxTime);
  }, [bundle]);

  // Handle play/pause animation for Time Scrubber
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setScrubTimestamp((prev) => {
          const step = (maxTime - minTime) / 25;
          if (prev >= maxTime) {
            setIsPlaying(false);
            return maxTime;
          }
          return Math.min(maxTime, prev + step);
        });
      }, 350);
    }
    return () => clearInterval(interval);
  }, [isPlaying, minTime, maxTime]);

  // Compute time-scrubbed Evidence Graph dynamically!
  const currentGraph: EvidenceGraphData = EvidenceGraphBuilder.build(
    events,
    scrubTimestamp
  );

  const meta = bundle.metadata;
  const rca = meta.rootCause;

  return (
    <div className="space-y-6 animate-fadeIn font-mono">
      {/* Top Incident Header Bar */}
      <div className="rounded-xl border border-red-500/30 bg-panel p-6 backdrop-blur-md relative overflow-hidden shadow-2xl">
        {/* Subtle crimson shockwave glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-panel-lighter border border-border-subtle hover:border-cyan-400 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold tracking-tight text-white font-mono">
                  {meta.incidentId}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-950 border border-red-500 text-red-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  {meta.severity}
                </span>
                <span className="text-xs text-slate-400 bg-panel-lighter px-2 py-0.5 rounded border border-border-subtle">
                  {meta.service}
                </span>
              </div>
              <h1 className="text-lg text-slate-200 font-sans font-semibold mt-1">
                {meta.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400 font-mono">
            <div>
              <span className="block text-[10px] text-slate-500 uppercase">Started At</span>
              <span className="text-slate-200">{new Date(meta.startedAt).toLocaleTimeString()}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 uppercase">Duration</span>
              <span className="text-amber-400 font-bold">{(meta.durationMs / 1000).toFixed(1)}s</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 uppercase">Recorder State</span>
              <span className="text-cyan-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400" /> FROZEN (Bundle Locked)
              </span>
            </div>
          </div>
        </div>

        {/* AI Root Cause Investigation Card (PDF Page 23) */}
        {rca && (
          <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-red-950/40 via-panel-lighter to-panel border border-red-500/40">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-red-500/20">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>AI Root Cause Intelligence</span>
              </div>
              <div className="text-xs text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/50">
                Confidence: {rca.confidence}%
              </div>
            </div>

            <p className="text-sm font-sans font-semibold text-white mb-2">
              {rca.likelyCause}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300 font-mono">
              <div className="space-y-1">
                <span className="text-[10px] uppercase text-slate-400 font-bold">Correlated Evidence:</span>
                <ul className="space-y-1">
                  {rca.evidence.map((ev, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-slate-300">
                      <span className="text-red-400">•</span>
                      <span>{ev}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {rca.suggestedFix && (
                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-700 space-y-1">
                  <span className="text-[10px] uppercase text-cyan-400 font-bold">Actionable Remediation:</span>
                  <p className="text-xs text-slate-200">{rca.suggestedFix}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Time Scrubber (Page 9) */}
      <TimeScrubber
        minTimestamp={minTime}
        maxTimestamp={maxTime}
        currentTimestamp={scrubTimestamp}
        onScrub={(ts) => setScrubTimestamp(ts)}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onReset={() => setScrubTimestamp(maxTime)}
      />

      {/* Interactive Evidence Graph View */}
      <EvidenceGraph graphData={currentGraph} />

      {/* Tabs Menu */}
      <div className="flex border-b border-border-subtle space-x-1 text-xs font-mono">
        {[
          { id: "evidence", label: "EVIDENCE & DEPS", icon: Layers },
          { id: "timeline", label: "TIMELINE SEQUENCE", icon: Clock },
          { id: "trace", label: "DISTRIBUTED TRACE", icon: Activity },
          { id: "logs", label: "EVENT LOGS", icon: FileText },
          { id: "metadata", label: "IMMUTABLE BUNDLE", icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium transition ${
                active
                  ? "border-cyan-400 text-cyan-300 bg-panel-lighter/50"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="rounded-xl border border-border-subtle bg-panel p-5 backdrop-blur-md">
        {/* TAB 1: Evidence & Dependencies */}
        {activeTab === "evidence" && (
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Affected Dependencies & Performance Impact
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bundle.dependencies.map((dep, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${
                    dep.status === "error"
                      ? "border-red-500/60 bg-red-950/30 text-red-200"
                      : "border-slate-700 bg-panel-lighter text-slate-300"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs">{dep.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        dep.status === "error"
                          ? "bg-red-900 text-red-200"
                          : "bg-emerald-950 text-emerald-300"
                      }`}
                    >
                      {dep.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Type: <span className="text-slate-200">{dep.type}</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Latency: <span className="text-amber-400 font-bold">{dep.latencyMs} ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Timeline Sequence with event pulses (Page 8) */}
        {activeTab === "timeline" && (
          <div className="space-y-3">
            <div className="text-xs text-slate-400 mb-2">
              Chronological event flight recording (-60s to failure event):
            </div>
            <div className="space-y-2">
              {events.map((evt, i) => {
                const isError = evt.type === "error";
                const isSlow = evt.durationMs && evt.durationMs > 1000;
                return (
                  <div
                    key={evt.id || i}
                    className={`flex items-start justify-between p-3 rounded-lg border text-xs font-mono transition ${
                      isError
                        ? "border-red-500/80 bg-red-950/40 text-red-200"
                        : isSlow
                        ? "border-amber-500/50 bg-amber-950/20 text-amber-200"
                        : "border-slate-800 bg-panel-lighter text-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-slate-500">
                        {new Date(evt.timestamp).toLocaleTimeString()}.{String(new Date(evt.timestamp).getMilliseconds()).padStart(3, "0")}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                          isError
                            ? "bg-red-800 text-white"
                            : "bg-slate-800 text-cyan-300"
                        }`}
                      >
                        {evt.type}
                      </span>
                      <div>
                        <span className="font-semibold text-white mr-2">{evt.service}:</span>
                        <span>
                          {evt.data?.error
                            ? String(evt.data.error)
                            : evt.data?.action
                            ? String(evt.data.action)
                            : evt.data?.path
                            ? `${evt.data.method || "GET"} ${evt.data.path}`
                            : JSON.stringify(evt.data)}
                        </span>
                      </div>
                    </div>

                    {evt.durationMs !== undefined && (
                      <span className={`text-[11px] font-bold ${isSlow ? "text-amber-400" : "text-slate-400"}`}>
                        {evt.durationMs}ms
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: Distributed Trace */}
        {activeTab === "trace" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-border-subtle">
              <span>Trace ID: <span className="text-cyan-300 font-bold">{bundle.trace.traceId}</span></span>
              <span>Total Spans: {bundle.trace.spans.length}</span>
            </div>
            <div className="space-y-2">
              {bundle.trace.spans.map((span, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-slate-800 bg-panel-lighter flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-cyan-400">{span.name}</span>
                    <span className="text-slate-400 text-[11px]">({span.service})</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400">{span.durationMs}ms</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        span.status === "error" ? "bg-red-950 text-red-300" : "bg-emerald-950 text-emerald-300"
                      }`}
                    >
                      {span.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Raw Logs with Redactions */}
        {activeTab === "logs" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-border-subtle">
              <span className="text-slate-400">Events Stream (.jsonl format)</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Sensitive Fields Redacted (Passwords, Tokens, Keys)
              </span>
            </div>
            <pre className="p-4 rounded-lg bg-black/60 border border-slate-800 text-slate-300 text-[11px] font-mono overflow-x-auto max-h-96">
              {events.map((e) => JSON.stringify(e)).join("\n")}
            </pre>
          </div>
        )}

        {/* TAB 5: Immutable Bundle Structure (Page 5) */}
        {activeTab === "metadata" && (
          <div className="space-y-3">
            <div className="text-xs text-slate-400">
              Immutable forensic incident bundle (generated by flight recorder):
            </div>
            <pre className="p-4 rounded-lg bg-black/60 border border-slate-800 text-cyan-300 text-[11px] font-mono overflow-x-auto max-h-96">
              {JSON.stringify(
                {
                  "metadata.json": bundle.metadata,
                  "snapshot.json": bundle.snapshot,
                  "redactions.json": bundle.redactions,
                  "dependencies.json": bundle.dependencies,
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
