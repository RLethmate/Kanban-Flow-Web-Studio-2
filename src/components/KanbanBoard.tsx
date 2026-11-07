import React from 'react';
import { KanbanCard, ColumnDefinition } from '../types/kanban';
import { INITIAL_COLUMNS } from '../simulation/constants';
import { Clock, CheckCircle2, Flame, Layers } from 'lucide-react';

interface KanbanBoardProps {
  cards: KanbanCard[];
  wipLimit: number;
  columnMaxCounts: number[];
  complexities: Record<number, number>;
  isCfdTab?: boolean;
}

const CFD_COLUMN_CONFIG: Record<
  number,
  { border: string; bg: string; headerBg: string; headerText: string; countBadge: string }
> = {
  0: { border: 'border-slate-300', bg: 'bg-slate-100/70', headerBg: 'bg-slate-200 text-slate-800', headerText: 'text-slate-800', countBadge: 'bg-slate-700 text-white' },
  1: { border: 'border-[#6366F1]/60', bg: 'bg-indigo-50/60', headerBg: 'bg-[#6366F1] text-white', headerText: 'text-white', countBadge: 'bg-indigo-900 text-white' },
  2: { border: 'border-[#A5B4FC]', bg: 'bg-[#EEF2FF]/60', headerBg: 'bg-[#A5B4FC] text-indigo-950 font-bold', headerText: 'text-indigo-950', countBadge: 'bg-indigo-800 text-white' },
  3: { border: 'border-[#3B82F6]/60', bg: 'bg-blue-50/60', headerBg: 'bg-[#3B82F6] text-white', headerText: 'text-white', countBadge: 'bg-blue-900 text-white' },
  4: { border: 'border-[#FCD34D]', bg: 'bg-[#FEF3C7]/60', headerBg: 'bg-[#FCD34D] text-amber-950 font-bold', headerText: 'text-amber-950', countBadge: 'bg-amber-800 text-white' },
  5: { border: 'border-[#EF4444]/60', bg: 'bg-red-50/60', headerBg: 'bg-[#EF4444] text-white', headerText: 'text-white', countBadge: 'bg-red-950 text-white' },
  6: { border: 'border-[#F59E0B]/60', bg: 'bg-amber-50/60', headerBg: 'bg-[#F59E0B] text-white', headerText: 'text-white', countBadge: 'bg-amber-950 text-white' },
  7: { border: 'border-[#10B981]/60', bg: 'bg-emerald-50/60', headerBg: 'bg-[#10B981] text-white', headerText: 'text-white', countBadge: 'bg-emerald-950 text-white' },
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  cards,
  wipLimit,
  columnMaxCounts,
  complexities,
  isCfdTab = false,
}) => {
  // Compute card counts in each column
  const getCardsInCol = (colId: number) => {
    return cards.filter((c) => c.col === colId).sort((a, b) => a.birthId - b.birthId);
  };

  // Compute group WIP counts
  const group1Count = cards.filter((c) => c.col === 1 || c.col === 2).length;
  const group2Count = cards.filter((c) => c.col === 3 || c.col === 4).length;
  const group3Count = cards.filter((c) => c.col === 5 || c.col === 6).length;

  return (
    <div className="bg-slate-100/70 px-3 py-2 border-b border-slate-200 overflow-x-auto">
      <div className="min-w-[980px] max-w-7xl mx-auto space-y-1.5">
        {/* Compact WIP Group Brackets Overview Bar */}
        <div className="grid grid-cols-8 gap-2 text-[11px]">
          {/* Backlog */}
          <div className="text-center font-medium text-slate-400 py-0.5">
            <span>Eingang</span>
          </div>

          {/* Group 1: Schritt A + Warten A */}
          <div className="col-span-2 bg-indigo-50/70 border border-indigo-200/80 rounded py-0.5 px-2 flex items-center justify-between text-indigo-950 font-medium">
            <span className="flex items-center gap-1 font-semibold text-[10px]">
              <Layers className="w-3 h-3 text-indigo-600" />
              WiP A: {group1Count} / {wipLimit}
            </span>
            {group1Count >= wipLimit && (
              <span className="text-[9px] bg-amber-500 text-white font-bold px-1 rounded uppercase">
                Voll
              </span>
            )}
          </div>

          {/* Group 2: Schritt B + Warten B */}
          <div className="col-span-2 bg-indigo-50/70 border border-indigo-200/80 rounded py-0.5 px-2 flex items-center justify-between text-indigo-950 font-medium">
            <span className="flex items-center gap-1 font-semibold text-[10px]">
              <Layers className="w-3 h-3 text-indigo-600" />
              WiP B: {group2Count} / {wipLimit}
            </span>
            {group2Count >= wipLimit && (
              <span className="text-[9px] bg-amber-500 text-white font-bold px-1 rounded uppercase">
                Voll
              </span>
            )}
          </div>

          {/* Group 3: Schritt C + Warten C */}
          <div className="col-span-2 bg-indigo-50/70 border border-indigo-200/80 rounded py-0.5 px-2 flex items-center justify-between text-indigo-950 font-medium">
            <span className="flex items-center gap-1 font-semibold text-[10px]">
              <Layers className="w-3 h-3 text-indigo-600" />
              WiP C: {group3Count} / {wipLimit}
            </span>
            {group3Count >= wipLimit && (
              <span className="text-[9px] bg-red-600 text-white font-bold px-1 rounded uppercase flex items-center gap-0.5">
                <Flame className="w-2.5 h-2.5" /> Engpass
              </span>
            )}
          </div>

          {/* Done Column Header */}
          <div className="text-center font-medium text-emerald-700 py-0.5 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span className="text-[10px]">Erledigt</span>
          </div>
        </div>

        {/* 8 Columns Kanban Board Grid - Compact Height for 13/9 screens */}
        <div className="grid grid-cols-8 gap-2 h-[215px]">
          {INITIAL_COLUMNS.map((col: ColumnDefinition) => {
            const colCards = getCardsInCol(col.id);
            const isWaitingCol = [2, 4, 6].includes(col.id);
            const isWorkingCol = [1, 3, 5].includes(col.id);
            const isBottleneckQueue = col.id === 4 && colCards.length >= 4;

            // For Done column: isolate red card to pin it at the top
            const redCardDone = col.type === 'done' ? colCards.find((c) => c.isRed) : null;
            const normalCardsDone = col.type === 'done' ? colCards.filter((c) => !c.isRed) : colCards;

            const cfdStyle = CFD_COLUMN_CONFIG[col.id];

            // Determine border & background based on whether CFD tab is active
            const columnClasses = isCfdTab
              ? `${cfdStyle.border} ${cfdStyle.bg}`
              : isBottleneckQueue
              ? 'border-amber-400 bg-amber-50/30'
              : col.type === 'done'
              ? 'border-emerald-200 bg-emerald-50/20'
              : 'border-slate-200 bg-white shadow-2xs';

            // Determine header classes
            const headerClasses = isCfdTab
              ? cfdStyle.headerBg
              : col.type === 'backlog'
              ? 'bg-slate-100/90 border-slate-200 text-slate-800'
              : isWorkingCol
              ? 'bg-slate-50 border-slate-200 text-slate-800'
              : isWaitingCol
              ? 'bg-slate-100/60 border-slate-200 text-slate-800'
              : 'bg-emerald-100/50 border-emerald-200 text-slate-800';

            return (
              <div
                key={col.id}
                className={`rounded-lg border flex flex-col overflow-hidden transition-colors duration-200 ${columnClasses}`}
              >
                {/* Column Header */}
                <div
                  className={`px-2 py-1 border-b flex items-center justify-between shrink-0 transition-colors duration-200 ${headerClasses}`}
                >
                  <div className="flex items-center gap-1 truncate">
                    <span className="font-bold text-[11px] truncate" title={col.name}>
                      {col.name}
                    </span>
                    {isWorkingCol && (
                      <span className={`text-[9px] font-mono ${isCfdTab ? 'opacity-80' : 'text-slate-400'}`}>
                        ({complexities[col.id] ?? col.defaultComplexity}d)
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-1 rounded-sm ${
                      isCfdTab
                        ? cfdStyle.countBadge
                        : colCards.length > 0
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {colCards.length}
                  </span>
                </div>

                {/* Column Body / Cards Container */}
                <div className="p-1.5 flex-1 flex flex-col gap-1 overflow-y-auto">
                  {colCards.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-slate-300 text-[10px] italic">
                      Leer
                    </div>
                  ) : col.type === 'done' ? (
                    /* SPECIAL DONE COLUMN LAYOUT: Pinned Red Card + Compact Grid of Finished Cards */
                    <div className="space-y-1">
                      {/* Pinned Red Card if Done */}
                      {redCardDone && (
                        <div className="p-1 rounded bg-red-100 border border-red-500 text-red-950 ring-1 ring-red-400 font-mono text-[10px] shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold bg-red-600 text-white px-1 rounded">
                              #{redCardDone.birthId}
                            </span>
                            <span className="font-bold text-red-700 uppercase text-[9px] flex items-center gap-0.5">
                              <Flame className="w-2.5 h-2.5 fill-current" /> Expedite
                            </span>
                          </div>
                          <div className="mt-0.5 flex justify-between text-[9px]">
                            <span>Lead: <strong>{redCardDone.cycleTime}d</strong></span>
                            <span>BZ:{redCardDone.BZ}d · WZ:{redCardDone.WZ}d</span>
                          </div>
                        </div>
                      )}

                      {/* Normal Done Cards in Compact 2-Column Grid */}
                      <div className="grid grid-cols-2 gap-1">
                        {normalCardsDone.map((card) => (
                          <div
                            key={card.birthId}
                            className="px-1 py-0.5 bg-slate-50 border border-slate-200 rounded text-[9px] font-mono flex items-center justify-between text-slate-700"
                            title={`Karte #${card.birthId} · Start Tag ${card.startDay} · Fertig Tag ${card.finishDay}`}
                          >
                            <span className="font-bold text-slate-900">#{card.birthId}</span>
                            <span className="text-emerald-700 font-semibold">
                              {card.cycleTime !== null ? `${card.cycleTime}d` : '-'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* NORMAL / WORKING / WAITING COLUMNS */
                    colCards.map((card) => {
                      const activeComplexity = complexities[col.id] || 1;
                      const progressPercent = Math.min(
                        100,
                        Math.round((card.processingTime / activeComplexity) * 100)
                      );

                      return (
                        <div
                          key={card.birthId}
                          className={`px-1.5 py-1 rounded border transition-all text-[10px] ${
                            card.isRed
                              ? 'bg-red-50 border-red-500 text-red-950 ring-1 ring-red-400 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`font-mono text-[9px] font-bold px-1 rounded ${
                                card.isRed ? 'bg-red-600 text-white' : 'bg-slate-700 text-white'
                              }`}
                            >
                              #{card.birthId}
                            </span>

                            {card.isRed ? (
                              <span className="text-[8px] font-bold uppercase text-red-600 flex items-center">
                                EXP
                              </span>
                            ) : card.daysOnBoard > 0 ? (
                              <span className="text-[9px] font-mono text-slate-400">
                                {card.daysOnBoard}d
                              </span>
                            ) : null}
                          </div>

                          {/* Progress bar in Working Column */}
                          {isWorkingCol && (
                            <div className="mt-0.5 space-y-0.5">
                              <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${
                                    card.isRed ? 'bg-red-600' : 'bg-indigo-600'
                                  }`}
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Red Card Live BZ and WZ meters */}
                          {card.isRed && (
                            <div className="mt-0.5 text-[8px] font-mono flex justify-between text-red-800">
                              <span>BZ: {card.BZ}d</span>
                              <span>WZ: {card.WZ}d</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
