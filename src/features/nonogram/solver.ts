import type { Cell, Grid, SolverMetrics } from './types';

export function singleLineOverlap(length: number, clues: number[]): Cell[] {
  if (clues.length === 1 && clues[0] === 0) return Array.from({ length }, () => 0 as Cell);

  const result = Array.from({ length }, () => -1 as Cell);
  let leftCursor = 0;
  const leftStart: number[] = [];
  for (const clue of clues) {
    leftStart.push(leftCursor);
    leftCursor += clue + 1;
  }

  let rightCursor = length;
  const rightStart = Array.from({ length: clues.length }, () => 0);
  for (let i = clues.length - 1; i >= 0; i -= 1) {
    rightCursor -= clues[i];
    rightStart[i] = rightCursor;
    rightCursor -= 1;
  }

  clues.forEach((clue, i) => {
    const start = Math.max(leftStart[i], rightStart[i]);
    const end = Math.min(leftStart[i] + clue - 1, rightStart[i] + clue - 1);
    for (let idx = start; idx <= end; idx += 1) {
      result[idx] = 1;
    }
  });

  return result;
}

export function boundaryFill(line: Cell[], clues: number[]): Cell[] {
  const next = [...line];
  if (!clues.length || clues[0] === 0) return next;

  if (line[0] === 1) {
    for (let i = 0; i < clues[0]; i += 1) next[i] = 1;
    if (clues[0] < line.length) next[clues[0]] = 0;
  }

  const last = clues[clues.length - 1];
  if (line[line.length - 1] === 1) {
    for (let i = 0; i < last; i += 1) next[line.length - 1 - i] = 1;
    if (line.length - 1 - last >= 0) next[line.length - 1 - last] = 0;
  }

  return next;
}

export function blockPush(line: Cell[], clues: number[]): Cell[] {
  const next = [...line];
  let runStart = -1;

  for (let i = 0; i <= line.length; i += 1) {
    if (i < line.length && line[i] === 1) {
      if (runStart < 0) runStart = i;
      continue;
    }

    if (runStart >= 0) {
      const runLen = i - runStart;
      if (clues.includes(runLen)) {
        if (runStart - 1 >= 0 && next[runStart - 1] === -1) next[runStart - 1] = 0;
        if (i < line.length && next[i] === -1) next[i] = 0;
      }
      runStart = -1;
    }
  }

  return next;
}

function mergeLine(boardLine: Cell[], update: Cell[]): { merged: Cell[]; changed: number } {
  const merged = [...boardLine];
  let changed = 0;
  for (let i = 0; i < boardLine.length; i += 1) {
    if (boardLine[i] === -1 && update[i] !== -1) {
      merged[i] = update[i];
      changed += 1;
    }
  }
  return { merged, changed };
}

export function crossLineConstraint(board: Grid, rowClues: number[][], colClues: number[][]): { board: Grid; changed: number } {
  let changed = 0;
  const next = board.map((row) => [...row]);

  for (let r = 0; r < next.length; r += 1) {
    const overlap = singleLineOverlap(next[r].length, rowClues[r]);
    const merged = mergeLine(next[r], overlap);
    next[r] = merged.merged;
    changed += merged.changed;
  }

  for (let c = 0; c < next.length; c += 1) {
    const col = next.map((row) => row[c]);
    const overlap = singleLineOverlap(col.length, colClues[c]);
    const merged = mergeLine(col, overlap);
    changed += merged.changed;
    merged.merged.forEach((value, r) => {
      next[r][c] = value;
    });
  }

  return { board: next, changed };
}

export function contradictionPropagation(board: Grid, rowClues: number[][], colClues: number[][]): boolean {
  for (let r = 0; r < board.length; r += 1) {
    const required = rowClues[r].reduce((acc, n) => acc + n, 0);
    const filled = board[r].filter((cell) => cell === 1).length;
    if (filled > required) return true;
  }

  for (let c = 0; c < board.length; c += 1) {
    const required = colClues[c].reduce((acc, n) => acc + n, 0);
    const filled = board.map((row) => row[c]).filter((cell) => cell === 1).length;
    if (filled > required) return true;
  }

  return false;
}

function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}

export function recursiveAssumptionLimited(
  board: Grid,
  rowClues: number[][],
  colClues: number[][],
  metrics: SolverMetrics
): { board: Grid; deduced: boolean } {
  for (let r = 0; r < board.length; r += 1) {
    for (let c = 0; c < board.length; c += 1) {
      if (board[r][c] !== -1) continue;
      const assumeFilled = cloneGrid(board);
      assumeFilled[r][c] = 1;
      metrics.contradictionChecks += 1;
      if (contradictionPropagation(assumeFilled, rowClues, colClues)) {
        const next = cloneGrid(board);
        next[r][c] = 0;
        metrics.usedRecursion = true;
        metrics.maxLogicDepth = Math.max(metrics.maxLogicDepth, 6);
        metrics.forcedMoves += 1;
        return { board: next, deduced: true };
      }

      const assumeEmpty = cloneGrid(board);
      assumeEmpty[r][c] = 0;
      metrics.contradictionChecks += 1;
      if (contradictionPropagation(assumeEmpty, rowClues, colClues)) {
        const next = cloneGrid(board);
        next[r][c] = 1;
        metrics.usedRecursion = true;
        metrics.maxLogicDepth = Math.max(metrics.maxLogicDepth, 6);
        metrics.forcedMoves += 1;
        return { board: next, deduced: true };
      }
    }
  }

  return { board, deduced: false };
}

export function solveNonogram(board: Grid, rowClues: number[][], colClues: number[][]): { board: Grid; metrics: SolverMetrics } {
  const metrics: SolverMetrics = {
    steps: 0,
    maxLogicDepth: 1,
    forcedMoves: 0,
    usedRecursion: false,
    contradictionChecks: 0
  };

  let next = cloneGrid(board);
  let progress = true;
  while (progress && metrics.steps < 200) {
    progress = false;
    metrics.steps += 1;

    for (let r = 0; r < next.length; r += 1) {
      const overlap = singleLineOverlap(next.length, rowClues[r]);
      const merged = mergeLine(next[r], overlap);
      next[r] = blockPush(boundaryFill(merged.merged, rowClues[r]), rowClues[r]);
      if (merged.changed > 0) {
        metrics.forcedMoves += merged.changed;
        progress = true;
        metrics.maxLogicDepth = Math.max(metrics.maxLogicDepth, 4);
      }
    }

    const cross = crossLineConstraint(next, rowClues, colClues);
    next = cross.board;
    if (cross.changed > 0) {
      metrics.forcedMoves += cross.changed;
      progress = true;
      metrics.maxLogicDepth = Math.max(metrics.maxLogicDepth, 5);
    }

    if (!progress) {
      const recursion = recursiveAssumptionLimited(next, rowClues, colClues, metrics);
      next = recursion.board;
      progress = recursion.deduced;
    }
  }

  return { board: next, metrics };
}
