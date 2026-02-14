import { describe, expect, it } from 'vitest';
import {
  generateNonogramByDifficulty,
  parseNonogramSizeTier,
  sizeForDifficulty
} from '../../../src/features/nonogram/generator';

describe('nonogram size tiers', () => {
  it('parses difficulty from query string', () => {
    expect(parseNonogramSizeTier('veryeasy')).toBe('easy');
    expect(parseNonogramSizeTier('very-easy')).toBe('easy');
    expect(parseNonogramSizeTier('easy')).toBe('easy');
    expect(parseNonogramSizeTier('hard')).toBe('hard');
    expect(parseNonogramSizeTier('expert')).toBe('hard');
    expect(parseNonogramSizeTier('unknown')).toBe('medium');
    expect(parseNonogramSizeTier(null)).toBe('medium');
  });

  it('maps tier to board sizes', () => {
    expect(sizeForDifficulty('easy', 42)).toBe(5);
    expect(sizeForDifficulty('medium', 42)).toBe(10);
    expect(sizeForDifficulty('hard', 42)).toBe(15);
  });

  it('generates puzzle using tier size', () => {
    const puzzle = generateNonogramByDifficulty(3, 'medium');
    expect(puzzle.size).toBe(10);
    expect(puzzle.rowClues).toHaveLength(10);
    expect(puzzle.colClues).toHaveLength(10);
  });
});
