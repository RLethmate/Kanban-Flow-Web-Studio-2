import React, { useState, useEffect } from 'react';
import { RoundResult } from '../types/kanban';
import { Gauge, Zap, CheckCircle2, MousePointerClick } from 'lucide-react';

interface FlowInsightsProps {
  lastResult: RoundResult | null;
  history: RoundResult[];
  wipLimit: number;
}

export const FlowInsights: React.FC<FlowInsightsProps> = ({ lastResult, history }) => {
  // If we have at least 2 rounds, identify high WiP and low WiP for comparison
  const highestWipRound =
    history.length >= 2
      ? history.reduce((max, r) => (r.wipLimit > max.wipLimit ? r : max), history[0])
      : null;
  const lowestWipRound =
    history.length >= 2
      ? history.reduce((min, r) => (r.wipLimit < min.wipLimit ? r : min), history[0])
      : null;

  // Selected round state for interactive inspection
  const [selectedRoundNumber, setSelectedRoundNumber] = useState<number | null>(null);

  // Sync selected round when a new round finishes
  useEffect(() => {
    if (lastResult) {
      setSelectedRoundNumber(lastResult.round);
    } else if (history.length > 0) {
      setSelectedRoundNumber(history[0].round);
    }
  }, [lastResult, history.length]);

  const activeRound: RoundResult | null =
    (selectedRoundNumber !== null ? history.find((r) => r.round === selectedRoundNumber) : null) ||
    lastResult ||
    history[0] ||
    null;

  const showComparison =
    highestWipRound &&
    lowestWipRound &&
    highestWipRound.round !== lowestWipRound.round &&
    highestWipRound.wipLimit !== lowestWipRound.wipLimit;

  return (
    <div className="space-y-3">
      {/* Real-time Flow Efficiency Explainer for Selected Round */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-xs sm:text-sm text-slate-900">
              Flusseffizienz & Zeitaufteilung
            </h3>
          </div>

          {/* Quick Round Selector Pills */}
          {history.length > 1 && (
            <div className="flex items-center gap-1 overflow-x-auto text-xs">
              <span className="text-[11px] text-slate-400 mr-1">Runde wählen:</span>
              {history.map((r) => (
                <button
                  key={r.round}
                  onClick={() => setSelectedRoundNumber(r.round)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-colors cursor-pointer ${
                    activeRound?.round === r.round
                      ? 'bg-indigo-600 text-white shadow-xs font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Runde {r.round} (WiP {r.wipLimit})
                </button>
              ))}
            </div>
          )}
        </div>

        {activeRound ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Efficiency score card */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Runde {activeRound.round} (WiP {activeRound.wipLimit})
                  </span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.2 rounded font-mono">
                    Aktiv
                  </span>
                </div>
                <div className="my-1.5">
                  <span className="text-2xl font-bold font-mono text-indigo-700">
                    {activeRound.flowEfficiency.toFixed(1)}%
                  </span>
                  <span className="text-[11px] text-slate-500 ml-2">
                    Flusseffizienz
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500">
                {activeRound.flowEfficiency >= 30
                  ? 'Guter Fluss: Ein bedeutender Teil der Zeit floss in direkte Wertschöpfung.'
                  : 'Niedrige Effizienz: Fast die gesamte Zeit stand die Karte unproduktiv im Puffer.'}
              </p>
            </div>

            {/* BZ vs WZ ratio bar */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex flex-col justify-between md:col-span-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700 text-xs">
                  Zeitaufteilung der roten Karte in Runde {activeRound.round}
                </span>
                <span className="font-mono text-[11px] text-slate-500">
                  Durchlaufzeit: <strong>{activeRound.redCycleTime.toFixed(1)} Tage</strong>
                </span>
              </div>

              {/* Stacked bar */}
              <div className="w-full bg-slate-200 h-6 rounded-md overflow-hidden flex font-mono text-[10px] font-bold text-white shadow-2xs">
                {activeRound.redBZ > 0 && (
                  <div
                    className="bg-emerald-600 flex items-center justify-center transition-all"
                    style={{
                      width: `${(activeRound.redBZ / (activeRound.redBZ + activeRound.redWZ)) * 100}%`,
                    }}
                    title={`Bearbeitungszeit (BZ): ${activeRound.redBZ} Tage`}
                  >
                    BZ: {activeRound.redBZ}d ({((activeRound.redBZ / (activeRound.redBZ + activeRound.redWZ)) * 100).toFixed(0)}%)
                  </div>
                )}
                {activeRound.redWZ > 0 && (
                  <div
                    className="bg-amber-500 flex items-center justify-center transition-all"
                    style={{
                      width: `${(activeRound.redWZ / (activeRound.redBZ + activeRound.redWZ)) * 100}%`,
                    }}
                    title={`Wartezeit (WZ): ${activeRound.redWZ} Tage`}
                  >
                    WZ: {activeRound.redWZ}d ({((activeRound.redWZ / (activeRound.redBZ + activeRound.redWZ)) * 100).toFixed(0)}%)
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-500 mt-1.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-xs bg-emerald-600" />
                  <strong>Bearbeitungszeit (BZ):</strong> {activeRound.redBZ} Tage (echte Arbeit)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-xs bg-amber-500" />
                  <strong>Wartezeit (WZ):</strong> {activeRound.redWZ} Tage (Warteschlange)
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-slate-400 text-xs italic">
            Führe eine Simulationsrunde durch, um die Live-Flusseffizienz und Zeitaufteilung zu berechnen.
          </div>
        )}
      </div>

      {/* A/B Comparison: Low WIP vs High WIP with CLICKABLE TILES */}
      {showComparison && (
        <div className="bg-gradient-to-br from-indigo-50/40 to-white rounded-xl border border-indigo-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                A/B-Vergleich: Klicke auf eine Kachel zur Detailanzeige oben
              </h3>
            </div>
            <span className="text-[10px] text-indigo-600 flex items-center gap-1 font-medium">
              <MousePointerClick className="w-3 h-3" />
              Klick wechselt die Anzeige oben
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* High WIP Clickable Card */}
            <div
              onClick={() => setSelectedRoundNumber(highestWipRound.round)}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                activeRound?.round === highestWipRound.round
                  ? 'bg-red-50/90 border-red-500 ring-2 ring-red-400 shadow-xs'
                  : 'bg-red-50/50 border-red-200 hover:bg-red-50 hover:border-red-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-red-950 flex items-center gap-1">
                  Runde {highestWipRound.round} (Hohes WiP)
                  {activeRound?.round === highestWipRound.round && (
                    <span className="text-[9px] bg-red-600 text-white font-bold px-1.5 py-0.2 rounded font-mono">
                      Oben aktiv
                    </span>
                  )}
                </span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-red-200 font-bold text-red-700 text-[11px]">
                  WiP {highestWipRound.wipLimit}
                </span>
              </div>
              <ul className="space-y-0.5 font-mono text-red-900 text-[11px]">
                <li>Durchlaufzeit: <strong>{highestWipRound.redCycleTime.toFixed(1)} Tage</strong></li>
                <li>Flusseffizienz: <strong>{highestWipRound.flowEfficiency.toFixed(1)}%</strong></li>
                <li>Wartezeit (WZ): <strong>{highestWipRound.redWZ} Tage</strong> (Stau!)</li>
                <li>Durchsatz: <strong>{highestWipRound.throughput.toFixed(2)} K/Tag</strong></li>
              </ul>
              <div className="mt-1.5 pt-1 border-t border-red-200/60 text-[10px] text-red-700 italic flex items-center gap-1">
                <MousePointerClick className="w-2.5 h-2.5" />
                Klicken, um Zeitaufteilung oben zu laden
              </div>
            </div>

            {/* Low WIP Clickable Card */}
            <div
              onClick={() => setSelectedRoundNumber(lowestWipRound.round)}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                activeRound?.round === lowestWipRound.round
                  ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-400 shadow-xs'
                  : 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-emerald-950 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Runde {lowestWipRound.round} (Optimierter Fluss)
                  {activeRound?.round === lowestWipRound.round && (
                    <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded font-mono">
                      Oben aktiv
                    </span>
                  )}
                </span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-200 font-bold text-emerald-700 text-[11px]">
                  WiP {lowestWipRound.wipLimit}
                </span>
              </div>
              <ul className="space-y-0.5 font-mono text-emerald-900 text-[11px]">
                <li>Durchlaufzeit: <strong>{lowestWipRound.redCycleTime.toFixed(1)} Tage</strong></li>
                <li>Flusseffizienz: <strong>{lowestWipRound.flowEfficiency.toFixed(1)}%</strong></li>
                <li>Wartezeit (WZ): <strong>{lowestWipRound.redWZ} Tage</strong> (Minimal)</li>
                <li>Durchsatz: <strong>{lowestWipRound.throughput.toFixed(2)} K/Tag</strong></li>
              </ul>
              <div className="mt-1.5 pt-1 border-t border-emerald-200/60 text-[10px] text-emerald-700 italic flex items-center gap-1">
                <MousePointerClick className="w-2.5 h-2.5" />
                Klicken, um Zeitaufteilung oben zu laden
              </div>
            </div>
          </div>

          {/* Key Takeaway */}
          <div className="mt-2.5 p-2 bg-white rounded border border-indigo-100 text-[10px] text-slate-700">
            <strong>Erkenntnis für Teams:</strong> Beim Wechsel von Runde {highestWipRound.round} (WiP {highestWipRound.wipLimit}) zu Runde {lowestWipRound.round} (WiP {lowestWipRound.wipLimit}) sank die Durchlaufzeit um{' '}
            <strong className="text-emerald-700">
              {(
                ((highestWipRound.redCycleTime - lowestWipRound.redCycleTime) /
                  highestWipRound.redCycleTime) *
                100
              ).toFixed(0)}
              %
            </strong>
            , weil fast die gesamte Wartezeit eliminiert wurde.
          </div>
        </div>
      )}
    </div>
  );
};
