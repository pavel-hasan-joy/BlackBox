import React from "react";
import { Gauge, Cpu, Zap, Activity } from "lucide-react";

interface PerformanceCardProps {
  metrics: {
    recorderOverheadMs: number;
    memoryUsageMb: number;
    eventsPerSecond: number;
    droppedEventsPercent: number;
    ingestLatencyP95Ms: number;
    apiLatencyP95Ms: number;
    incidentCreationMs: number;
    throughput: {
      baselineReqSec: number;
      blackboxReqSec: number;
      overheadPercent: number;
    };
  };
}

export const PerformanceCard: React.FC<PerformanceCardProps> = ({ metrics }) => {
  return (
    <div className="rounded-xl border border-border-subtle bg-panel p-5 backdrop-blur-md font-mono text-xs">
      <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
        <div className="flex items-center space-x-2 text-cyan-400">
          <Gauge className="w-4 h-4" />
          <span className="font-semibold uppercase tracking-wider text-slate-200">
            BlackBox Internals & Overhead
          </span>
        </div>
        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
          Sub-Millisecond Overhead
        </span>
      </div>

      {/* Grid Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-border-subtle/60">
        <div className="space-y-1">
          <span className="text-[11px] text-slate-400">Recorder Overhead</span>
          <p className="text-base font-bold text-cyan-300">{metrics.recorderOverheadMs} ms</p>
        </div>
        <div className="space-y-1">
          <span className="text-[11px] text-slate-400">Memory Footprint</span>
          <p className="text-base font-bold text-purple-300">{metrics.memoryUsageMb} MB</p>
        </div>
        <div className="space-y-1">
          <span className="text-[11px] text-slate-400">Ingest Throughput</span>
          <p className="text-base font-bold text-emerald-300">
            {metrics.eventsPerSecond.toLocaleString()} evt/s
          </p>
        </div>
        <div className="space-y-1">
          <span className="text-[11px] text-slate-400">Incident Freeze</span>
          <p className="text-base font-bold text-amber-300">{metrics.incidentCreationMs} ms</p>
        </div>
      </div>

      {/* Baseline Benchmark Comparison Bars */}
      <div className="pt-4 space-y-3">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-400">Request Throughput Benchmark (Baseline vs With BlackBox)</span>
          <span className="text-cyan-400">Δ {metrics.throughput.overheadPercent}% latency diff</span>
        </div>

        {/* Baseline Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Baseline (Vanilla Node.js)</span>
            <span>{metrics.throughput.baselineReqSec.toLocaleString()} req/s</span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-slate-400 rounded-full w-full" />
          </div>
        </div>

        {/* BlackBox Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-cyan-300">
            <span>With BlackBox Flight Recorder</span>
            <span>{metrics.throughput.blackboxReqSec.toLocaleString()} req/s</span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 rounded-full transition-all duration-500"
              style={{
                width: `${(metrics.throughput.blackboxReqSec / metrics.throughput.baselineReqSec) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
