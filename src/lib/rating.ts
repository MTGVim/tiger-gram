import { clamp } from './validation';

const BASE_RATING = 1000;

const DIFFICULTY_WEIGHT: Record<'easy' | 'medium' | 'hard' | 'expert', number> = {
  easy: 0.9,
  medium: 1,
  hard: 1.2,
  expert: 1.4
};

type Difficulty = keyof typeof DIFFICULTY_WEIGHT;

type RatingInput = {
  playerRating: number;
  puzzleDifficulty: number;
  actualScore: 0 | 1;
  difficultyTier: Difficulty;
  seconds: number;
  hellMode: boolean;
};

export function expectedScore(playerRating: number, puzzleDifficulty: number): number {
  return 1 / (1 + 10 ** ((puzzleDifficulty - playerRating) / 400));
}

export function speedModifier(seconds: number): number {
  const s = clamp(seconds, 10, 5400);
  return clamp(1.2 - Math.log10(s) * 0.08, 0.7, 1.15);
}

export function calculateRatingDelta(input: RatingInput): number {
  const k = 32;
  const expected = expectedScore(input.playerRating, input.puzzleDifficulty);
  const raw = k * (input.actualScore - expected);
  const weighted = raw * DIFFICULTY_WEIGHT[input.difficultyTier] * speedModifier(input.seconds) * (input.hellMode ? 1.5 : 1);
  return Math.round(weighted);
}

export function applyRating(current: number, delta: number): number {
  return clamp(current + delta, 100, 3000);
}

export function performanceScore(seconds: number, mistakes: number, difficultyMultiplier: number): number {
  const timePenalty = Math.log(Math.max(2, seconds));
  const base = 100;
  const raw = (base - timePenalty - mistakes * 20) * difficultyMultiplier;
  return Math.max(0, Math.round(raw));
}

export function defaultRating(): number {
  return BASE_RATING;
}

export function ratingTitle(rating: number): string {
  if (rating >= 1800) return 'Tiger Master';
  if (rating >= 1600) return 'Infernal Mind';
  if (rating >= 1400) return 'Logician';
  if (rating >= 1200) return 'Strategist';
  if (rating >= 1000) return 'Solver';
  return 'Novice';
}
