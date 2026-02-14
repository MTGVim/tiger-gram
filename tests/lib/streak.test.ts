import { describe, expect, it } from 'vitest';
import { defaultStreakState, updateStreak } from '../../src/lib/streak';

describe('streak', () => {
  it('increments game and daily streak on success', () => {
    const state = defaultStreakState();
    const next = updateStreak(state, {
      game: 'nonogram',
      dateISO: '2026-02-14',
      mistakeLimitExceeded: false,
      abandoned: false
    });

    expect(next.perGame.nonogram).toBe(1);
    expect(next.dailyCurrent).toBe(1);
  });

  it('resets on failure', () => {
    const state = {
      ...defaultStreakState(),
      perGame: { nonogram: 3, sudoku: 2 },
      dailyCurrent: 3,
      lastPlayedISO: '2026-02-13'
    };

    const next = updateStreak(state, {
      game: 'nonogram',
      dateISO: '2026-02-14',
      mistakeLimitExceeded: true,
      abandoned: false
    });

    expect(next.perGame.nonogram).toBe(0);
    expect(next.dailyCurrent).toBe(0);
  });
});
