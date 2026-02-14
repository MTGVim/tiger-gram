import { describe, expect, it } from 'vitest';
import { classifyNonogramDifficulty } from '../../../src/features/nonogram/difficulty';

describe('nonogram difficulty', () => {
  it('classifies expert for recursion', () => {
    expect(
      classifyNonogramDifficulty({
        steps: 10,
        maxLogicDepth: 6,
        forcedMoves: 3,
        usedRecursion: true,
        contradictionChecks: 4
      })
    ).toBe('expert');
  });

  it('classifies easy baseline', () => {
    expect(
      classifyNonogramDifficulty({
        steps: 2,
        maxLogicDepth: 1,
        forcedMoves: 2,
        usedRecursion: false,
        contradictionChecks: 0
      })
    ).toBe('easy');
  });
});
