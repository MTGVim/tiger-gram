import type { Cell, Grid, NonogramPuzzle } from './types';

export type NonogramSizeTier = 'easy' | 'medium' | 'hard';

const SIZE_OPTIONS: Record<NonogramSizeTier, number[]> = {
  easy: [10],
  medium: [15],
  hard: [20]
};

const MAX_UNIQUE_ATTEMPTS = 64;

type ColState = {
  clueIndex: number;
  runLength: number;
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

function normalizeClue(clue: number[]): number[] {
  if (clue.length === 1 && clue[0] === 0) return [];
  return clue;
}

function cluesForLine(line: Cell[]): number[] {
  const clues: number[] = [];
  let run = 0;
  for (const cell of line) {
    if (cell === 1) run += 1;
    else if (run > 0) {
      clues.push(run);
      run = 0;
    }
  }
  if (run > 0) clues.push(run);
  return clues.length ? clues : [0];
}

function linePatterns(length: number, clue: number[]): number[][] {
  const blocks = normalizeClue(clue);
  if (blocks.length === 0) return [Array.from({ length }, () => 0)];

  const patterns: number[][] = [];

  const build = (blockIndex: number, start: number, line: number[]) => {
    if (blockIndex === blocks.length) {
      for (let i = start; i < length; i += 1) line[i] = 0;
      patterns.push([...line]);
      return;
    }

    const blockLen = blocks[blockIndex];
    const remainingBlocks = blocks.slice(blockIndex + 1);
    const remainingMin = remainingBlocks.reduce((a, b) => a + b, 0) + Math.max(0, remainingBlocks.length - 1);
    const maxPos = length - (blockLen + remainingMin);

    for (let pos = start; pos <= maxPos; pos += 1) {
      const next = [...line];
      for (let i = start; i < pos; i += 1) next[i] = 0;
      for (let i = pos; i < pos + blockLen; i += 1) next[i] = 1;
      const nextStart = pos + blockLen + 1;
      if (blockIndex === blocks.length - 1) {
        build(blockIndex + 1, pos + blockLen, next);
      } else {
        next[pos + blockLen] = 0;
        build(blockIndex + 1, nextStart, next);
      }
    }
  };

  build(0, 0, Array.from({ length }, () => 0));
  return patterns;
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

function minRowsNeeded(state: ColState, clue: number[]): number {
  if (clue.length === 0) return state.runLength > 0 ? Number.POSITIVE_INFINITY : 0;

  if (state.runLength > 0) {
    if (state.clueIndex >= clue.length || state.runLength > clue[state.clueIndex]) return Number.POSITIVE_INFINITY;
    const needCurrent = clue[state.clueIndex] - state.runLength;
    const rest = clue.slice(state.clueIndex + 1);
    const separators = rest.length;
    return needCurrent + sum(rest) + separators;
  }

  const rest = clue.slice(state.clueIndex);
  if (rest.length === 0) return 0;
  return sum(rest) + Math.max(0, rest.length - 1);
}

function applyBit(state: ColState, bit: number, clue: number[]): ColState | null {
  if (bit === 1) {
    if (clue.length === 0 || state.clueIndex >= clue.length) return null;
    const nextRun = state.runLength + 1;
    if (nextRun > clue[state.clueIndex]) return null;
    return { clueIndex: state.clueIndex, runLength: nextRun };
  }

  if (state.runLength > 0) {
    if (state.clueIndex >= clue.length || state.runLength !== clue[state.clueIndex]) return null;
    return { clueIndex: state.clueIndex + 1, runLength: 0 };
  }

  return state;
}

function finishState(state: ColState, clue: number[]): boolean {
  if (state.runLength > 0) {
    if (state.clueIndex >= clue.length || state.runLength !== clue[state.clueIndex]) return false;
    return state.clueIndex + 1 === clue.length;
  }
  return state.clueIndex === clue.length;
}

function countSolutions(
  rowClues: number[][],
  colClues: number[][],
  maxSolutions = 2,
  nodeLimit = 200000
): { count: number; exhausted: boolean } {
  const size = rowClues.length;
  const normalizedColClues = colClues.map(normalizeClue);
  const rowPatterns = rowClues.map((clue) => linePatterns(size, clue));

  const states: ColState[] = Array.from({ length: size }, () => ({ clueIndex: 0, runLength: 0 }));

  let nodes = 0;
  let count = 0;
  let exhausted = false;

  const dfs = (rowIndex: number, colStates: ColState[]) => {
    if (count >= maxSolutions || exhausted) return;
    if (nodes > nodeLimit) {
      exhausted = true;
      return;
    }

    if (rowIndex === size) {
      if (colStates.every((state, col) => finishState(state, normalizedColClues[col]))) {
        count += 1;
      }
      return;
    }

    const remaining = size - rowIndex - 1;
    const patterns = rowPatterns[rowIndex];

    for (const pattern of patterns) {
      nodes += 1;
      const nextStates: ColState[] = [];
      let valid = true;

      for (let col = 0; col < size; col += 1) {
        const applied = applyBit(colStates[col], pattern[col], normalizedColClues[col]);
        if (!applied) {
          valid = false;
          break;
        }

        if (minRowsNeeded(applied, normalizedColClues[col]) > remaining) {
          valid = false;
          break;
        }

        nextStates.push(applied);
      }

      if (valid) dfs(rowIndex + 1, nextStates);
      if (count >= maxSolutions || exhausted) return;
    }
  };

  dfs(0, states);
  return { count, exhausted };
}

function nodeLimitForSize(size: number): number {
  if (size <= 10) return 400000;
  if (size <= 15) return 300000;
  if (size <= 20) return 180000;
  return 120000;
}

function hasUniqueSolution(rowClues: number[][], colClues: number[][]): boolean {
  const { count, exhausted } = countSolutions(rowClues, colClues, 2, nodeLimitForSize(rowClues.length));
  return !exhausted && count === 1;
}

export function candidateSizesForDifficulty(tier: NonogramSizeTier, seed: number): number[] {
  const preferred = sizeForDifficulty(tier, seed);
  const sizes = [preferred, ...SIZE_OPTIONS[tier]];
  return [...new Set(sizes)];
}

export function parseNonogramSizeTier(value: string | null | undefined): NonogramSizeTier {
  if (value === 'easy') return 'easy';
  if (value === 'hard') return 'hard';
  if (value === 'expert') return 'hard';
  return 'medium';
}

export function sizeForDifficulty(tier: NonogramSizeTier, seed: number): number {
  const options = SIZE_OPTIONS[tier];
  const index = Math.abs(seed) % options.length;
  return options[index];
}

export function generateNonogram(seed: number, size = 10): NonogramPuzzle {
  const rand = mulberry32(seed);
  const solution: Grid = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => (rand() > 0.55 ? 1 : 0) as Cell)
  );

  const rowClues = solution.map((line) => cluesForLine(line));
  const colClues = Array.from({ length: size }, (_, col) => cluesForLine(solution.map((row) => row[col])));

  return { size, rowClues, colClues, solution };
}

export function tryGenerateUniqueForSize(
  seed: number,
  size: number,
  onAttempt?: (attempt: number, maxAttempts: number) => void
): NonogramPuzzle | null {
  for (let attempt = 0; attempt < MAX_UNIQUE_ATTEMPTS; attempt += 1) {
    onAttempt?.(attempt + 1, MAX_UNIQUE_ATTEMPTS);
    const candidate = generateNonogram(seed + attempt * 977, size);
    if (hasUniqueSolution(candidate.rowClues, candidate.colClues)) {
      return candidate;
    }
  }
  return null;
}

export function generateNonogramByDifficulty(seed: number, tier: NonogramSizeTier): NonogramPuzzle {
  const sizes = candidateSizesForDifficulty(tier, seed);
  for (const size of sizes) {
    const puzzle = tryGenerateUniqueForSize(seed, size);
    if (puzzle) return puzzle;
  }

  throw new Error(`Failed to generate unique nonogram for tier ${tier}`);
}
