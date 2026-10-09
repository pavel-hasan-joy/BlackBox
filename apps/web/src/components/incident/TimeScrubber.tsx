import React from "react";
import { Play, Pause, RotateCcw, FastForward } from "lucide-react";

interface TimeScrubberProps {
  minTimestamp: number;
  maxTimestamp: number;
  currentTimestamp: number;
  onScrub: (timestamp: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
}

export const TimeScrubber: React.FC<TimeScrubberProps> = ({
  minTimestamp,
  maxTimestamp,
  currentTimestamp,
  onScrub,
  isPlaying,
  onTogglePlay,
  onReset,
}) => {
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, "0")}:${d
      .getMinutes()
      .toString()
      .padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}.${d
      .getMilliseconds()
      .toString()
      .padStart(3, "0")}`;
  };

  const deltaFromStart = ((currentTimestamp - minTimestamp) / 1000).toFixed(1);
  const deltaFromFailure = ((maxTimestamp - currentTimestamp) / 1000).toFixed(1);

  const percentage =
    maxTimestamp > minTimestamp
      ? Math.min(100, Math.max(0, ((currentTimestamp - minTimestamp) / (maxTimestamp - minTimestamp)) * 100))
      : 100;

  return (
    <div className="w-full rounded-xl border border-border-subtle bg-panel p-4 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle/60 text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="text-cyan-400 font-semibold uppercase tracking-wider">Time Scrubber</span>
          <span className="text-slate-400 bg-panel-lighter px-2 py-0.5 rounded border border-border-subtle">
            T+{deltaFromStart}s (T-{deltaFromFailure}s to failure)
          </span>
        </div>
        <div className="text-slate-300 font-mono text-xs">
          State at: <span className="text-cyan-300 font-bold">{formatTime(currentTimestamp)}</span>
        </div>
      </div>

      {/* Slider Controls */}
      <div className="py-4 space-y-2">
        <div className="relative flex items-center">
          <input
            type="range"
            min={minTimestamp}
            max={maxTimestamp}
            step={50}
            value={currentTimestamp}
            onChange={(e) => onScrub(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
          />
        </div>

        <div className="flex justify-between text-[11px] font-mono text-slate-500">
          <span>{formatTime(minTimestamp)} (T-60s)</span>
          <span className="text-amber-400/80">1.8s before failure</span>
          <span className="text-red-400">{formatTime(maxTimestamp)} (Failure)</span>
        </div>
      </div>

      {/* Playback action buttons */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={onTogglePlay}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-panel-lighter border border-border-subtle hover:border-cyan-400 text-xs font-mono text-slate-200 transition"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{isPlaying ? "Pause Playback" : "Replay Sequence"}</span>
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-panel-lighter border border-border-subtle hover:border-slate-500 text-xs font-mono text-slate-400 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Error</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-400 italic">
          "What did the system look like before the failure?"
        </div>
      </div>
    </div>
  );
};
