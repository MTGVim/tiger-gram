export type Cell = 1 | 0 | -1;

export type Grid = Cell[][];

export type NonogramPuzzle = {
  size: number;
  rowClues: number[][];
  colClues: number[][];
  solution: Grid;
};

export type SolverMetrics = {
  steps: number;
  maxLogicDepth: number;
  forcedMoves: number;
  usedRecursion: boolean;
  contradictionChecks: number;
};

export type NonogramDifficulty = 'easy' | 'medium' | 'hard' | 'expert';
