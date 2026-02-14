import { describe, expect, it } from 'vitest';
import {
  generateSudokuByDifficulty,
  hasUniqueSudokuSolution,
  parseSudokuTier,
  type SudokuTier
} from '../../../src/features/sudoku/generator';

const TIERS: SudokuTier[] = ['easy', 'medium', 'hard', 'expert'];

describe('sudoku generator by difficulty', () => {
  it('parses query tier safely', () => {
    expect(parseSudokuTier('easy')).toBe('easy');
    expect(parseSudokuTier('hard')).toBe('hard');
    expect(parseSudokuTier('expert')).toBe('expert');
    expect(parseSudokuTier('unknown')).toBe('medium');
    expect(parseSudokuTier(null)).toBe('medium');
  });

  it('generates unique-solution puzzle for each tier', () => {
    for (const tier of TIERS) {
      const { puzzle, solution } = generateSudokuByDifficulty(11, tier);
      expect(puzzle).toHaveLength(81);
      expect(solution).toHaveLength(81);
      expect(puzzle.some((v) => v === 0)).toBe(true);
      expect(hasUniqueSudokuSolution(puzzle)).toBe(true);
    }
  });

  it('changes givens count by tier', () => {
    const easy = generateSudokuByDifficulty(20, 'easy').puzzle.filter((v) => v !== 0).length;
    const medium = generateSudokuByDifficulty(20, 'medium').puzzle.filter((v) => v !== 0).length;
    const hard = generateSudokuByDifficulty(20, 'hard').puzzle.filter((v) => v !== 0).length;
    const expert = generateSudokuByDifficulty(20, 'expert').puzzle.filter((v) => v !== 0).length;

    expect(easy).toBeGreaterThanOrEqual(medium);
    expect(medium).toBeGreaterThanOrEqual(hard);
    expect(hard).toBeGreaterThanOrEqual(expert);
  });
});
