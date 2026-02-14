import { describe, expect, it } from 'vitest';
import { mergeLeaderboardEntry } from '../../src/lib/leaderboard';

describe('leaderboard', () => {
  it('merges by player and game', () => {
    const updated = mergeLeaderboardEntry(
      [
        {
          id: 'p1',
          game: 'sudoku',
          fastestTimeSeconds: 90,
          highestStreak: 5,
          highestRating: 1200,
          updatedAtISO: '2026-02-13'
        }
      ],
      {
        id: 'p1',
        game: 'sudoku',
        fastestTimeSeconds: 85,
        highestStreak: 6,
        highestRating: 1250,
        updatedAtISO: '2026-02-14'
      }
    );

    expect(updated).toHaveLength(1);
    expect(updated[0].fastestTimeSeconds).toBe(85);
    expect(updated[0].highestStreak).toBe(6);
    expect(updated[0].highestRating).toBe(1250);
  });
});
