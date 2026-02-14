import { describe, expect, it } from 'vitest';
import { generateSudoku } from '../../../src/features/sudoku/generator';
import {
  applyBoxLineReduction,
  applyHiddenPair,
  applyHiddenSingle,
  applyNakedPair,
  applyNakedSingle,
  applySwordfish,
  applyXWing,
  solveSudoku
} from '../../../src/features/sudoku/solver';

function fullSet(): Set<number> {
  return new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
}

function blankCandidates(): Array<Set<number>> {
  return Array.from({ length: 81 }, () => fullSet());
}

describe('sudoku solver techniques', () => {
  it('applies naked single', () => {
    const grid = [
      1, 2, 3, 4, 5, 6, 7, 8, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0
    ];
    expect(applyNakedSingle(grid)).toBe(true);
    expect(grid[8]).toBe(9);
  });

  it('applies hidden single', () => {
    const grid = [
      0, 2, 3, 4, 5, 6, 7, 8, 9,
      4, 5, 6, 7, 8, 9, 1, 2, 3,
      7, 8, 9, 1, 2, 3, 4, 5, 6,
      2, 3, 4, 5, 6, 7, 8, 9, 1,
      5, 6, 7, 8, 9, 1, 2, 3, 4,
      8, 9, 1, 2, 3, 4, 5, 6, 7,
      3, 4, 5, 6, 7, 8, 9, 1, 2,
      6, 7, 8, 9, 1, 2, 3, 4, 5,
      9, 1, 2, 3, 4, 5, 6, 7, 8
    ];
    expect(applyHiddenSingle(grid)).toBe(true);
    expect(grid[0]).toBe(1);
  });

  it('applies naked pair elimination', () => {
    const c = blankCandidates();
    c[0] = new Set([1, 2]);
    c[1] = new Set([1, 2]);
    c[2] = new Set([1, 2, 3]);
    expect(applyNakedPair(c)).toBe(true);
    expect(c[2].has(1)).toBe(false);
    expect(c[2].has(2)).toBe(false);
  });

  it('applies hidden pair elimination', () => {
    const c = blankCandidates();
    c[0] = new Set([4, 5, 6]);
    c[1] = new Set([4, 5, 7]);
    for (let i = 2; i < 9; i += 1) c[i] = new Set([1, 2, 3, 6, 7, 8, 9]);

    expect(applyHiddenPair(c)).toBe(true);
    expect(c[0]).toEqual(new Set([4, 5]));
    expect(c[1]).toEqual(new Set([4, 5]));
  });

  it('applies box-line reduction', () => {
    const c = blankCandidates();
    for (let i = 0; i < 81; i += 1) c[i] = new Set([1, 2, 3]);
    c[0] = new Set([7]);
    c[1] = new Set([7]);
    c[3] = new Set([7, 1]);
    expect(applyBoxLineReduction(c)).toBe(true);
    expect(c[3].has(7)).toBe(false);
  });

  it('applies x-wing elimination', () => {
    const c = blankCandidates();
    for (let i = 0; i < 81; i += 1) c[i] = new Set([1, 2]);
    c[1] = new Set([8]);
    c[4] = new Set([8]);
    c[19] = new Set([8]);
    c[22] = new Set([8]);
    c[46] = new Set([8, 2]);

    expect(applyXWing(c)).toBe(true);
    expect(c[46].has(8)).toBe(false);
  });

  it('applies swordfish elimination', () => {
    const c = blankCandidates();
    for (let i = 0; i < 81; i += 1) c[i] = new Set([1, 2]);
    c[0] = new Set([9]);
    c[1] = new Set([9]);
    c[28] = new Set([9]);
    c[29] = new Set([9]);
    c[54] = new Set([9]);
    c[56] = new Set([9]);
    c[72] = new Set([9, 1]);

    expect(applySwordfish(c)).toBe(true);
    expect(c[72].has(9)).toBe(false);
  });

  it('runs solver on generated puzzle without altering givens', () => {
    const { puzzle } = generateSudoku(1);
    const solved = solveSudoku(puzzle);
    expect(solved.grid).toHaveLength(81);
    expect(puzzle.filter((v) => v === 0).length).toBeGreaterThan(0);
    expect(solved.techniques.length).toBeGreaterThan(0);

    for (let i = 0; i < 81; i += 1) {
      if (puzzle[i] !== 0) {
        expect(solved.grid[i]).toBe(puzzle[i]);
      }
    }
  });
});
