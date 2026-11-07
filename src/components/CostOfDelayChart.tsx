import React from 'react';
import { RoundResult } from '../types/kanban';
import { TrendingDown, AlertCircle } from 'lucide-react';

interface CostOfDelayChartProps {
  history: RoundResult[];
}

export const CostOfDelayChart: React.FC<CostOfDelayChartProps> = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs shadow-2xs">
        <p className="font-medium text-slate-600 mb-1">Cost of Delay & Durchlaufzeiten-Vergleich</p>
        <p>Schließen Sie mindestens eine Simulationsrunde ab, um die Verzögerungskosten der roten Karte pro Runde zu vergleichen.</p>
      </div>
    );
  }

  // Sort rounds chronologically for the chart (Round 1, 2, ...)
  const sortedRounds = [...history].sort((a, b) => a.round - b.round);
  const maxCycleTime = Math.max(...sortedRounds.map((r) => r.redCycleTime), 20);

  // Assumed cost per day of delay for an expedite card (e.g. 500 € / Tag)
  const COST_PER_DAY = 500;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
            Cost of Delay & Lead Time pro Runde
          </h3>
          <p className="text-xs text-slate-500">
            Vergleich der Durchlaufzeit der roten Expedite-Karte und der resultierenden Verzögerungskosten.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="w-3 h-3 rounded-xs bg-red-600" />
            <span>Durchlaufzeit (Tage)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="w-3 h-3 rounded-xs bg-indigo-500" />
            <span>Flusseffizienz (%)</span>
          </div>
        </div>
      </div>

      {/* Bar Chart Visualization */}
      <div className="space-y-4 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedRounds.map((round) => {
            const delayCost = Math.round(round.redCycleTime * COST_PER_DAY);
            const cycleHeightPercent = Math.min(100, Math.round((round.redCycleTime / maxCycleTime) * 100));

            return (
              <div
                key={round.round}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-800">
                    Runde {round.round}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-semibold">
                    WiP {round.wipLimit}
                  </span>
                </div>

                {/* Relative visual bar */}
                <div className="my-2">
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-red-700 font-bold">{round.redCycleTime.toFixed(1)} Tage</span>
                    <span className="text-slate-500">~{delayCost.toLocaleString()} € Delay</span>
                  </div>
                  <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden flex">
                    <div
                      className="bg-red-600 h-full transition-all duration-300"
                      style={{ width: `${cycleHeightPercent}%` }}
                    />
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Flusseffizienz:</span>
                  <span
                    className={`font-mono font-bold ${
                      round.flowEfficiency >= 40
                        ? 'text-emerald-700'
                        : round.flowEfficiency >= 20
                        ? 'text-amber-700'
                        : 'text-red-600'
                    }`}
                  >
                    {round.flowEfficiency.toFixed(1)}% (BZ: {round.redBZ}d / WZ: {round.redWZ}d)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 p-3 bg-red-50/60 border border-red-200/60 rounded-lg text-xs text-red-950 flex items-start gap-2.5">
        <TrendingDown className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
        <div>
          <strong>Kanban-Fazit zum Cost of Delay:</strong> In Runden mit hohem WiP-Limit steht die rote Karte fast die gesamte Zeit in den Warteschlangen (WZ). Die reine Bearbeitungszeit (BZ) bleibt identisch, aber der Liefertermin verzögert sich um ein Vielfaches. WiP-Begrenzung schützt die Wertschöpfung!
        </div>
      </div>
    </div>
  );
};
