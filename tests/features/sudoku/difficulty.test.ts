import { describe, expect, it } from 'vitest';
import { classifySudokuDifficulty } from '../../../src/features/sudoku/difficulty';

describe('sudoku difficulty', () => {
  it('classifies expert when advanced techniques appear', () => {
    expect(classifySudokuDifficulty(['naked_single', 'x_wing'])).toBe('expert');
  });

  it('classifies hard for pairs', () => {
    expect(classifySudokuDifficulty(['hidden_single', 'naked_pair'])).toBe('hard');
  });
});
