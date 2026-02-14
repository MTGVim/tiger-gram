import type { SudokuDifficulty, SudokuTechnique } from './types';

const SCORES: Record<SudokuTechnique, number> = {
  naked_single: 1,
  hidden_single: 2,
  naked_pair: 3,
  hidden_pair: 3,
  box_line_reduction: 4,
  x_wing: 6,
  swordfish: 7
};

export function classifySudokuDifficulty(techniques: SudokuTechnique[]): SudokuDifficulty {
  const max = techniques.reduce((acc, t) => Math.max(acc, SCORES[t]), 0);
  if (max >= 6) return 'expert';
  if (max >= 3) return 'hard';
  if (max >= 2) return 'medium';
  return 'easy';
}
