import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SudokuBoard } from '../features/sudoku/SudokuBoard';
import { classifySudokuDifficulty } from '../features/sudoku/difficulty';
import { generateSudokuByDifficulty, parseSudokuTier, type SudokuTier } from '../features/sudoku/generator';
import { solveSudoku } from '../features/sudoku/solver';
import type { SudokuGrid } from '../features/sudoku/types';

type GameState = 'playing' | 'won' | 'lost';

const DIFFICULTY_LABELS: Record<SudokuTier, string> = {
  easy: '쉬움',
  medium: '보통',
  hard: '어려움'
};

const STATE_LABELS: Record<GameState, string> = {
  playing: '진행중',
  won: '성공',
  lost: '포기'
};

function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function SudokuPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tier = parseSudokuTier(searchParams.get('difficulty'));
  const [seed, setSeed] = useState(4);

  const model = useMemo(() => {
    const generated = generateSudokuByDifficulty(seed, tier);
    const solvedForDifficulty = solveSudoku(generated.puzzle);

    return {
      puzzle: generated.puzzle,
      solution: generated.solution,
      difficulty: classifySudokuDifficulty(solvedForDifficulty.techniques)
    };
  }, [seed, tier]);

  const fixed = useMemo(() => model.puzzle.map((value) => value > 0), [model.puzzle]);
  const [grid, setGrid] = useState<SudokuGrid>(model.puzzle);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [state, setState] = useState<GameState>('playing');

  useEffect(() => {
    setGrid(model.puzzle);
    setSelectedIndex(null);
    setElapsedSeconds(0);
    setState('playing');
  }, [model.puzzle]);

  useEffect(() => {
    if (state !== 'playing') return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [state]);

  const completeIfSolved = useCallback(
    (nextGrid: SudokuGrid) => {
      const solved = nextGrid.every((value, index) => value === model.solution[index]);
      if (solved) setState('won');
    },
    [model.solution]
  );

  const onInput = useCallback(
    (value: number) => {
      if (state !== 'playing' || selectedIndex === null || fixed[selectedIndex]) return;

      const next = [...grid];
      next[selectedIndex] = value;
      setGrid(next);
      completeIfSolved(next);
    },
    [completeIfSolved, fixed, grid, selectedIndex, state]
  );

  const onClear = useCallback(() => {
    if (state !== 'playing' || selectedIndex === null || fixed[selectedIndex]) return;
    setGrid((prev) => {
      const next = [...prev];
      next[selectedIndex] = 0;
      return next;
    });
  }, [fixed, selectedIndex, state]);

  const restart = useCallback(() => {
    setGrid(model.puzzle);
    setSelectedIndex(null);
    setElapsedSeconds(0);
    setState('playing');
  }, [model.puzzle]);

  const abandon = useCallback(() => {
    setState('lost');
  }, []);

  const newPuzzle = useCallback(() => {
    setSeed((prev) => prev + 1);
  }, []);

  const setDifficulty = useCallback(
    (nextTier: SudokuTier) => {
      const next = new URLSearchParams(searchParams);
      next.set('difficulty', nextTier);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  return (
    <section className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <div className="space-y-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 lg:p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-[0.12em] text-white/70">{STATE_LABELS[state]}</span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(DIFFICULTY_LABELS) as SudokuTier[]).map((value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setDifficulty(value)}
                  className={`rounded-md border px-2 py-1 font-mono text-[11px] uppercase ${
                    tier === value ? 'border-white/70 bg-white/15 text-white' : 'border-white/20 text-white/70'
                  }`}
                >
                  {DIFFICULTY_LABELS[value]}
                </button>
              ))}
            </div>
            <div className="rounded-md border border-white/10 bg-black/20 px-2 py-1 font-mono text-xs text-white/80">
              {formatSeconds(elapsedSeconds)}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={restart}
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 font-mono text-[11px] uppercase text-white"
            >
              재시작
            </button>
            <button
              type="button"
              onClick={newPuzzle}
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 font-mono text-[11px] uppercase text-white"
            >
              새 퍼즐
            </button>
            <button
              type="button"
              onClick={abandon}
              disabled={state !== 'playing'}
              className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 font-mono text-[11px] uppercase text-accent disabled:opacity-40"
            >
              포기
            </button>
          </div>
        </div>
        <div className="hidden rounded-xl border border-white/10 bg-white/5 p-3 lg:block">
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-white/60">상세</p>
          <p className="mt-2 font-mono text-sm text-white/80">난이도 티어: {DIFFICULTY_LABELS[tier]}</p>
          <p className="mt-1 font-mono text-sm text-white/80">로직 난이도: {model.difficulty}</p>
        </div>
      </div>
      <SudokuBoard
        grid={grid}
        fixed={fixed}
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
        onInput={onInput}
        onClear={onClear}
        locked={state !== 'playing'}
      />
    </section>
  );
}
