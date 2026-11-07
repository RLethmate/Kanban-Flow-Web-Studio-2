import React from 'react';
import { Play, Pause, StepForward, RotateCcw, AlertTriangle, Zap, Dices } from 'lucide-react';

interface ControlToolbarProps {
  isRunning: boolean;
  onTogglePlayPause: () => void;
  onStepSimulation: () => void;
  onReset: () => void;
  wipLimit: number;
  onWipChange: (val: number) => void;
  tickSpeedMs: number;
  onSpeedChange: (ms: number) => void;
  complexities: Record<number, number>;
  onComplexityChange: (col: number, val: number) => void;
  redCardGenerated: boolean;
  redCardDueInSeconds: number | null;
  onTriggerRedCard: () => void;
  stochasticEnabled: boolean;
  onToggleStochastic: () => void;
}

export const ControlToolbar: React.FC<ControlToolbarProps> = ({
  isRunning,
  onTogglePlayPause,
  onStepSimulation,
  onReset,
  wipLimit,
  onWipChange,
  tickSpeedMs,
  onSpeedChange,
  complexities,
  onComplexityChange,
  redCardGenerated,
  redCardDueInSeconds,
  onTriggerRedCard,
  stochasticEnabled,
  onToggleStochastic,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 px-3 sm:px-6 py-1.5 shadow-2xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        {/* Playback & Step Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onTogglePlayPause}
            className={`px-3 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> Simulation starten
              </>
            )}
          </button>

          <button
            onClick={onStepSimulation}
            disabled={isRunning}
            title="Einen Simulationstag manuell weiterschalten"
            className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none rounded-lg text-xs font-medium text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <StepForward className="w-3.5 h-3.5 text-slate-600" />
            +1 Tag
          </button>

          <button
            onClick={onReset}
            title="Board zurücksetzen"
            className="p-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* WIP Limit Setting */}
        <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">
          <label htmlFor="wip-input" className="text-xs font-semibold text-slate-700 whitespace-nowrap">
            WiP-Limit:
          </label>
          <input
            id="wip-input"
            type="number"
            min={1}
            max={30}
            value={wipLimit}
            onChange={(e) => onWipChange(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-11 px-1 py-0.5 text-center font-mono text-xs font-bold bg-white border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
          <input
            type="range"
            min={2}
            max={24}
            value={wipLimit}
            onChange={(e) => onWipChange(parseInt(e.target.value))}
            className="w-16 sm:w-20 accent-indigo-600 cursor-pointer"
          />
          <span className="text-[10px] text-slate-400 hidden sm:inline">
            (Paare A, B, C)
          </span>
        </div>

        {/* Working Step Complexities (A, B, C) */}
        <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80" title="Komplexität in stabilen Simulationstagen (d) pro Arbeitsschritt">
          <span className="text-xs font-semibold text-slate-700">Komplexität (d):</span>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-medium">A:</span>
            <input
              type="number"
              min={1}
              max={10}
              value={complexities[1] ?? 1}
              onChange={(e) => onComplexityChange(1, Math.max(1, parseInt(e.target.value) || 1))}
              className="w-8 px-1 py-0.5 text-center font-mono bg-white border border-slate-300 rounded text-xs"
            />
            <span className="text-slate-500 font-medium ml-0.5">B:</span>
            <input
              type="number"
              min={1}
              max={10}
              value={complexities[3] ?? 2}
              onChange={(e) => onComplexityChange(3, Math.max(1, parseInt(e.target.value) || 1))}
              className="w-8 px-1 py-0.5 text-center font-mono bg-white border border-slate-300 rounded text-xs"
            />
            <span className="text-slate-500 font-medium ml-0.5">C:</span>
            <input
              type="number"
              min={1}
              max={10}
              value={complexities[5] ?? 5}
              onChange={(e) => onComplexityChange(5, Math.max(1, parseInt(e.target.value) || 1))}
              className="w-8 px-1 py-0.5 text-center font-mono bg-white border border-slate-300 rounded text-xs font-bold text-amber-700"
            />
          </div>
        </div>

        {/* Speed Slider */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <span className="text-slate-500 whitespace-nowrap">Tempo:</span>
          <input
            type="range"
            min={40}
            max={700}
            step={20}
            value={800 - tickSpeedMs} // Inverted so right is faster
            onChange={(e) => onSpeedChange(800 - parseInt(e.target.value))}
            className="w-20 accent-indigo-600 cursor-pointer"
          />
          <span className="font-mono text-[11px] text-slate-500 w-10 text-right tabular-nums">
            {tickSpeedMs <= 80 ? '10x' : tickSpeedMs <= 180 ? '4x' : tickSpeedMs <= 350 ? '2x' : '1x'}
          </span>
        </div>

        {/* Stochastic Variance & Expedite Card Controls */}
        <div className="flex items-center gap-2">
          {/* Stochastic Toggle */}
          <button
            onClick={onToggleStochastic}
            title="Stochastische Bearbeitungszeit: Simuliert zufällige Schwankungen (±1 Tag) wie in realen Kanban-Systemen"
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              stochasticEnabled
                ? 'bg-purple-50 text-purple-700 border-purple-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Dices className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Varianz</span>
          </button>

          {/* Red Card Button / Countdown */}
          {redCardGenerated ? (
            <div className="px-2.5 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-semibold flex items-center gap-1.5 border border-red-200">
              <Zap className="w-3.5 h-3.5 fill-red-600 text-red-600" />
              <span>Rote Karte aktiv</span>
            </div>
          ) : (
            <button
              onClick={onTriggerRedCard}
              title="Rote Expedite-Karte sofort im Backlog erzeugen"
              className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>
                Rote Karte {redCardDueInSeconds !== null && `(${redCardDueInSeconds}s)`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
