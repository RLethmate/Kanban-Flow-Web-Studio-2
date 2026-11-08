import { useState, useEffect, useRef, useCallback } from 'react';
import { KanbanCard, RoundResult, CfdSnapshot } from '../types/kanban';
import { PRESETS } from './constants';

export function useKanbanEngine() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('original');
  const [wipLimit, setWipLimitState] = useState<number>(10);
  const [complexities, setComplexitiesState] = useState<Record<number, number>>({ 1: 1, 3: 2, 5: 5 });
  const [stochasticEnabled, setStochasticEnabled] = useState<boolean>(false);
  
  // Simulation playback state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [tickSpeedMs, setTickSpeedMsState] = useState<number>(350); // Speed in ms per simulated day
  const [dayCount, setDayCount] = useState<number>(0);
  const dayCountRef = useRef<number>(0);
  const [roundCounter, setRoundCounter] = useState<number>(0);
  const roundCounterRef = useRef<number>(0);
  const roundFinishedRef = useRef<boolean>(false);
  
  // Cards and queue state
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const cardsRef = useRef<KanbanCard[]>([]);
  const nextCardIdRef = useRef<number>(12);
  const [columnMaxCounts, setColumnMaxCounts] = useState<number[]>([12, 0, 0, 0, 0, 0, 0, 0]);
  const columnMaxCountsRef = useRef<number[]>([12, 0, 0, 0, 0, 0, 0, 0]);
  
  // Red Card & Timing (tracked in accumulated active running ms so pause doesn't jump countdown)
  const [redCardGenerated, setRedCardGenerated] = useState<boolean>(false);
  const [redCardDueInSeconds, setRedCardDueInSeconds] = useState<number | null>(10);
  const accumulatedRunTimeMsRef = useRef<number>(0);
  const lastActiveTimestampRef = useRef<number | null>(null);
  
  // Metrics & History
  const [roundHistory, setRoundHistory] = useState<RoundResult[]>([]);
  const [cfdHistory, setCfdHistory] = useState<CfdSnapshot[]>([]);
  const cfdHistoryRef = useRef<CfdSnapshot[]>([]);
  const [lastRoundResult, setLastRoundResult] = useState<RoundResult | null>(null);

  // Safe Setters with Boundary Clamping
  const setWipLimit = useCallback((val: number) => {
    const clamped = Math.max(1, Math.min(50, isNaN(val) ? 10 : val));
    setWipLimitState(clamped);
  }, []);

  const setTickSpeedMs = useCallback((ms: number) => {
    const clamped = Math.max(40, Math.min(2000, isNaN(ms) ? 350 : ms));
    setTickSpeedMsState(clamped);
  }, []);

  const setComplexities = useCallback((updater: Record<number, number> | ((prev: Record<number, number>) => Record<number, number>)) => {
    setComplexitiesState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const sanitized: Record<number, number> = {};
      for (const key of Object.keys(next)) {
        const k = Number(key);
        sanitized[k] = Math.max(1, Math.min(30, next[k] || 1));
      }
      return sanitized;
    });
  }, []);

  // Central Initializer for Reset and New Round
  const initBoard = useCallback((startImmediately: boolean, newWip?: number, newComp?: Record<number, number>) => {
    // Generate initial 12 cards in Backlog (col 0)
    const initialCards: KanbanCard[] = [];
    for (let i = 0; i < 12; i++) {
      initialCards.push({
        id: i,
        birthId: i,
        col: 0,
        targetCol: null,
        isRed: false,
        daysOnBoard: 0,
        startDay: 0,
        finishDay: null,
        cycleTime: null,
        processingTime: 0,
        BZ: 0,
        WZ: 0,
        color: '#64748B',
      });
    }

    nextCardIdRef.current = 12;
    dayCountRef.current = 0;
    roundFinishedRef.current = false;
    accumulatedRunTimeMsRef.current = 0;
    lastActiveTimestampRef.current = startImmediately ? Date.now() : null;

    cardsRef.current = initialCards;
    setCards(initialCards);

    setDayCount(0);
    setRedCardGenerated(false);
    setRedCardDueInSeconds(10);

    const initialMax = [12, 0, 0, 0, 0, 0, 0, 0];
    columnMaxCountsRef.current = initialMax;
    setColumnMaxCounts(initialMax);

    const initialCfd: CfdSnapshot[] = [
      {
        day: 0,
        backlog: 12,
        schrittA: 0,
        wartenA: 0,
        schrittB: 0,
        wartenB: 0,
        schrittC: 0,
        wartenC: 0,
        done: 0,
        inProgressTotal: 0,
      },
    ];
    cfdHistoryRef.current = initialCfd;
    setCfdHistory(initialCfd);
    setIsRunning(startImmediately);

    if (newWip !== undefined) setWipLimit(newWip);
    if (newComp !== undefined) setComplexities(newComp);
  }, [setWipLimit, setComplexities]);

  // Public reset method
  const resetBoard = useCallback((newWip?: number, newComplexities?: Record<number, number>) => {
    initBoard(false, newWip, newComplexities);
  }, [initBoard]);

  // Initial load
  useEffect(() => {
    initBoard(false);
  }, [initBoard]);

  // Apply a preset
  const applyPreset = useCallback((presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedPresetId(preset.id);
    initBoard(false, preset.wipLimit, preset.complexities);
  }, [initBoard]);

  // Manual generation of red card
  const generateRedCard = useCallback(() => {
    const currentCards = cardsRef.current;
    const alreadyHasRed = currentCards.some((c) => c.isRed);
    if (alreadyHasRed) return;

    // Find earliest card in Backlog
    const backlogCards = currentCards
      .filter((c) => c.col === 0)
      .sort((a, b) => a.birthId - b.birthId);

    if (backlogCards.length > 0) {
      const targetCard = backlogCards[0];
      setRedCardGenerated(true);
      setRedCardDueInSeconds(null);
      const updated = currentCards.map((c) =>
        c.birthId === targetCard.birthId
          ? { ...c, isRed: true, color: '#DC2626', processingTime: 0 }
          : c
      );
      cardsRef.current = updated;
      setCards(updated);
    }
  }, []);

  // Check helper: Is WIP group full?
  // Group 1: [1, 2], Group 2: [3, 4], Group 3: [5, 6]
  const isGroupFull = useCallback((currentCards: KanbanCard[], groupCols: number[], limit: number) => {
    const count = currentCards.filter((c) => groupCols.includes(c.col)).length;
    return count >= limit;
  }, []);

  // Core Simulation Step (Single Day / Decision Tick)
  // Performed as a top-level synchronous update batch — NO nested setState calls inside setState updaters!
  const stepSimulation = useCallback(() => {
    let updatedCards = [...cardsRef.current];

    // 1. Backlog refill: maintain at least 12 backlog cards
    let backlogCards = updatedCards.filter((c) => c.col === 0);
    while (backlogCards.length < 12) {
      const newBirthId = nextCardIdRef.current++;
      const newCard: KanbanCard = {
        id: newBirthId,
        birthId: newBirthId,
        col: 0,
        targetCol: null,
        isRed: false,
        daysOnBoard: 0,
        startDay: 0,
        finishDay: null,
        cycleTime: null,
        processingTime: 0,
        BZ: 0,
        WZ: 0,
        color: '#64748B',
      };
      updatedCards.push(newCard);
      backlogCards = updatedCards.filter((c) => c.col === 0);
    }

    const nextDay = dayCountRef.current + 1;
    dayCountRef.current = nextDay;

    // 2. Flow Efficiency and Days on Board accounting for all cards in progress
    updatedCards = updatedCards.map((card) => {
      let newBZ = card.BZ;
      let newWZ = card.WZ;

      if ([1, 3, 5].includes(card.col)) {
        newBZ += 1;
      } else if ([2, 4, 6].includes(card.col)) {
        const mapping: Record<number, number> = { 2: 1, 4: 3, 6: 5 };
        const activeCol = mapping[card.col];
        const activePresent = updatedCards.some((c) => c.col === activeCol);
        if (activePresent) {
          newWZ += 1;
        }
      }
      return {
        ...card,
        BZ: newBZ,
        WZ: newWZ,
        daysOnBoard: card.col >= 1 && card.col <= 6 ? card.daysOnBoard + 1 : card.daysOnBoard,
      };
    });

    // 3. Process Working Columns [1, 3, 5]
    const workingColumns = [1, 3, 5];
    for (const col of workingColumns) {
      const activeCards = updatedCards.filter((c) => c.col === col);
      
      if (activeCards.length > 0) {
        // Card is currently being processed
        activeCards.sort((a, b) => a.birthId - b.birthId);
        const activeCard = activeCards[0];
        
        let requiredComplexity = complexities[col] ?? 1;
        if (stochasticEnabled) {
          const variance = Math.random() > 0.6 ? 1 : Math.random() < 0.2 ? -1 : 0;
          requiredComplexity = Math.max(1, requiredComplexity + variance);
        }

        if (activeCard.processingTime < requiredComplexity) {
          // Still working on this card
          updatedCards = updatedCards.map((c) =>
            c.birthId === activeCard.birthId
              ? { ...c, processingTime: c.processingTime + 1 }
              : c
          );
        } else {
          // Card finished active work -> move to queue (col + 1)
          updatedCards = updatedCards.map((c) =>
            c.birthId === activeCard.birthId
              ? { ...c, col: col + 1, processingTime: 0 }
              : c
          );
        }
      } else {
        // Working column is empty -> try to pull from preceding queue or backlog (col - 1)
        const groupCols = col === 1 ? [1, 2] : col === 3 ? [3, 4] : [5, 6];
        const groupFull = isGroupFull(updatedCards, groupCols, wipLimit);

        if (!groupFull) {
          const prevCol = col - 1;
          const prevCards = updatedCards
            .filter((c) => c.col === prevCol)
            .sort((a, b) => a.birthId - b.birthId);

          if (prevCards.length > 0) {
            const pulledCard = prevCards[0];
            updatedCards = updatedCards.map((c) => {
              if (c.birthId !== pulledCard.birthId) return c;
              const newStartDay = (col === 1 && c.startDay === 0) ? nextDay : c.startDay;
              return {
                ...c,
                col: col,
                startDay: newStartDay,
                processingTime: 1, // First unit of work performed today
              };
            });
          }
        }
      }
    }

    // 4. Move cards from Warten nach C (col 6) into Done (col 7)
    const col6Cards = updatedCards
      .filter((c) => c.col === 6)
      .sort((a, b) => a.birthId - b.birthId);

    if (col6Cards.length > 0) {
      const doneCard = col6Cards[0];
      updatedCards = updatedCards.map((c) => {
        if (c.birthId !== doneCard.birthId) return c;
        const cycleTime = c.startDay > 0 ? Math.max(1, nextDay - c.startDay) : Math.max(1, c.daysOnBoard);
        return {
          ...c,
          col: 7,
          finishDay: nextDay,
          cycleTime: cycleTime,
          processingTime: 0,
        };
      });
    }

    // 5. Update maximum card counts observed in queues [2, 4, 6]
    const nextMax = [...columnMaxCountsRef.current];
    for (let i = 0; i < 8; i++) {
      const count = updatedCards.filter((c) => c.col === i).length;
      if (count > nextMax[i]) nextMax[i] = count;
    }
    columnMaxCountsRef.current = nextMax;

    // 6. Update CFD Snapshot synchronously
    const colCounts = (colIdx: number) => updatedCards.filter((c) => c.col === colIdx).length;
    const inProgressTotal = updatedCards.filter((c) => c.col >= 1 && c.col <= 6).length;
    const snapshot: CfdSnapshot = {
      day: nextDay,
      backlog: colCounts(0),
      schrittA: colCounts(1),
      wartenA: colCounts(2),
      schrittB: colCounts(3),
      wartenB: colCounts(4),
      schrittC: colCounts(5),
      wartenC: colCounts(6),
      done: colCounts(7),
      inProgressTotal,
    };
    const nextCfd = [...cfdHistoryRef.current, snapshot];
    cfdHistoryRef.current = nextCfd;

    // 7. Check if Red Card has reached Done (Spalte 7)
    const redCard = updatedCards.find((c) => c.isRed && c.col === 7);
    let roundResultToRecord: RoundResult | null = null;

    if (redCard && !roundFinishedRef.current) {
      roundFinishedRef.current = true;
      setIsRunning(false);

      const redCycle = Math.max(1, redCard.cycleTime ?? (nextDay - redCard.startDay));
      const doneCount = updatedCards.filter((c) => c.col === 7).length;
      const throughput = redCycle > 0 ? Number((doneCount / redCycle).toFixed(2)) : 0;
      const totalEffTime = redCard.BZ + redCard.WZ;
      const flowEff = totalEffTime > 0 ? Number(((redCard.BZ / totalEffTime) * 100).toFixed(2)) : 0;

      const newRound = roundCounterRef.current + 1;
      roundCounterRef.current = newRound;

      roundResultToRecord = {
        round: newRound,
        wipLimit,
        redCycleTime: redCycle,
        flowEfficiency: flowEff,
        inProgressCount: inProgressTotal,
        doneCount,
        throughput,
        totalDays: nextDay,
        redBZ: redCard.BZ,
        redWZ: redCard.WZ,
        timestamp: new Date().toLocaleTimeString(),
        complexities: { ...complexities },
        cfdData: nextCfd,
      };
    }

    // Synchronous Top-Level State Dispatch
    cardsRef.current = updatedCards;
    setCards(updatedCards);
    setDayCount(nextDay);
    setColumnMaxCounts(nextMax);
    setCfdHistory(nextCfd);

    if (roundResultToRecord) {
      const record = roundResultToRecord;
      setRoundCounter(record.round);
      setLastRoundResult(record);
      setRoundHistory((prev) => [record, ...prev]);
    }
  }, [complexities, stochasticEnabled, wipLimit, isGroupFull]);

  // Main simulation timer loop
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      stepSimulation();
    }, tickSpeedMs);
    return () => clearInterval(interval);
  }, [isRunning, tickSpeedMs, stepSimulation]);

  // Active run time tracker: accumulates time only when running so Pause freezes the countdown
  useEffect(() => {
    if (!isRunning || redCardGenerated) {
      lastActiveTimestampRef.current = null;
      return;
    }

    lastActiveTimestampRef.current = Date.now();
    const timer = setInterval(() => {
      if (lastActiveTimestampRef.current === null) return;
      const now = Date.now();
      const delta = now - lastActiveTimestampRef.current;
      lastActiveTimestampRef.current = now;
      accumulatedRunTimeMsRef.current += delta;

      const remainingSec = Math.max(0, 10 - accumulatedRunTimeMsRef.current / 1000);
      setRedCardDueInSeconds(Math.ceil(remainingSec));

      if (remainingSec <= 0) {
        generateRedCard();
        clearInterval(timer);
      }
    }, 400);

    return () => {
      clearInterval(timer);
      if (lastActiveTimestampRef.current !== null) {
        accumulatedRunTimeMsRef.current += Date.now() - lastActiveTimestampRef.current;
        lastActiveTimestampRef.current = null;
      }
    };
  }, [isRunning, redCardGenerated, generateRedCard]);

  // Actions
  const togglePlayPause = () => {
    setIsRunning((prev) => !prev);
  };

  const startNewRound = () => {
    initBoard(true);
  };

  const clearHistory = () => {
    setRoundHistory([]);
    setLastRoundResult(null);
  };

  return {
    cards,
    dayCount,
    roundCounter,
    isRunning,
    tickSpeedMs,
    wipLimit,
    complexities,
    stochasticEnabled,
    columnMaxCounts,
    redCardGenerated,
    redCardDueInSeconds,
    roundHistory,
    cfdHistory,
    lastRoundResult,
    selectedPresetId,
    // Setters & Actions
    setWipLimit,
    setComplexities,
    setStochasticEnabled,
    setTickSpeedMs,
    togglePlayPause,
    stepSimulation,
    resetBoard,
    startNewRound,
    clearHistory,
    generateRedCard,
    applyPreset,
  };
}
