import { describe, expect, it } from 'vitest';
import {
  applyRating,
  calculateRatingDelta,
  defaultRating,
  expectedScore,
  performanceScore,
  ratingTitle,
  speedModifier
} from '../../src/lib/rating';

describe('rating', () => {
  it('computes expected score', () => {
    expect(expectedScore(1000, 1000)).toBeCloseTo(0.5, 4);
  });

  it('computes positive delta for win', () => {
    const delta = calculateRatingDelta({
      playerRating: 1000,
      puzzleDifficulty: 1200,
      actualScore: 1,
      difficultyTier: 'hard',
      seconds: 180,
      hellMode: false
    });
    expect(delta).toBeGreaterThan(0);
  });

  it('applies clamps and titles', () => {
    expect(applyRating(2999, 40)).toBe(3000);
    expect(ratingTitle(1800)).toBe('Tiger Master');
    expect(defaultRating()).toBe(1000);
  });

  it('computes speed and performance', () => {
    expect(speedModifier(10)).toBeGreaterThan(speedModifier(3000));
    expect(performanceScore(60, 0, 1.5)).toBeGreaterThan(0);
  });
});
