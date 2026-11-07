import React, { useState } from 'react';
import { useKanbanEngine } from './simulation/useKanbanEngine';
import { Header } from './components/Header';
import { ControlToolbar } from './components/ControlToolbar';
import { KanbanBoard } from './components/KanbanBoard';
import { MetricsTable } from './components/MetricsTable';
import { CumulativeFlowDiagram } from './components/CumulativeFlowDiagram';
import { CostOfDelayChart } from './components/CostOfDelayChart';
import { FlowInsights } from './components/FlowInsights';
import { Table, LineChart, BarChart2, Lightbulb } from 'lucide-react';

export default function App() {
  const engine = useKanbanEngine();
  const [activeTab, setActiveTab] = useState<'table' | 'cfd' | 'delay' | 'insights'>('table');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* 1. Header with brand & presets */}
      <Header
        roundCounter={engine.roundCounter}
        dayCount={engine.dayCount}
        selectedPresetId={engine.selectedPresetId}
        onSelectPreset={engine.applyPreset}
        onReset={engine.resetBoard}
        onStartRound={engine.startNewRound}
        isRunning={engine.isRunning}
      />

      {/* 2. Interactive Simulation Controls */}
      <ControlToolbar
        isRunning={engine.isRunning}
        onTogglePlayPause={engine.togglePlayPause}
        onStepSimulation={engine.stepSimulation}
        onReset={engine.resetBoard}
        wipLimit={engine.wipLimit}
        onWipChange={engine.setWipLimit}
        tickSpeedMs={engine.tickSpeedMs}
        onSpeedChange={engine.setTickSpeedMs}
        complexities={engine.complexities}
        onComplexityChange={(col, val) =>
          engine.setComplexities((prev) => ({ ...prev, [col]: val }))
        }
        redCardGenerated={engine.redCardGenerated}
        redCardDueInSeconds={engine.redCardDueInSeconds}
        onTriggerRedCard={engine.generateRedCard}
        stochasticEnabled={engine.stochasticEnabled}
        onToggleStochastic={() => engine.setStochasticEnabled((prev) => !prev)}
      />

      {/* 3. Main Stage: The Animated 8-Column Kanban Board */}
      <main className="flex-1">
        <KanbanBoard
          cards={engine.cards}
          wipLimit={engine.wipLimit}
          columnMaxCounts={engine.columnMaxCounts}
          complexities={engine.complexities}
          isCfdTab={activeTab === 'cfd'}
        />

        {/* 4. Analytics & Knowledge Cockpit */}
        <section className="max-w-7xl mx-auto px-3 sm:px-6 py-2 space-y-1.5">
          {/* Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setActiveTab('table')}
                className={`py-1.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'table'
                    ? 'border-indigo-600 text-indigo-700 bg-white/60'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Runden-Tabelle</span>
                {engine.roundHistory.length > 0 && (
                  <span className="text-[10px] bg-slate-200 px-1.5 py-0.2 rounded-full font-mono font-bold">
                    {engine.roundHistory.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('cfd')}
                className={`py-1.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'cfd'
                    ? 'border-indigo-600 text-indigo-700 bg-white/60'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <LineChart className="w-3.5 h-3.5" />
                <span>Kumulatives Flussdiagramm (CFD)</span>
              </button>

              <button
                onClick={() => setActiveTab('delay')}
                className={`py-1.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'delay'
                    ? 'border-indigo-600 text-indigo-700 bg-white/60'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Cost of Delay</span>
              </button>

              <button
                onClick={() => setActiveTab('insights')}
                className={`py-1.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'insights'
                    ? 'border-indigo-600 text-indigo-700 bg-white/60'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Flusseffizienz & A/B</span>
              </button>
            </div>
          </div>

          {/* Active Tab View */}
          <div className="pt-1">
            {activeTab === 'table' && (
              <MetricsTable history={engine.roundHistory} onClear={engine.clearHistory} />
            )}

            {activeTab === 'cfd' && <CumulativeFlowDiagram data={engine.cfdHistory} />}

            {activeTab === 'delay' && <CostOfDelayChart history={engine.roundHistory} />}

            {activeTab === 'insights' && (
              <FlowInsights
                lastResult={engine.lastRoundResult}
                history={engine.roundHistory}
                wipLimit={engine.wipLimit}
              />
            )}
          </div>
        </section>
      </main>

      {/* 5. Minimalist educational footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            Kanban-Simulation basierend auf dem Modell der it-agile GmbH (2025) · Modernisiert für das Web
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Little&apos;s Law: WIP = Durchsatz × Durchlaufzeit
          </div>
        </div>
      </footer>
    </div>
  );
}
