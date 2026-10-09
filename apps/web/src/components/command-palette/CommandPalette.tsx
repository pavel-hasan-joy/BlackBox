import React, { useState, useEffect } from "react";
import { Search, Flame, Server, Activity, X } from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIncident: (id: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectIncident,
}) => {
  const [query, setQuery] = useState("");

  const items = [
    { type: "incident", id: "INC-1042", label: "INC-1042: Payment timeout (CRITICAL)", category: "Incidents" },
    { type: "incident", id: "INC-1041", label: "INC-1041: DB connection spike (HIGH)", category: "Incidents" },
    { type: "trace", id: "4b5367d540726a70afdbaf49240e6597", label: "Trace: 4b5367d5... (POST /checkout)", category: "Traces" },
    { type: "service", id: "payment-service", label: "Service: payment-service (Degraded)", category: "Services" },
    { type: "service", id: "auth-service", label: "Service: auth-service (Healthy)", category: "Services" },
    { type: "action", id: "simulate", label: "Trigger: Simulate Incident Failure Scenario", category: "Actions" },
  ];

  const filtered = items.filter(
    (item) =>
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl rounded-xl border border-border-hover bg-panel p-2 shadow-2xl overflow-hidden font-mono text-sm">
        {/* Search Input Bar */}
        <div className="flex items-center px-3 py-2 border-b border-border-subtle gap-3">
          <Search className="w-4 h-4 text-cyan-400" />
          <input
            type="text"
            placeholder="Search incidents, traces, services, or actions... (ESC to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none text-xs"
          />
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Suggestion list */}
        <div className="max-h-72 overflow-y-auto py-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">No matching items found</div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (item.type === "incident") onSelectIncident(item.id);
                  onClose();
                }}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-panel-lighter cursor-pointer text-xs text-slate-300 hover:text-cyan-300 transition"
              >
                <div className="flex items-center gap-2.5">
                  {item.category === "Incidents" && <Flame className="w-3.5 h-3.5 text-red-400" />}
                  {item.category === "Traces" && <Activity className="w-3.5 h-3.5 text-cyan-400" />}
                  {item.category === "Services" && <Server className="w-3.5 h-3.5 text-purple-400" />}
                  {item.category === "Actions" && <span className="text-amber-400 font-bold">⚡</span>}
                  <span>{item.label}</span>
                </div>
                <span className="text-[10px] text-slate-500 uppercase px-1.5 py-0.5 rounded bg-slate-800">
                  {item.category}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer hints */}
        <div className="px-3 py-2 border-t border-border-subtle flex justify-between text-[10px] text-slate-500">
          <span>Navigate with arrows</span>
          <span>Press ESC to exit</span>
        </div>
      </div>
    </div>
  );
};
