import React, { useState } from 'react';
import { CfdSnapshot } from '../types/kanban';
import { Info } from 'lucide-react';

interface CumulativeFlowDiagramProps {
  data: CfdSnapshot[];
}

export const CumulativeFlowDiagram: React.FC<CumulativeFlowDiagramProps> = ({ data }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (data.length < 2) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs shadow-2xs">
        <p className="font-medium text-slate-600 mb-1">Kumulatives Flussdiagramm (CFD)</p>
        <p>Starten Sie die Simulation, um den dynamischen Verlauf des Flusses und eventuelle Engpass-Staus aufzuzeichnen.</p>
      </div>
    );
  }

  // Diagram Dimensions
  const width = 800;
  const height = 320;
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxDay = Math.max(data[data.length - 1].day, 10);

  // For CFD stacking: we stack Done -> Warten C -> Schritt C -> Warten B -> Schritt B -> Warten A -> Schritt A
  // Total height per day is the sum of items on the board
  const maxTotalCards = Math.max(
    ...data.map(
      (d) =>
        d.done +
        d.wartenC +
        d.schrittC +
        d.wartenB +
        d.schrittB +
        d.wartenA +
        d.schrittA
    ),
    12
  );

  const getX = (day: number) => padding.left + (day / maxDay) * chartWidth;
  const getY = (val: number) => height - padding.bottom - (val / (maxTotalCards * 1.1)) * chartHeight;

  // Build stacked areas
  // Layers order:
  // 1: Done (bottom or top)
  // Let's do standard bottom-to-top CFD:
  // Base: Done
  // + Warten C
  // + Schritt C
  // + Warten B
  // + Schritt B
  // + Warten A
  // + Schritt A
  const layers = [
    { key: 'done', label: 'Done', color: '#10B981' }, // Emerald
    { key: 'wartenC', label: 'Warten C', color: '#F59E0B' }, // Amber (Queue vor C)
    { key: 'schrittC', label: 'Schritt C (Engpass)', color: '#EF4444' }, // Red
    { key: 'wartenB', label: 'Warten B', color: '#FCD34D' }, // Light amber
    { key: 'schrittB', label: 'Schritt B', color: '#3B82F6' }, // Blue
    { key: 'wartenA', label: 'Warten A', color: '#A5B4FC' }, // Indigo light
    { key: 'schrittA', label: 'Schritt A', color: '#6366F1' }, // Indigo
  ];

  // Precompute cumulative points
  const stackedData = data.map((d) => {
    let acc = 0;
    const points: Record<string, { y0: number; y1: number }> = {};
    for (const layer of layers) {
      const val = d[layer.key as keyof CfdSnapshot] as number;
      points[layer.key] = { y0: acc, y1: acc + val };
      acc += val;
    }
    return { day: d.day, points, total: acc, raw: d };
  });

  // Generate SVG polygon paths for each layer
  const areaPaths = layers.map((layer) => {
    const topPoints = stackedData.map((d) => `${getX(d.day)},${getY(d.points[layer.key].y1)}`);
    const bottomPoints = [...stackedData]
      .reverse()
      .map((d) => `${getX(d.day)},${getY(d.points[layer.key].y0)}`);
    const pathString = `M ${topPoints.join(' L ')} L ${bottomPoints.join(' L ')} Z`;
    return { ...layer, pathString };
  });

  const activeSnapshot = hoverIndex !== null && stackedData[hoverIndex] ? stackedData[hoverIndex] : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
            Kumulatives Flussdiagramm (CFD)
          </h3>
          <p className="text-xs text-slate-500">
            Zeigt Bestandsverteilung (WIP) und Durchlaufzeiten über die Zeitachse.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {layers.map((l) => (
            <div key={l.key} className="flex items-center gap-1.5 text-[11px] text-slate-600">
              <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: l.color }} />
              <span>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[650px] select-none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = height - padding.bottom - ratio * chartHeight;
            const cardVal = Math.round(ratio * (maxTotalCards * 1.1));
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#F1F5F9"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 font-mono text-[10px]"
                >
                  {cardVal}
                </text>
              </g>
            );
          })}

          {/* Area Polygons */}
          {areaPaths.map((layer) => (
            <path
              key={layer.key}
              d={layer.pathString}
              fill={layer.color}
              opacity={layer.key === 'wartenC' ? 0.85 : 0.75}
              className="transition-opacity hover:opacity-100"
            />
          ))}

          {/* X Axis */}
          <line
            x1={padding.left}
            y1={height - padding.bottom}
            x2={width - padding.right}
            y2={height - padding.bottom}
            stroke="#94A3B8"
            strokeWidth="1.5"
          />

          {/* X Axis Ticks */}
          {Array.from({ length: 6 }).map((_, i) => {
            const dayStep = Math.round((maxDay / 5) * i);
            const x = getX(dayStep);
            return (
              <g key={i}>
                <line
                  x1={x}
                  y1={height - padding.bottom}
                  x2={x}
                  y2={height - padding.bottom + 5}
                  stroke="#94A3B8"
                />
                <text
                  x={x}
                  y={height - padding.bottom + 18}
                  textAnchor="middle"
                  className="fill-slate-500 font-mono text-[10px]"
                >
                  Tag {dayStep}
                </text>
              </g>
            );
          })}

          {/* Invisible hover columns to trigger tooltip */}
          {stackedData.map((d, idx) => {
            const x = getX(d.day);
            const stepW = chartWidth / Math.max(data.length - 1, 1);
            return (
              <rect
                key={idx}
                x={x - stepW / 2}
                y={padding.top}
                width={stepW}
                height={chartHeight}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(idx)}
                className="cursor-crosshair"
              />
            );
          })}

          {/* Active Hover Crosshair */}
          {activeSnapshot && (
            <g>
              <line
                x1={getX(activeSnapshot.day)}
                y1={padding.top}
                x2={getX(activeSnapshot.day)}
                y2={height - padding.bottom}
                stroke="#334155"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <circle
                cx={getX(activeSnapshot.day)}
                cy={getY(activeSnapshot.total)}
                r="4"
                fill="#334155"
              />
            </g>
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {activeSnapshot && (
          <div
            className="absolute top-2 right-4 bg-slate-900/90 text-white p-3 rounded-lg text-xs shadow-lg backdrop-blur-xs font-mono space-y-1 pointer-events-none border border-slate-700"
          >
            <div className="font-bold text-indigo-300 font-sans border-b border-slate-700 pb-1">
              Tag {activeSnapshot.day}
            </div>
            <div className="text-[11px] flex justify-between gap-4">
              <span>Erledigt (Done):</span>
              <span className="font-bold text-emerald-400">{activeSnapshot.raw.done}</span>
            </div>
            <div className="text-[11px] flex justify-between gap-4">
              <span>Warten vor C (Stau):</span>
              <span className="font-bold text-amber-400">{activeSnapshot.raw.wartenB}</span>
            </div>
            <div className="text-[11px] flex justify-between gap-4">
              <span>Schritt C (Engpass):</span>
              <span className="font-bold text-red-400">{activeSnapshot.raw.schrittC}</span>
            </div>
            <div className="text-[11px] flex justify-between gap-4 border-t border-slate-700 pt-1">
              <span>In Progress Gesamt:</span>
              <span className="font-bold">{activeSnapshot.raw.inProgressTotal}</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 p-2.5 bg-slate-50 rounded-lg text-[11px] text-slate-500 flex items-center gap-2">
        <Info className="w-4 h-4 text-slate-400 shrink-0" />
        <span>
          <strong>Interpretation:</strong> Verbreitert sich der Streifen einer Warte-Spalte (z.B. gelb vor Schritt C), staut sich dort Arbeit. Ein horizontales Maß zwischen Eintritt und Done zeigt die jeweilige Durchlaufzeit.
        </span>
      </div>
    </div>
  );
};
