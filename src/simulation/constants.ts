import { ColumnDefinition, SimulationPreset } from '../types/kanban';

export const INITIAL_COLUMNS: ColumnDefinition[] = [
  { id: 0, name: 'Backlog', type: 'backlog', bgTint: 'bg-slate-100/75' },
  { id: 1, name: 'Schritt A', type: 'working', defaultComplexity: 1, wipGroupLeader: true, pairedColumnId: 2, bgTint: 'bg-white' },
  { id: 2, name: 'Warten...', type: 'waiting', pairedColumnId: 1, bgTint: 'bg-slate-50' },
  { id: 3, name: 'Schritt B', type: 'working', defaultComplexity: 2, wipGroupLeader: true, pairedColumnId: 4, bgTint: 'bg-white' },
  { id: 4, name: 'Warten...', type: 'waiting', pairedColumnId: 3, bgTint: 'bg-slate-50' },
  { id: 5, name: 'Schritt C', type: 'working', defaultComplexity: 5, wipGroupLeader: true, pairedColumnId: 6, bgTint: 'bg-white' },
  { id: 6, name: 'Warten...', type: 'waiting', pairedColumnId: 5, bgTint: 'bg-slate-50' },
  { id: 7, name: 'Done', type: 'done', bgTint: 'bg-emerald-50/40' },
];

export const WORKING_COLUMNS = [1, 3, 5];
export const WAITING_COLUMNS = [2, 4, 6];

export const PRESETS: SimulationPreset[] = [
  {
    id: 'original',
    title: 'Original Python Setup',
    description: 'WiP-Limit 10, gestaffelte Komplexität (1, 2, 5). Klassischer Engpass in Schritt C.',
    wipLimit: 10,
    complexities: { 1: 1, 3: 2, 5: 5 },
    redCardDelaySec: 10,
    badgeText: 'Standard (WiP 10)',
  },
  {
    id: 'high-wip',
    title: 'Hohes WiP (Stau & Überlastung)',
    description: 'WiP-Limit 24. Zeigt drastischen Anstieg der Wartezeiten und Einbruch der Flusseffizienz.',
    wipLimit: 24,
    complexities: { 1: 1, 3: 2, 5: 5 },
    redCardDelaySec: 8,
    badgeText: 'Engpass-Stau (WiP 24)',
  },
  {
    id: 'flow-optimized',
    title: 'Optimierter Fluss (Low WiP)',
    description: 'WiP-Limit 3. Little\'s Law in Aktion: Drastisch verkürzte Durchlaufzeit und minimale Wartezeit.',
    wipLimit: 3,
    complexities: { 1: 1, 3: 2, 5: 5 },
    redCardDelaySec: 6,
    badgeText: 'Flow-Fokus (WiP 3)',
  },
  {
    id: 'balanced',
    title: 'Balancierte Taktung',
    description: 'Gleiche Kapazität in allen Schritten (A: 2, B: 2, C: 2, WiP 6). Glatter Arbeitsfluss.',
    wipLimit: 6,
    complexities: { 1: 2, 3: 2, 5: 2 },
    redCardDelaySec: 8,
    badgeText: 'Balanciert (WiP 6)',
  },
];
