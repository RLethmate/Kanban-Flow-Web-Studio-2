export interface KanbanCard {
  id: number;
  birthId: number;
  col: number;
  targetCol: number | null;
  isRed: boolean;
  daysOnBoard: number;
  startDay: number;
  finishDay: number | null;
  cycleTime: number | null;
  processingTime: number;
  /** Active work time (Bearbeitungszeit) in working columns */
  BZ: number;
  /** Waiting time (Wartezeit) in queue columns */
  WZ: number;
  color?: string;
}

export type ColumnType = 'backlog' | 'working' | 'waiting' | 'done';

export interface ColumnDefinition {
  id: number;
  name: string;
  type: ColumnType;
  /** Working columns pair with their downstream queue to form a WIP group */
  wipGroupLeader?: boolean;
  pairedColumnId?: number;
  defaultComplexity?: number;
  bgTint: string;
}

export interface SimulationPreset {
  id: string;
  title: string;
  description: string;
  wipLimit: number;
  complexities: Record<number, number>;
  redCardDelaySec: number;
  badgeText: string;
}

export interface RoundResult {
  round: number;
  wipLimit: number;
  redCycleTime: number;
  flowEfficiency: number;
  inProgressCount: number;
  doneCount: number;
  throughput: number;
  totalDays: number;
  redBZ: number;
  redWZ: number;
  timestamp: string;
  presetName?: string;
  complexities: Record<number, number>;
}

export interface CfdSnapshot {
  day: number;
  backlog: number;
  schrittA: number;
  wartenA: number;
  schrittB: number;
  wartenB: number;
  schrittC: number;
  wartenC: number;
  done: number;
  inProgressTotal: number;
}
