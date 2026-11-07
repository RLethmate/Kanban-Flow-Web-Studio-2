import React, { useState, useMemo, useEffect } from 'react';
import { CfdSnapshot, RoundResult } from '../types/kanban';
import { Info, Triangle, Layers, Sliders, CheckCircle2, MousePointerClick, Activity } from 'lucide-react';

interface CumulativeFlowDiagramProps {
  data: CfdSnapshot[];
  history?: RoundResult[];
  wipLimit?: number;
}

export const CumulativeFlowDiagram: React.FC<CumulativeFlowDiagramProps> = ({
  data,
  history = [],
  wipLimit = 10,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showLittlesLaw, setShowLittlesLaw] = useState<boolean>(true);
  
  // Selected round for CFD inspection (null = live simulation, number = round number)
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);

  // If new rounds are completed, default to showing the latest completed round if current simulation is at day 0
  useEffect(() => {
    if (data.length <= 1 && history.length > 0 && selectedRoundId === null) {
      setSelectedRoundId(history[0].round);
    }
  }, [data.length, history, selectedRoundId]);

  // Determine active CFD dataset
  const activeRoundObj = selectedRoundId !== null ? history.find((r) => r.round === selectedRoundId) : null;
  const activeData: CfdSnapshot[] =
    (activeRoundObj && activeRoundObj.cfdData && activeRoundObj.cfdData.length >= 2)
      ? activeRoundObj.cfdData
      : data;

  // Interactive Day selection for Little's Law Triangle
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Reset or adjust selectedDay when changing rounds
  useEffect(() => {
    if (activeData.length >= 2) {
      setSelectedDay(Math.max(1, Math.floor(activeData[activeData.length - 1].day * 0.55)));
    }
  }, [selectedRoundId]);

  if (activeData.length < 2) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs shadow-2xs">
        <p className="font-medium text-slate-600 mb-1">Kumulatives Flussdiagramm (CFD)</p>
        <p>Starten Sie die Simulation, um den dynamischen Verlauf des Flusses und eventuelle Engpass-Staus aufzuzeichnen.</p>
      </div>
    );
  }

  // Diagram Dimensions
  const width = 800;
  const height = 340;
  const padding = { top: 25, right: 35, bottom: 45, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxDay = Math.max(activeData[activeData.length - 1].day, 10);

  // For CFD stacking: we stack Done -> Warten C -> Schritt C -> Warten B -> Schritt B -> Warten A -> Schritt A
  const maxTotalCards = Math.max(
    ...activeData.map(
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

  // Stacking layers order (matching Kanban board columns)
  const layers = [
    { key: 'done', label: 'Done', color: '#10B981' }, // Emerald
    { key: 'wartenC', label: 'Warten C', color: '#F59E0B' }, // Amber
    { key: 'schrittC', label: 'Schritt C (Engpass)', color: '#EF4444' }, // Red
    { key: 'wartenB', label: 'Warten B', color: '#FCD34D' }, // Light amber
    { key: 'schrittB', label: 'Schritt B', color: '#3B82F6' }, // Blue
    { key: 'wartenA', label: 'Warten A', color: '#A5B4FC' }, // Indigo light
    { key: 'schrittA', label: 'Schritt A', color: '#6366F1' }, // Indigo
  ];

  // Precompute cumulative points
  const stackedData = useMemo(() => {
    return activeData.map((d) => {
      let acc = 0;
      const points: Record<string, { y0: number; y1: number }> = {};
      for (const layer of layers) {
        const val = d[layer.key as keyof CfdSnapshot] as number;
        points[layer.key] = { y0: acc, y1: acc + val };
        acc += val;
      }
      return { day: d.day, points, total: acc, raw: d };
    });
  }, [activeData]);

  // Generate SVG polygon paths for each layer
  const areaPaths = useMemo(() => {
    return layers.map((layer) => {
      const topPoints = stackedData.map((d) => `${getX(d.day)},${getY(d.points[layer.key].y1)}`);
      const bottomPoints = [...stackedData]
        .reverse()
        .map((d) => `${getX(d.day)},${getY(d.points[layer.key].y0)}`);
      const pathString = `M ${topPoints.join(' L ')} L ${bottomPoints.join(' L ')} Z`;
      return { ...layer, pathString };
    });
  }, [stackedData, maxDay, maxTotalCards]);

  // Determine active measurement day for Little's Law triangle safely clamped to available data
  const lastDataDay = activeData.length > 0 ? activeData[activeData.length - 1].day : 1;
  const activeMeasDay = Math.min(
    lastDataDay,
    Math.max(1, selectedDay !== null && selectedDay <= lastDataDay ? selectedDay : Math.floor(lastDataDay * 0.55) || 1)
  );

  const measSnapshotIndex = Math.min(
    stackedData.length - 1,
    Math.max(0, stackedData.findIndex((s) => s.day >= activeMeasDay))
  );
  const measSnapshot = stackedData[measSnapshotIndex] || stackedData[stackedData.length - 1] || stackedData[0];

  // Calculate Little's Law triangle geometry with fallback safeguards
  const targetLevel = measSnapshot?.points?.['schrittA']?.y1 ?? 12;
  const doneLevelAtMeas = measSnapshot?.points?.['done']?.y1 ?? 0;
  const wipCards = Math.max(1, measSnapshot?.raw?.inProgressTotal ?? 1);

  // Find future day where Done line crosses targetLevel (or approximate if simulation still running)
  const finishSnapshot = stackedData.find((s) => s.day >= measSnapshot.day && s.points?.['done']?.y1 >= targetLevel);
  
  let finishDay = finishSnapshot ? finishSnapshot.day : null;
  let estimatedLeadTime = 0;

  if (finishDay !== null) {
    estimatedLeadTime = Math.max(1, finishDay - measSnapshot.day);
  } else {
    // Extrapolate based on recent throughput
    const remainingToDone = Math.max(0, targetLevel - doneLevelAtMeas);
    const recentDoneRate = (measSnapshot.day > 0 && measSnapshot.raw.done > 0)
      ? measSnapshot.raw.done / measSnapshot.day
      : 0.5;
    const calcLead = recentDoneRate > 0 ? Math.round(remainingToDone / recentDoneRate) : 10;
    estimatedLeadTime = Math.max(1, Math.min(100, isFinite(calcLead) ? calcLead : 10));
    finishDay = Math.min(maxDay, measSnapshot.day + estimatedLeadTime);
  }

  const rawThroughput = wipCards / Math.max(1, estimatedLeadTime);
  const throughputRate = Number((isFinite(rawThroughput) ? rawThroughput : 0).toFixed(2));

  // Coordinates of the Little's Law Triangle
  const triX0 = getX(measSnapshot.day);
  const triYBottom = getY(doneLevelAtMeas);
  const triYTop = getY(targetLevel);
  const triX1 = getX(finishDay ?? (measSnapshot.day + estimatedLeadTime));
  const isValidTriangle = isFinite(triX0) && isFinite(triYBottom) && isFinite(triYTop) && isFinite(triX1);

  // High WiP vs Low WiP comparison data (Variante C)
  const highWipRound = history.length >= 2 ? history.reduce((max, r) => (r.wipLimit > max.wipLimit ? r : max), history[0]) : null;
  const lowWipRound = history.length >= 2 ? history.reduce((min, r) => (r.wipLimit < min.wipLimit ? r : min), history[0]) : null;
  const hasABComparison = highWipRound && lowWipRound && highWipRound.round !== lowWipRound.round;

  const activeSnapshot = hoverIndex !== null && stackedData[hoverIndex] ? stackedData[hoverIndex] : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
      {/* Top Header Controls: Title, Round Switcher & Little's Law Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
              Kumulatives Flussdiagramm (CFD)
            </h3>
            {/* Active View Badge */}
            <span
              className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                selectedRoundId === null
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-indigo-100 text-indigo-900'
              }`}
            >
              {selectedRoundId === null
                ? 'Live-Simulation'
                : `Runde ${selectedRoundId} (WiP ${activeRoundObj?.wipLimit})`}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Farben entsprechen 1:1 den Board-Spalten. Flächenbreite = Durchlaufzeit, Flächenhöhe = WiP.
          </p>
        </div>

        {/* Round Switcher and Toggle Switch */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Round Selectors */}
          {history.length > 0 && (
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs font-mono">
              <button
                onClick={() => setSelectedRoundId(null)}
                className={`px-2 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                  selectedRoundId === null
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Activity className="w-3 h-3 text-blue-600" />
                Live
              </button>
              {history.map((r) => (
                <button
                  key={r.round}
                  onClick={() => setSelectedRoundId(r.round)}
                  className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                    selectedRoundId === r.round
                      ? 'bg-white text-indigo-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  R{r.round} (WiP {r.wipLimit})
                </button>
              ))}
            </div>
          )}

          {/* Toggle Switch */}
          <button
            onClick={() => setShowLittlesLaw((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              showLittlesLaw
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Triangle className="w-3.5 h-3.5 fill-current" />
            <span>Little&apos;s Law {showLittlesLaw ? 'aktiv' : 'einblenden'}</span>
          </button>
        </div>
      </div>

      {/* Little's Law Measurement Bar (when Overlay is active) */}
      {showLittlesLaw && (
        <div className="p-2.5 bg-indigo-50/70 border border-indigo-200/90 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-indigo-950 flex items-center gap-1">
              <Triangle className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
              Messung an Tag {measSnapshot.day}:
            </span>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-900 font-bold">
                WiP (Δy): {wipCards} Karten
              </span>
              <span className="text-slate-400">·</span>
              <span className="bg-white px-2 py-0.5 rounded border border-indigo-200 text-cyan-900 font-bold">
                Lead Time (Δx): {estimatedLeadTime}d
              </span>
              <span className="text-slate-400">·</span>
              <span className="bg-white px-2 py-0.5 rounded border border-indigo-200 text-emerald-900 font-bold">
                Durchsatz (m): {throughputRate} K/d
              </span>
            </div>
          </div>

          {/* Interactive Day Slider to move the triangle */}
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-[11px] text-indigo-900 font-medium">Tag wählen:</span>
            <input
              type="range"
              min={1}
              max={Math.max(1, activeData[activeData.length - 1].day)}
              value={activeMeasDay}
              onChange={(e) => setSelectedDay(parseInt(e.target.value))}
              className="w-24 sm:w-36 accent-indigo-600 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* SVG Canvas */}
      <div className="relative overflow-x-auto select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[650px]"
          onMouseLeave={() => setHoverIndex(null)}
          onClick={(e) => {
            // Click to position measurement day
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const normalizedX = (clickX / rect.width) * width;
            if (normalizedX >= padding.left && normalizedX <= width - padding.right) {
              const day = Math.round(((normalizedX - padding.left) / chartWidth) * maxDay);
              setSelectedDay(Math.max(1, Math.min(activeData[activeData.length - 1].day, day)));
            }
          }}
        >
          {/* Defs for gradients */}
          <defs>
            <linearGradient id="triangleGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.15" />
            </linearGradient>
          </defs>

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
                  className="fill-slate-400 font-mono text-[9px]"
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
              opacity={layer.key === 'wartenC' ? 0.9 : 0.8}
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
                  y={height - padding.bottom + 16}
                  textAnchor="middle"
                  className="fill-slate-500 font-mono text-[9px]"
                >
                  Tag {dayStep}
                </text>
              </g>
            );
          })}

          {/* ----------------- LITTLE'S LAW OVERLAY (VARIANTE C) ----------------- */}
          {showLittlesLaw && isValidTriangle && (
            <g className="transition-all duration-300 pointer-events-none">
              {/* Shaded Triangle Polygon: (X0, YBottom) -> (X0, YTop) -> (X1, YTop) */}
              <polygon
                points={`${triX0},${triYBottom} ${triX0},${triYTop} ${triX1},${triYTop}`}
                fill="url(#triangleGrad)"
                stroke="#4F46E5"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />

              {/* Hypotenuse (Steigung = Durchsatz): from (X0, YBottom) to (X1, YTop) */}
              <line
                x1={triX0}
                y1={triYBottom}
                x2={triX1}
                y2={triYTop}
                stroke="#10B981"
                strokeWidth="2.5"
              />

              {/* Vertikale Kathete (WIP Δy) */}
              <line
                x1={triX0}
                y1={triYBottom}
                x2={triX0}
                y2={triYTop}
                stroke="#4338CA"
                strokeWidth="3"
              />

              {/* Horizontale Kathete (Lead Time Δx) */}
              <line
                x1={triX0}
                y1={triYTop}
                x2={triX1}
                y2={triYTop}
                stroke="#0284C7"
                strokeWidth="3"
              />

              {/* Badges on the triangle */}
              {/* Vertical WIP Badge */}
              <g transform={`translate(${triX0 - 8}, ${(triYBottom + triYTop) / 2})`}>
                <rect
                  x="-72"
                  y="-11"
                  width="70"
                  height="22"
                  rx="4"
                  fill="#1E1B4B"
                  stroke="#4338CA"
                />
                <text
                  x="-37"
                  y="4"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  className="font-mono text-[9px] font-bold"
                >
                  WiP: {wipCards}
                </text>
              </g>

              {/* Horizontal Lead Time Badge */}
              <g transform={`translate(${(triX0 + triX1) / 2}, ${triYTop - 12})`}>
                <rect
                  x="-45"
                  y="-10"
                  width="90"
                  height="20"
                  rx="4"
                  fill="#082F49"
                  stroke="#0284C7"
                />
                <text
                  x="0"
                  y="3"
                  textAnchor="middle"
                  fill="#38BDF8"
                  className="font-mono text-[9px] font-bold"
                >
                  Lead: {estimatedLeadTime}d
                </text>
              </g>

              {/* Hypotenuse / Slope Badge */}
              <g transform={`translate(${(triX0 + triX1) / 2 + 10}, ${(triYBottom + triYTop) / 2 + 10})`}>
                <rect
                  x="-55"
                  y="-10"
                  width="110"
                  height="20"
                  rx="4"
                  fill="#064E3B"
                  stroke="#10B981"
                />
                <text
                  x="0"
                  y="3"
                  textAnchor="middle"
                  fill="#6EE7B7"
                  className="font-mono text-[9px] font-bold"
                >
                  m = {throughputRate} K/d
                </text>
              </g>
            </g>
          )}

          {/* Invisible hover columns to trigger tooltip */}
          {stackedData.map((d, idx) => {
            const x = getX(d.day);
            const stepW = chartWidth / Math.max(activeData.length - 1, 1);
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

          {/* Active Hover Crosshair (when not hovering on little's law) */}
          {activeSnapshot && (
            <g className="pointer-events-none">
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
                r="3.5"
                fill="#334155"
              />
            </g>
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {activeSnapshot && (
          <div
            className="absolute top-2 right-4 bg-slate-900/90 text-white p-2.5 rounded-lg text-xs shadow-lg backdrop-blur-xs font-mono space-y-1 pointer-events-none border border-slate-700"
          >
            <div className="font-bold text-indigo-300 font-sans border-b border-slate-700 pb-1 flex justify-between">
              <span>Tag {activeSnapshot.day}</span>
              <span className="text-[10px] text-slate-400">Klick setzt Messpunkt</span>
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
              <span>In Progress (WiP):</span>
              <span className="font-bold text-indigo-300">{activeSnapshot.raw.inProgressTotal}</span>
            </div>
          </div>
        )}
      </div>

      {/* Variante C: A/B Little's Law Comparison Card & CLICKABLE ROUND SWITCHERS */}
      {showLittlesLaw && (
        <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              Little&apos;s Law Gesetzmäßigkeit im CFD:
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 hidden sm:inline">Klicke eine Kachel, um das CFD umzuschalten:</span>
              <span className="font-mono text-indigo-700 font-bold bg-white px-2 py-0.5 rounded border border-indigo-200">
                Durchsatz (m) = WiP (Δy) / Durchlaufzeit (Δx)
              </span>
            </div>
          </div>

          {/* Direct A/B Triangle Comparison with CLICKABLE CARDS */}
          {hasABComparison ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* High WiP Clickable Card */}
              <div
                onClick={() => setSelectedRoundId(highWipRound.round)}
                className={`p-2.5 rounded border transition-all cursor-pointer ${
                  selectedRoundId === highWipRound.round
                    ? 'bg-red-100 border-red-500 ring-2 ring-red-400 shadow-xs'
                    : 'bg-red-50/70 border-red-200 hover:bg-red-50 hover:border-red-300'
                }`}
              >
                <div className="flex justify-between items-center font-bold text-red-950 mb-1">
                  <span className="flex items-center gap-1.5">
                    Runde {highWipRound.round} (Hohes WiP: {highWipRound.wipLimit})
                    {selectedRoundId === highWipRound.round && (
                      <span className="text-[9px] bg-red-600 text-white font-bold px-1.5 py-0.2 rounded font-mono">
                        Im CFD aktiv
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-red-700">{highWipRound.throughput.toFixed(2)} K/d</span>
                </div>
                <div className="text-[11px] text-red-900 font-mono space-y-0.5">
                  <div>Großes Dreieck: WiP = {highWipRound.inProgressCount} Karten (hohe vertikale Säule)</div>
                  <div>Lange horizontale Durchlaufzeit = {highWipRound.redCycleTime.toFixed(1)} Tage</div>
                </div>
                <div className="mt-1 pt-1 border-t border-red-200/60 text-[10px] text-red-700 italic flex items-center gap-1">
                  <MousePointerClick className="w-2.5 h-2.5" />
                  Klicken, um CFD & Mess-Dreieck von Runde {highWipRound.round} anzuzeigen
                </div>
              </div>

              {/* Low WiP Clickable Card */}
              <div
                onClick={() => setSelectedRoundId(lowWipRound.round)}
                className={`p-2.5 rounded border transition-all cursor-pointer ${
                  selectedRoundId === lowWipRound.round
                    ? 'bg-emerald-100 border-emerald-500 ring-2 ring-emerald-400 shadow-xs'
                    : 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300'
                }`}
              >
                <div className="flex justify-between items-center font-bold text-emerald-950 mb-1">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Runde {lowWipRound.round} (Optimierter Fluss: WiP {lowWipRound.wipLimit})
                    {selectedRoundId === lowWipRound.round && (
                      <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded font-mono">
                        Im CFD aktiv
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-emerald-700">{lowWipRound.throughput.toFixed(2)} K/d</span>
                </div>
                <div className="text-[11px] text-emerald-900 font-mono space-y-0.5">
                  <div>Kompaktes Dreieck: WiP = {lowWipRound.inProgressCount} Karten (schlanke Säule)</div>
                  <div>Kurze Durchlaufzeit = {lowWipRound.redCycleTime.toFixed(1)} Tage bei nahezu gleicher Steigung!</div>
                </div>
                <div className="mt-1 pt-1 border-t border-emerald-200/60 text-[10px] text-emerald-700 italic flex items-center gap-1">
                  <MousePointerClick className="w-2.5 h-2.5" />
                  Klicken, um CFD & Mess-Dreieck von Runde {lowWipRound.round} anzuzeigen
                </div>
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-600 flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                <strong>Aha-Erlebnis im CFD:</strong> Die Steigung der grünen Done-Kurve (Durchsatz = Δy / Δx) wird durch die Kapazität des Engpasses bestimmt. Senkt man das WiP-Limit, verringert sich die vertikale Höhe Δy. Da die Steigung gleich bleibt, <em>muss</em> sich die horizontale Durchlaufzeit Δx proportional verkürzen!
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
