/// <reference lib="webworker" />

import { classifyNonogramDifficulty } from './difficulty';
import type { NonogramPuzzle } from './types';
import {
  candidateSizesForDifficulty,
  MAX_UNIQUE_ATTEMPTS,
  tryGenerateUniqueForSize,
  type NonogramSizeTier
} from './generator';
import { solveNonogram } from './solver';

type GenerateRequest = {
  id: number;
  seed: number;
  tier: NonogramSizeTier;
};

type GenerateResponse = {
  id: number;
  puzzle: NonogramPuzzle;
  logicDifficulty: ReturnType<typeof classifyNonogramDifficulty>;
  logicDepth: number;
};

type GenerateProgress = {
  id: number;
  type: 'progress';
  progress: number;
  size: number;
  attempt: number;
  maxAttempts: number;
};

type GenerateDone = GenerateResponse & {
  type: 'done';
};

type GenerateError = {
  id: number;
  type: 'error';
  message: string;
};

self.onmessage = (event: MessageEvent<GenerateRequest>) => {
  const { id, seed, tier } = event.data;
  try {
    const sizes = candidateSizesForDifficulty(tier, seed);
    const perSize = MAX_UNIQUE_ATTEMPTS;
    const total = sizes.length * perSize;
    let completed = 0;
    let puzzle = null;

    for (const size of sizes) {
      puzzle = tryGenerateUniqueForSize(seed, size, tier, (attempt, maxAttempts) => {
        const absolute = completed + attempt;
        const progress = Math.min(99, Math.max(1, Math.floor((absolute / total) * 100)));
        const payload: GenerateProgress = { id, type: 'progress', progress, size, attempt, maxAttempts };
        postMessage(payload);
      });
      completed += perSize;
      if (puzzle) break;
    }

    if (!puzzle) {
      throw new Error(`Failed to generate unique puzzle for tier ${tier}`);
    }

    const blank = Array.from({ length: puzzle.size }, () => Array.from({ length: puzzle.size }, () => -1 as const));
    const solved = solveNonogram(blank, puzzle.rowClues, puzzle.colClues);

    const response: GenerateDone = {
      id,
      type: 'done',
      puzzle,
      logicDifficulty: classifyNonogramDifficulty(solved.metrics),
      logicDepth: solved.metrics.maxLogicDepth
    };
    postMessage(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown generation error';
    const payload: GenerateError = { id, type: 'error', message };
    postMessage(payload);
  }
};
