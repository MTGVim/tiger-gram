import type { NonogramDifficulty, SolverMetrics } from './types';

export function classifyNonogramDifficulty(metrics: SolverMetrics): NonogramDifficulty {
  if (metrics.usedRecursion || metrics.maxLogicDepth >= 6) return 'expert';
  if (metrics.maxLogicDepth >= 5 || metrics.forcedMoves >= 20) return 'hard';
  if (metrics.maxLogicDepth >= 3 || metrics.forcedMoves >= 8) return 'medium';
  return 'easy';
}
