import type { GameType } from './validation';

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
