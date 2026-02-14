import type { SudokuGrid } from './types';

export type SudokuTier = 'easy' | 'medium' | 'hard' | 'expert';

const GIVENS_BY_TIER: Record<SudokuTier, number> = {
  easy: 42,
  medium: 34,
  hard: 28,
  expert: 24
};

function mulberry32(seed: number): () => number {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(values: T[], rand: () => number): T[] {
  const next = [...values];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const temp = next[i];
    next[i] = next[j];
    next[j] = temp;
  }
  return next;
}

function parseTier(value: string | null | undefined): SudokuTier {
  if (value === 'easy') return 'easy';
  if (value === 'hard') return 'hard';
  if (value === 'expert') return 'expert';
  return 'medium';
}

const BASE: SudokuGrid = [
  1, 2, 3, 4, 5, 6, 7, 8, 9,
  4, 5, 6, 7, 8, 9, 1, 2, 3,
  7, 8, 9, 1, 2, 3, 4, 5, 6,
  2, 3, 4, 5, 6, 7, 8, 9, 1,
  5, 6, 7, 8, 9, 1, 2, 3, 4,
  8, 9, 1, 2, 3, 4, 5, 6, 7,
  3, 4, 5, 6, 7, 8, 9, 1, 2,
  6, 7, 8, 9, 1, 2, 3, 4, 5,
  9, 1, 2, 3, 4, 5, 6, 7, 8
];

function valueAt(grid: SudokuGrid, row: number, col: number): number {
  return grid[row * 9 + col];
}

function candidates(grid: SudokuGrid, index: number): number[] {
  if (grid[index] !== 0) return [];
  const row = Math.floor(index / 9);
  const col = index % 9;
  const used = new Set<number>();

  for (let c = 0; c < 9; c += 1) used.add(valueAt(grid, row, c));
  for (let r = 0; r < 9; r += 1) used.add(valueAt(grid, r, col));

  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      used.add(valueAt(grid, boxRow + r, boxCol + c));
    }
  }

  const result: number[] = [];
  for (let v = 1; v <= 9; v += 1) {
    if (!used.has(v)) result.push(v);
  }
  return result;
}

function countSolutions(grid: SudokuGrid, cap = 2): number {
  const work = [...grid];
  let count = 0;

  const dfs = () => {
    if (count >= cap) return;

    let bestIndex = -1;
    let bestCandidates: number[] | null = null;

    for (let i = 0; i < 81; i += 1) {
      if (work[i] !== 0) continue;
      const opts = candidates(work, i);
      if (opts.length === 0) return;
      if (!bestCandidates || opts.length < bestCandidates.length) {
        bestCandidates = opts;
        bestIndex = i;
        if (opts.length === 1) break;
      }
    }

    if (bestIndex < 0) {
      count += 1;
      return;
    }

    for (const v of bestCandidates ?? []) {
      work[bestIndex] = v;
      dfs();
      work[bestIndex] = 0;
      if (count >= cap) return;
    }
  };

  dfs();
  return count;
}

function randomSolvedGrid(seed: number): SudokuGrid {
  const rand = mulberry32(seed);
  const digitMap = shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9], rand);
  const bandOrder = shuffled([0, 1, 2], rand);
  const stackOrder = shuffled([0, 1, 2], rand);
  const rowsInBand = bandOrder.flatMap((band) => shuffled([0, 1, 2], rand).map((offset) => band * 3 + offset));
  const colsInStack = stackOrder.flatMap((stack) => shuffled([0, 1, 2], rand).map((offset) => stack * 3 + offset));

  const solved: SudokuGrid = Array.from({ length: 81 }, () => 0);
  for (let r = 0; r < 9; r += 1) {
    for (let c = 0; c < 9; c += 1) {
      const baseValue = valueAt(BASE, rowsInBand[r], colsInStack[c]);
      solved[r * 9 + c] = digitMap[baseValue - 1];
    }
  }
  return solved;
}

function carveUniquePuzzle(solution: SudokuGrid, seed: number, tier: SudokuTier): SudokuGrid {
  const rand = mulberry32(seed * 31 + 7);
  const targetGivens = GIVENS_BY_TIER[tier];
  const puzzle = [...solution];
  const order = shuffled(Array.from({ length: 81 }, (_, i) => i), rand);

  for (const index of order) {
    const givens = puzzle.filter((v) => v !== 0).length;
    if (givens <= targetGivens) break;

    const backup = puzzle[index];
    puzzle[index] = 0;
    if (countSolutions(puzzle, 2) !== 1) {
      puzzle[index] = backup;
    }
  }

  return puzzle;
}

export function parseSudokuTier(value: string | null | undefined): SudokuTier {
  return parseTier(value);
}

export function generateSudoku(seed = 0): { puzzle: SudokuGrid; solution: SudokuGrid } {
  return generateSudokuByDifficulty(seed, 'medium');
}

export function hasUniqueSudokuSolution(puzzle: SudokuGrid): boolean {
  return countSolutions(puzzle, 2) === 1;
}

export function generateSudokuByDifficulty(seed: number, tier: SudokuTier): { puzzle: SudokuGrid; solution: SudokuGrid } {
  const solution = randomSolvedGrid(seed);
  const puzzle = carveUniquePuzzle(solution, seed, tier);
  return { puzzle, solution };
}
