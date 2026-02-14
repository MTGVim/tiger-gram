import type { GameType } from './validation';
import { loadLocal, saveLocal } from './persistence';

export type LeaderboardEntry = {
  id: string;
  game: GameType;
  fastestTimeSeconds: number;
  highestStreak: number;
  highestRating: number;
  updatedAtISO: string;
};

export function mergeLeaderboardEntry(entries: LeaderboardEntry[], next: LeaderboardEntry): LeaderboardEntry[] {
  const existing = entries.find((entry) => entry.id === next.id && entry.game === next.game);
  if (!existing) return [...entries, next];

  return entries.map((entry) => {
    if (entry.id !== next.id || entry.game !== next.game) return entry;
    return {
      ...entry,
      fastestTimeSeconds: Math.min(entry.fastestTimeSeconds, next.fastestTimeSeconds),
      highestStreak: Math.max(entry.highestStreak, next.highestStreak),
      highestRating: Math.max(entry.highestRating, next.highestRating),
      updatedAtISO: next.updatedAtISO
    };
  });
}

const PUZZLE_LEADERBOARD_KEY = 'leaderboard:v1';

export type PuzzleLeaderboardEntry = {
  id: string;
  game: GameType;
  difficulty: string;
  seconds: number;
  createdAt: number;
};

type LegacyPuzzleLeaderboardEntry = {
  id: string;
  game: GameType;
  difficulty: string;
  bestTimeSeconds: number;
  clearCount: number;
  updatedAtISO: string;
};

function sortPuzzleLeaderboard(entries: PuzzleLeaderboardEntry[]): PuzzleLeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    if (a.game !== b.game) return a.game.localeCompare(b.game);
    if (a.difficulty !== b.difficulty) return a.difficulty.localeCompare(b.difficulty);
    if (a.seconds !== b.seconds) return a.seconds - b.seconds;
    return b.createdAt - a.createdAt;
  });
}

function isPuzzleLeaderboardEntry(entry: unknown): entry is PuzzleLeaderboardEntry {
  if (!entry || typeof entry !== 'object') return false;
  const value = entry as Record<string, unknown>;
  return (
    typeof value.id === 'string' &&
    (value.game === 'nonogram' || value.game === 'sudoku') &&
    typeof value.difficulty === 'string' &&
    typeof value.seconds === 'number' &&
    typeof value.createdAt === 'number'
  );
}

function isLegacyPuzzleLeaderboardEntry(entry: unknown): entry is LegacyPuzzleLeaderboardEntry {
  if (!entry || typeof entry !== 'object') return false;
  const value = entry as Record<string, unknown>;
  return (
    typeof value.id === 'string' &&
    (value.game === 'nonogram' || value.game === 'sudoku') &&
    typeof value.difficulty === 'string' &&
    typeof value.bestTimeSeconds === 'number' &&
    typeof value.clearCount === 'number' &&
    typeof value.updatedAtISO === 'string'
  );
}

export function loadPuzzleLeaderboard(): PuzzleLeaderboardEntry[] {
  const fallback: PuzzleLeaderboardEntry[] = [];
  const loaded = loadLocal<unknown[]>(PUZZLE_LEADERBOARD_KEY, fallback);
  if (!Array.isArray(loaded)) return fallback;
  const migrated = loaded.flatMap((entry) => {
    if (isPuzzleLeaderboardEntry(entry)) return [entry];
    if (!isLegacyPuzzleLeaderboardEntry(entry)) return [];
    const parsed = Date.parse(entry.updatedAtISO);
    return [
      {
        id: `${entry.id}:migrated`,
        game: entry.game,
        difficulty: entry.difficulty,
        seconds: Math.max(1, Math.floor(entry.bestTimeSeconds)),
        createdAt: Number.isNaN(parsed) ? Date.now() : parsed
      }
    ];
  });
  return sortPuzzleLeaderboard(migrated);
}

export function savePuzzleLeaderboard(entries: PuzzleLeaderboardEntry[]): void {
  saveLocal(PUZZLE_LEADERBOARD_KEY, sortPuzzleLeaderboard(entries));
}

export function recordPuzzleClear(
  entries: PuzzleLeaderboardEntry[],
  input: { game: GameType; difficulty: string; seconds: number; now?: number }
): PuzzleLeaderboardEntry[] {
  const next = [
    ...entries,
    {
      id: `${input.game}:${input.difficulty}:${input.now ?? Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
      game: input.game,
      difficulty: input.difficulty,
      seconds: Math.max(1, Math.floor(input.seconds)),
      createdAt: input.now ?? Date.now()
    }
  ];
  return sortPuzzleLeaderboard(next).slice(0, 150);
}

export function clearPuzzleLeaderboard(entries: PuzzleLeaderboardEntry[], game: GameType): PuzzleLeaderboardEntry[] {
  return entries.filter((entry) => entry.game !== game);
}
