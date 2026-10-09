import React, { useState } from "react";
import { EvidenceGraphData, ServiceNode } from "@blackbox/schema";
import { AlertCircle, CheckCircle2, Clock, Database, Globe, Layers, Server } from "lucide-react";

interface EvidenceGraphProps {
  graphData: EvidenceGraphData;
  activeFailureStep?: number;
}

export const EvidenceGraph: React.FC<EvidenceGraphProps> = ({ graphData }) => {
  const [selectedNode, setSelectedNode] = useState<ServiceNode | null>(null);

  const getNodeIcon = (type: ServiceNode["type"]) => {
    switch (type) {
      case "database":
        return <Database className="w-4 h-4" />;
      case "external_api":
        return <Globe className="w-4 h-4" />;
      default:
        return <Server className="w-4 h-4" />;
    }
  };

  const getNodeBorder = (node: ServiceNode) => {
    if (node.status === "failed") return "border-red-500 bg-red-950/40 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse";
    if (node.status === "degraded") return "border-amber-500 bg-amber-950/40 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.2)]";
    return "border-slate-700 bg-panel text-slate-300 hover:border-cyan-500/50";
  };

  const isFailedPath = graphData.failurePath.length > 0;

  return (
    <div className="relative w-full rounded-xl border border-border-subtle bg-panel/60 p-6 backdrop-blur-md overflow-hidden">
      {/* Background technical grid */}
      <div className="absolute inset-0 bg-grid-subtle opacity-40 pointer-events-none" />

      {/* Header bar */}
      <div className="relative z-10 flex items-center justify-between pb-6 border-b border-border-subtle">
        <div className="flex items-center space-x-3">
          <Layers className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-semibold tracking-wider text-slate-200 uppercase font-mono">
            Evidence Graph & Causality Flow
          </h3>
        </div>
        <div className="flex items-center space-x-4 text-xs font-mono">
          <span className="flex items-center text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block mr-1.5" /> Healthy
          </span>
          <span className="flex items-center text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block mr-1.5" /> Degraded
          </span>
          <span className="flex items-center text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block mr-1.5" /> Failed
          </span>
        </div>
      </div>

      {/* SVG Canvas for Flow and Packet Animations */}
      <div className="relative z-10 py-8 min-h-[360px] flex flex-col items-center justify-center">
        {/* Row 1: Client Request */}
        <div className="flex justify-center mb-6">
          <div
            onClick={() => setSelectedNode(graphData.nodes.find((n) => n.id === "client") || null)}
            className="cursor-pointer px-4 py-2 rounded-lg border border-slate-700 bg-panel-lighter text-xs font-mono text-cyan-300 flex items-center gap-2 shadow-sm transition hover:border-cyan-400"
          >
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <span>POST /checkout</span>
            <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">Client</span>
          </div>
        </div>

        {/* Vertical Pulse Line 1 */}
        <div className="h-8 w-0.5 relative bg-slate-700 mb-2">
          <div className="absolute top-0 left-[-3px] w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
        </div>

        {/* Row 2: Auth Service */}
        <div className="flex justify-center mb-6">
          <div
            onClick={() => setSelectedNode(graphData.nodes.find((n) => n.id === "auth") || null)}
            className="cursor-pointer px-4 py-2 rounded-lg border border-slate-700 bg-panel-lighter text-xs font-mono text-slate-200 flex items-center gap-2 transition hover:border-cyan-400"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Auth Service</span>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">5ms</span>
          </div>
        </div>

        {/* Vertical Pulse Line 2 */}
        <div className="h-8 w-0.5 relative bg-slate-700 mb-2">
          <div className="absolute top-0 left-[-3px] w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
        </div>

        {/* Row 3: Order Service */}
        <div className="flex justify-center mb-8">
          <div
            onClick={() => setSelectedNode(graphData.nodes.find((n) => n.id === "order") || null)}
            className="cursor-pointer px-5 py-2.5 rounded-lg border border-slate-700 bg-panel-lighter text-xs font-mono text-slate-200 flex items-center gap-2 shadow-sm transition hover:border-cyan-400"
          >
            <Server className="w-3.5 h-3.5 text-blue-400" />
            <span>Order Service</span>
            <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">18ms</span>
          </div>
        </div>

        {/* Branch Split */}
        <div className="w-full max-w-lg grid grid-cols-2 gap-8 relative">
          {/* Connecting Branching lines */}
          <div className="absolute top-[-24px] left-1/4 right-1/4 h-6 border-t-2 border-l-2 border-r-2 border-slate-700 pointer-events-none" />

          {/* Branch Left: PostgreSQL */}
          <div className="flex flex-col items-center">
            <div
              onClick={() => setSelectedNode(graphData.nodes.find((n) => n.id === "db") || null)}
              className="cursor-pointer w-full p-3.5 rounded-lg border border-slate-700 bg-panel-lighter text-xs font-mono text-slate-300 flex items-center justify-between transition hover:border-cyan-400"
            >
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-400" />
                <span>PostgreSQL</span>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded">14ms • OK</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500 mt-2">DB Query / Transaction</div>
          </div>

          {/* Branch Right: Payment API / Gateway */}
          <div className="flex flex-col items-center">
            <div
              onClick={() => setSelectedNode(graphData.nodes.find((n) => n.id === "payment") || null)}
              className={`cursor-pointer w-full p-3.5 rounded-lg border transition ${
                isFailedPath
                  ? "border-red-500/80 bg-red-950/40 text-red-200 shadow-[0_0_25px_rgba(239,68,68,0.25)]"
                  : "border-slate-700 bg-panel-lighter text-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold">Payment Gateway</span>
                </div>
                <span className="text-[10px] text-red-400 bg-red-950/70 border border-red-800 px-1.5 py-0.5 rounded font-mono">
                  1549ms • ⚠ SLOW
                </span>
              </div>
            </div>

            {/* Error / Timeout indicator node */}
            {isFailedPath && (
              <div className="flex flex-col items-center mt-4 animate-fadeIn">
                <div className="h-6 w-0.5 bg-red-500 relative">
                  <span className="absolute -left-1 top-2 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                </div>
                <div className="mt-2 px-3 py-1.5 rounded bg-red-950 border border-red-500 text-[11px] font-mono text-red-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  <span>TIMEOUT EXCEEDED (500)</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Node Details Drawer */}
      {selectedNode && (
        <div className="relative z-10 mt-6 p-4 rounded-lg bg-panel-lighter border border-border-subtle flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase text-cyan-400">{selectedNode.name}</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                selectedNode.status === "failed" ? "bg-red-950 text-red-300" : "bg-emerald-950 text-emerald-300"
              }`}>
                {selectedNode.status.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Latency: {selectedNode.latencyMs ?? "N/A"}ms • Type: {selectedNode.type}
              {selectedNode.errorMessage && ` • Error: ${selectedNode.errorMessage}`}
            </p>
          </div>
          <button
            onClick={() => setSelectedNode(null)}
            className="text-xs font-mono text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};
