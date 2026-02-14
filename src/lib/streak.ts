import type { GameType } from './validation';

export type StreakState = {
  perGame: Record<GameType, number>;
  bestPerGame: Record<GameType, number>;
  dailyCurrent: number;
  dailyBest: number;
  lastPlayedISO: string | null;
};

export const defaultStreakState = (): StreakState => ({
  perGame: { nonogram: 0, sudoku: 0 },
  bestPerGame: { nonogram: 0, sudoku: 0 },
  dailyCurrent: 0,
  dailyBest: 0,
  lastPlayedISO: null
});

export type StreakUpdate = {
  game: GameType;
  dateISO: string;
  mistakeLimitExceeded: boolean;
  abandoned: boolean;
};

function dayDiff(aISO: string, bISO: string): number {
  const a = new Date(`${aISO}T00:00:00.000Z`).getTime();
  const b = new Date(`${bISO}T00:00:00.000Z`).getTime();
  return Math.round((b - a) / 86400000);
}

export function updateStreak(state: StreakState, update: StreakUpdate): StreakState {
  const next = structuredClone(state);
  const failed = update.mistakeLimitExceeded || update.abandoned;

  if (failed) {
    next.perGame[update.game] = 0;
  } else {
    next.perGame[update.game] += 1;
    next.bestPerGame[update.game] = Math.max(next.bestPerGame[update.game], next.perGame[update.game]);
  }

  if (!next.lastPlayedISO) {
    next.dailyCurrent = failed ? 0 : 1;
  } else {
    const diff = dayDiff(next.lastPlayedISO, update.dateISO);
    if (diff === 1) {
      next.dailyCurrent = failed ? 0 : next.dailyCurrent + 1;
    } else if (diff > 1) {
      next.dailyCurrent = failed ? 0 : 1;
    }
  }

  next.dailyBest = Math.max(next.dailyBest, next.dailyCurrent);
  next.lastPlayedISO = update.dateISO;
  return next;
}
