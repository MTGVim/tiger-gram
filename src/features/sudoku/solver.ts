import type { SudokuGrid, SudokuSolveResult } from './types';

type CandidateMap = Array<Set<number>>;

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function rowIndices(row: number): number[] {
  return Array.from({ length: 9 }, (_, col) => row * 9 + col);
}

function colIndices(col: number): number[] {
  return Array.from({ length: 9 }, (_, row) => row * 9 + col);
}

function boxIndices(box: number): number[] {
  const boxRow = Math.floor(box / 3) * 3;
  const boxCol = (box % 3) * 3;
  const indices: number[] = [];
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      indices.push((boxRow + r) * 9 + boxCol + c);
    }
  }
  return indices;
}

const UNITS: number[][] = [
  ...Array.from({ length: 9 }, (_, i) => rowIndices(i)),
  ...Array.from({ length: 9 }, (_, i) => colIndices(i)),
  ...Array.from({ length: 9 }, (_, i) => boxIndices(i))
];

function peerIndices(index: number): Set<number> {
  const row = Math.floor(index / 9);
  const col = index % 9;
  const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
  const peers = new Set<number>([...rowIndices(row), ...colIndices(col), ...boxIndices(box)]);
  peers.delete(index);
  return peers;
}

function candidatesForCell(grid: SudokuGrid, index: number): Set<number> {
  const value = grid[index];
  if (value !== 0) return new Set([value]);

  const used = new Set<number>();
  for (const peer of peerIndices(index)) {
    const peerValue = grid[peer];
    if (peerValue) used.add(peerValue);
  }

  return new Set(DIGITS.filter((digit) => !used.has(digit)));
}

function buildCandidateMap(grid: SudokuGrid): CandidateMap {
  return grid.map((_, index) => candidatesForCell(grid, index));
}

function commitSingles(grid: SudokuGrid, candidates: CandidateMap): boolean {
  let changed = false;
  for (let i = 0; i < grid.length; i += 1) {
    if (grid[i] === 0 && candidates[i].size === 1) {
      grid[i] = [...candidates[i]][0];
      changed = true;
    }
  }
  return changed;
}

export function applyNakedSingle(grid: SudokuGrid): boolean {
  const candidates = buildCandidateMap(grid);
  return commitSingles(grid, candidates);
}

export function applyHiddenSingle(grid: SudokuGrid): boolean {
  const candidates = buildCandidateMap(grid);
  for (const unit of UNITS) {
    for (const digit of DIGITS) {
      const slots = unit.filter((index) => grid[index] === 0 && candidates[index].has(digit));
      if (slots.length === 1) {
        grid[slots[0]] = digit;
        return true;
      }
    }
  }
  return false;
}

function unitNakedPairElimination(candidates: CandidateMap, unit: number[]): boolean {
  let changed = false;
  const pairMap = new Map<string, number[]>();

  for (const index of unit) {
    if (candidates[index].size !== 2) continue;
    const key = [...candidates[index]].sort((a, b) => a - b).join('-');
    pairMap.set(key, [...(pairMap.get(key) ?? []), index]);
  }

  for (const [key, pairCells] of pairMap.entries()) {
    if (pairCells.length !== 2) continue;
    const pairDigits = key.split('-').map(Number);
    for (const index of unit) {
      if (pairCells.includes(index) || candidates[index].size === 1) continue;
      for (const d of pairDigits) {
        if (candidates[index].delete(d)) changed = true;
      }
    }
  }

  return changed;
}

export function applyNakedPair(candidates: CandidateMap): boolean {
  return UNITS.some((unit) => unitNakedPairElimination(candidates, unit));
}

export function applyHiddenPair(candidates: CandidateMap): boolean {
  let changed = false;
  for (const unit of UNITS) {
    const locationsByDigit = new Map<number, number[]>();
    for (const digit of DIGITS) locationsByDigit.set(digit, []);

    for (const index of unit) {
      for (const digit of candidates[index]) {
        locationsByDigit.get(digit)?.push(index);
      }
    }

    for (let a = 1; a <= 8; a += 1) {
      for (let b = a + 1; b <= 9; b += 1) {
        const la = locationsByDigit.get(a) ?? [];
        const lb = locationsByDigit.get(b) ?? [];
        if (la.length === 2 && lb.length === 2 && la[0] === lb[0] && la[1] === lb[1]) {
          for (const idx of la) {
            for (const digit of [...candidates[idx]]) {
              if (digit !== a && digit !== b && candidates[idx].delete(digit)) changed = true;
            }
          }
        }
      }
    }
  }
  return changed;
}

export function applyBoxLineReduction(candidates: CandidateMap): boolean {
  let changed = false;
  for (let box = 0; box < 9; box += 1) {
    const boxCells = boxIndices(box);
    for (const digit of DIGITS) {
      const holders = boxCells.filter((idx) => candidates[idx].has(digit));
      if (holders.length < 2) continue;

      const rows = new Set(holders.map((idx) => Math.floor(idx / 9)));
      if (rows.size === 1) {
        const row = [...rows][0];
        for (const idx of rowIndices(row)) {
          if (boxCells.includes(idx)) continue;
          if (candidates[idx].delete(digit)) changed = true;
        }
      }

      const cols = new Set(holders.map((idx) => idx % 9));
      if (cols.size === 1) {
        const col = [...cols][0];
        for (const idx of colIndices(col)) {
          if (boxCells.includes(idx)) continue;
          if (candidates[idx].delete(digit)) changed = true;
        }
      }
    }
  }
  return changed;
}

export function applyXWing(candidates: CandidateMap): boolean {
  let changed = false;
  for (const digit of DIGITS) {
    const rowCandidateCols = Array.from({ length: 9 }, (_, row) => {
      const cols = rowIndices(row)
        .filter((idx) => candidates[idx].has(digit))
        .map((idx) => idx % 9);
      return { row, cols };
    });

    for (let r1 = 0; r1 < 8; r1 += 1) {
      for (let r2 = r1 + 1; r2 < 9; r2 += 1) {
        const a = rowCandidateCols[r1].cols;
        const b = rowCandidateCols[r2].cols;
        if (a.length === 2 && b.length === 2 && a[0] === b[0] && a[1] === b[1]) {
          for (let row = 0; row < 9; row += 1) {
            if (row === r1 || row === r2) continue;
            for (const col of a) {
              const idx = row * 9 + col;
              if (candidates[idx].delete(digit)) changed = true;
            }
          }
        }
      }
    }
  }
  return changed;
}

export function applySwordfish(candidates: CandidateMap): boolean {
  let changed = false;
  for (const digit of DIGITS) {
    const rowCols = Array.from({ length: 9 }, (_, row) => {
      const cols = rowIndices(row)
        .filter((idx) => candidates[idx].has(digit))
        .map((idx) => idx % 9);
      return { row, cols };
    }).filter((entry) => entry.cols.length >= 2 && entry.cols.length <= 3);

    for (let i = 0; i < rowCols.length - 2; i += 1) {
      for (let j = i + 1; j < rowCols.length - 1; j += 1) {
        for (let k = j + 1; k < rowCols.length; k += 1) {
          const rows = [rowCols[i], rowCols[j], rowCols[k]];
          const cols = new Set(rows.flatMap((entry) => entry.cols));
          if (cols.size !== 3) continue;

          for (let row = 0; row < 9; row += 1) {
            if (rows.some((entry) => entry.row === row)) continue;
            for (const col of cols) {
              const idx = row * 9 + col;
              if (candidates[idx].delete(digit)) changed = true;
            }
          }
        }
      }
    }
  }
  return changed;
}

function isSolved(grid: SudokuGrid): boolean {
  return grid.every((n) => n > 0);
}

export function solveSudoku(initial: SudokuGrid): SudokuSolveResult {
  const grid = [...initial];
  const techniques: SudokuSolveResult['techniques'] = [];

  for (let guard = 0; guard < 300; guard += 1) {
    if (isSolved(grid)) break;

    if (applyNakedSingle(grid)) {
      techniques.push('naked_single');
      continue;
    }

    if (applyHiddenSingle(grid)) {
      techniques.push('hidden_single');
      continue;
    }

    const candidates = buildCandidateMap(grid);
    let progress = false;

    if (applyNakedPair(candidates)) {
      techniques.push('naked_pair');
      progress = true;
    }
    if (applyHiddenPair(candidates)) {
      techniques.push('hidden_pair');
      progress = true;
    }
    if (applyBoxLineReduction(candidates)) {
      techniques.push('box_line_reduction');
      progress = true;
    }
    if (applyXWing(candidates)) {
      techniques.push('x_wing');
      progress = true;
    }
    if (applySwordfish(candidates)) {
      techniques.push('swordfish');
      progress = true;
    }

    if (commitSingles(grid, candidates)) {
      progress = true;
    }

    if (!progress) break;
  }

  return { grid, solved: isSolved(grid), techniques };
}

export function buildCandidatesForTesting(grid: SudokuGrid): CandidateMap {
  return buildCandidateMap(grid);
}
