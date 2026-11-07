import React from 'react';
import { PRESETS } from '../simulation/constants';
import { Play, RotateCcw, Award } from 'lucide-react';

interface HeaderProps {
  roundCounter: number;
  dayCount: number;
  selectedPresetId: string;
  onSelectPreset: (presetId: string) => void;
  onReset: () => void;
  onStartRound: () => void;
  isRunning: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  roundCounter,
  dayCount,
  selectedPresetId,
  onSelectPreset,
  onReset,
  onStartRound,
  isRunning,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        {/* Brand Zone */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            K
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">
                Kanban Flow Studio
              </h1>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                it-agile
              </span>
            </div>
          </div>
        </div>

        {/* Center: Presets & Experiment Scenarios */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-md overflow-x-auto text-[11px] font-medium">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset.id)}
              className={`px-2.5 py-1 rounded whitespace-nowrap transition-colors cursor-pointer ${
                selectedPresetId === preset.id
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {preset.badgeText}
            </button>
          ))}
        </div>

        {/* Right Zone: Round counter, Sim Day and Primary Action */}
        <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
          <div className="text-right flex items-center gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-mono tracking-wider">
                Simulationstag
              </span>
              <span className="font-mono text-sm font-bold text-slate-800 tabular-nums">
                Tag {dayCount}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-mono tracking-wider">
                Abgeschlossene Runden
              </span>
              <span className="font-mono text-sm font-bold text-indigo-700 tabular-nums flex items-center justify-end gap-1">
                <Award className="w-3.5 h-3.5 text-indigo-600" />
                {roundCounter}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              title="Board zurücksetzen"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onStartRound}
              className={`px-3.5 py-2 text-xs font-semibold text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer ${
                isRunning ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isRunning ? 'Laufend...' : 'Neue Runde'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
