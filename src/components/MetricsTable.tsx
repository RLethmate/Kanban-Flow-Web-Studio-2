import React from 'react';
import { RoundResult } from '../types/kanban';
import { Download, Trash2, Trophy, ArrowUpRight } from 'lucide-react';

interface MetricsTableProps {
  history: RoundResult[];
  onClear: () => void;
}

export const MetricsTable: React.FC<MetricsTableProps> = ({ history, onClear }) => {
  // Export table data as CSV
  const exportCsv = () => {
    if (history.length === 0) return;
    const headers = [
      'Runde',
      'WiP Limit',
      'Durchlaufzeit rote Karte (Tage)',
      'Flusseffizienz (%)',
      'Bearbeitungszeit BZ (Tage)',
      'Wartezeit WZ (Tage)',
      'In Progress',
      'Done',
      'Durchsatz (Karten/Tag)',
      'Uhrzeit',
    ];

    const rows = history.map((r) => [
      r.round,
      r.wipLimit,
      r.redCycleTime,
      r.flowEfficiency,
      r.redBZ,
      r.redWZ,
      r.inProgressCount,
      r.doneCount,
      r.throughput,
      `"${r.timestamp}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kanban_sim_runden_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Find round with highest flow efficiency
  const bestEfficiencyRound =
    history.length > 0
      ? history.reduce((prev, curr) => (curr.flowEfficiency > prev.flowEfficiency ? curr : prev))
      : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Table Header Controls */}
      <div className="px-4 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-xs text-slate-900 flex items-center gap-2">
            Runden-Ergebnisse & Metriken
            {history.length > 0 && (
              <span className="text-[11px] font-normal text-slate-500">
                ({history.length} {history.length === 1 ? 'Runde' : 'Runden'})
              </span>
            )}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <>
              <button
                onClick={exportCsv}
                className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 rounded text-xs font-medium text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Download className="w-3 h-3" />
                CSV
              </button>
              <button
                onClick={onClear}
                className="px-2.5 py-1 border border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 rounded text-xs font-medium text-slate-600 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                Leeren
              </button>
            </>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto max-h-[190px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-[10px] uppercase tracking-wider sticky top-0">
              <th className="py-1.5 px-3">Runde</th>
              <th className="py-1.5 px-3">WiP Limit</th>
              <th className="py-1.5 px-3">Durchlaufzeit rote Karte</th>
              <th className="py-1.5 px-3">Flusseffizienz</th>
              <th className="py-1.5 px-3">In Progress</th>
              <th className="py-1.5 px-3">Done</th>
              <th className="py-1.5 px-3">Durchsatz</th>
              <th className="py-1.5 px-3 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
            {history.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-5 text-center text-slate-400 font-sans italic text-xs">
                  Noch keine Runden abgeschlossen. Starte die Simulation, bis die rote Expedite-Karte &quot;Done&quot; erreicht!
                </td>
              </tr>
            ) : (
              history.map((row) => {
                const isBest = bestEfficiencyRound && bestEfficiencyRound.round === row.round && history.length > 1;

                return (
                  <tr
                    key={row.round}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isBest ? 'bg-emerald-50/40' : ''
                    }`}
                  >
                    <td className="py-1.5 px-3 font-bold text-slate-900 flex items-center gap-1">
                      {isBest && <Trophy className="w-3 h-3 text-amber-500 shrink-0" />}
                      Runde {row.round}
                    </td>
                    <td className="py-1.5 px-3 text-slate-700 font-bold">{row.wipLimit}</td>
                    <td className="py-1.5 px-3 text-red-600 font-bold">
                      {row.redCycleTime.toFixed(1)} d
                    </td>
                    <td className="py-1.5 px-3">
                      <span
                        className={`inline-block px-1.5 py-0.2 rounded font-bold ${
                          row.flowEfficiency >= 40
                            ? 'bg-emerald-100 text-emerald-800'
                            : row.flowEfficiency >= 20
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {row.flowEfficiency.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-slate-600">{row.inProgressCount}</td>
                    <td className="py-1.5 px-3 text-emerald-700 font-semibold">{row.doneCount}</td>
                    <td className="py-1.5 px-3 text-slate-800 font-semibold">
                      {row.throughput.toFixed(2)} <span className="text-[10px] text-slate-400 font-sans">K/d</span>
                    </td>
                    <td className="py-1.5 px-3 text-right text-slate-500 font-sans text-[10px]">
                      BZ: {row.redBZ}d · WZ: {row.redWZ}d
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Little's Law Footer Note */}
      <div className="px-3 py-1 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-600 flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1">
          <ArrowUpRight className="w-3 h-3 text-indigo-600" />
          <strong>Little&apos;s Law:</strong> Durchlaufzeit = WiP / Durchsatz.
        </span>
        <span className="text-slate-400">
          Flusseffizienz = BZ / (BZ + WZ) · 100%
        </span>
      </div>
    </div>
  );
};
