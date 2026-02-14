export type SudokuGrid = number[];

export type SudokuTechnique =
  | 'naked_single'
  | 'hidden_single'
  | 'naked_pair'
  | 'hidden_pair'
  | 'box_line_reduction'
  | 'x_wing'
  | 'swordfish';

export type SudokuDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type SudokuSolveResult = {
  grid: SudokuGrid;
  solved: boolean;
  techniques: SudokuTechnique[];
};
