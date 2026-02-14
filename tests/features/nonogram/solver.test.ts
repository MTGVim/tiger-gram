import { describe, expect, it } from 'vitest';
import {
  blockPush,
  boundaryFill,
  contradictionPropagation,
  recursiveAssumptionLimited,
  singleLineOverlap,
  solveNonogram
} from '../../../src/features/nonogram/solver';

describe('nonogram solver rules', () => {
  it('applies single-line overlap', () => {
    expect(singleLineOverlap(5, [5])).toEqual([1, 1, 1, 1, 1]);
  });

  it('applies boundary fill', () => {
    expect(boundaryFill([1, -1, -1, -1, -1], [3])).toEqual([1, 1, 1, 0, -1]);
  });

  it('applies block push around complete run', () => {
    expect(blockPush([-1, 1, 1, -1], [2])).toEqual([0, 1, 1, 0]);
  });

  it('detects contradictions from overfilled lines', () => {
    const board = [
      [1, 1],
      [-1, -1]
    ] as const;
    expect(
      contradictionPropagation(
        board.map((row) => [...row]),
        [[1], [0]],
        [[1], [0]]
      )
    ).toBe(true);
  });

  it('uses bounded recursion for forced assumption', () => {
    const board: Array<Array<-1 | 0 | 1>> = [
      [-1, -1],
      [0, 1]
    ];
    const metrics = {
      steps: 0,
      maxLogicDepth: 1,
      forcedMoves: 0,
      usedRecursion: false,
      contradictionChecks: 0
    };
    const result = recursiveAssumptionLimited(
      board,
      [[1], [1]],
      [[0], [2]],
      metrics
    );

    expect(result.deduced).toBe(true);
    expect(metrics.usedRecursion).toBe(true);
  });

  it('runs deterministic solve loop', () => {
    const board: Array<Array<-1 | 0 | 1>> = [
      [-1, -1, -1],
      [-1, -1, -1],
      [-1, -1, -1]
    ];
    const solved = solveNonogram(board, [[3], [0], [0]], [[1], [1], [1]]);
    expect(solved.metrics.steps).toBeGreaterThan(0);
  });
});
