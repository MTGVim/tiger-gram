import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CelebrationBurst } from '../components/CelebrationBurst';
import { LeaderboardPanel } from '../components/LeaderboardPanel';
import { SudokuBoard } from '../features/sudoku/SudokuBoard';
import { classifySudokuDifficulty } from '../features/sudoku/difficulty';
import { generateSudokuByDifficulty, parseSudokuTier, type SudokuTier } from '../features/sudoku/generator';
import { solveSudoku } from '../features/sudoku/solver';
import { clearPuzzleLeaderboard, loadPuzzleLeaderboard, recordPuzzleClear, savePuzzleLeaderboard, type PuzzleLeaderboardEntry } from '../lib/leaderboard';
import { loadLocal, saveLocal } from '../lib/persistence';
import { randomSeed } from '../lib/seed';
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

function emptyNotes(): number[][] {
  return Array.from({ length: 81 }, () => []);
}

export function SudokuPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tier = parseSudokuTier(searchParams.get('difficulty'));
  const [seed, setSeed] = useState(() => randomSeed());

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
  const [notes, setNotes] = useState<number[][]>(emptyNotes());
  const [noteMode, setNoteMode] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [state, setState] = useState<GameState>('playing');
  const [leaderboard, setLeaderboard] = useState<PuzzleLeaderboardEntry[]>(() => loadPuzzleLeaderboard());
  const [burstSignal, setBurstSignal] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [muted, setMuted] = useState(() => loadLocal<boolean>('muted', false));
  const winRecordedRef = useRef(false);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);
  const victoryAudioSrc = `${import.meta.env.BASE_URL}sounds/ta-da.mp3`;

  useEffect(() => {
    winAudioRef.current = new Audio(victoryAudioSrc);
    winAudioRef.current.preload = 'auto';
  }, [victoryAudioSrc]);

  useEffect(() => {
    saveLocal('muted', muted);
  }, [muted]);

  useEffect(() => {
    setGrid(model.puzzle);
    setNotes(emptyNotes());
    setNoteMode(false);
    setSelectedIndex(null);
    setElapsedSeconds(0);
    setState('playing');
    winRecordedRef.current = false;
  }, [model.puzzle]);

  useEffect(() => {
    if (state !== 'playing') return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [state]);

  useEffect(() => {
    if (state !== 'won' || winRecordedRef.current) return;
    winRecordedRef.current = true;
    setBurstSignal((prev) => prev + 1);
    setToast('승리!');
    window.setTimeout(() => setToast(null), 1600);
    if (!muted && winAudioRef.current) {
      winAudioRef.current.currentTime = 0;
      winAudioRef.current.play().catch(() => {});
    }
    setLeaderboard((prev) => {
      const next = recordPuzzleClear(prev, {
        game: 'sudoku',
        difficulty: tier,
        seconds: elapsedSeconds
      });
      savePuzzleLeaderboard(next);
      return next;
    });
  }, [elapsedSeconds, muted, state, tier]);

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

      if (noteMode) {
        setNotes((prev) => {
          const next = prev.map((line) => [...line]);
          const has = next[selectedIndex].includes(value);
          next[selectedIndex] = has ? next[selectedIndex].filter((n) => n !== value) : [...next[selectedIndex], value].sort((a, b) => a - b);
          return next;
        });
        return;
      }

      const next = [...grid];
      next[selectedIndex] = value;
      setGrid(next);
      setNotes((prev) => {
        const nextNotes = prev.map((line) => [...line]);
        nextNotes[selectedIndex] = [];
        return nextNotes;
      });
      completeIfSolved(next);
    },
    [completeIfSolved, fixed, grid, noteMode, selectedIndex, state]
  );

  const onClear = useCallback(() => {
    if (state !== 'playing' || selectedIndex === null || fixed[selectedIndex]) return;
    setGrid((prev) => {
      const next = [...prev];
      next[selectedIndex] = 0;
      return next;
    });
    setNotes((prev) => {
      const next = prev.map((line) => [...line]);
      next[selectedIndex] = [];
      return next;
    });
  }, [fixed, selectedIndex, state]);

  const restart = useCallback(() => {
    setGrid(model.puzzle);
    setNotes(emptyNotes());
    setNoteMode(false);
    setSelectedIndex(null);
    setElapsedSeconds(0);
    setState('playing');
    winRecordedRef.current = false;
  }, [model.puzzle]);

  const abandon = useCallback(() => {
    setState('lost');
  }, []);

  const newPuzzle = useCallback(() => {
    setSeed((prev) => prev + 1);
    winRecordedRef.current = false;
  }, []);

  const setDifficulty = useCallback(
    (nextTier: SudokuTier) => {
      if (nextTier !== tier) {
        setSeed((prev) => prev + 1);
      }
      const next = new URLSearchParams(searchParams);
      next.set('difficulty', nextTier);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, tier]
  );

  const clearLeaderboard = useCallback(() => {
    if (!window.confirm('스도쿠 리더보드를 초기화할까요?')) return;
    setLeaderboard((prev) => {
      const next = clearPuzzleLeaderboard(prev, 'sudoku');
      savePuzzleLeaderboard(next);
      return next;
    });
  }, []);

  return (
    <>
      <CelebrationBurst trigger={burstSignal} />
      <section className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <div className="space-y-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 lg:p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-[0.12em] text-white/70">{STATE_LABELS[state]}</span>
            <button
              type="button"
              onClick={() => setMuted((prev) => !prev)}
              aria-pressed={muted}
              className="rounded-md border border-white/20 bg-white/10 px-2 py-1 font-mono text-[11px] text-white/80"
            >
              {muted ? '음소거' : '소리 켜짐'}
            </button>
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
      <div className="relative">
        <SudokuBoard
          grid={grid}
          notes={notes}
          noteMode={noteMode}
          onToggleNoteMode={() => setNoteMode((prev) => !prev)}
          fixed={fixed}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
          onInput={onInput}
          onClear={onClear}
          locked={state !== 'playing'}
        />
        {toast ? (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
            <div className="rounded-lg border border-emerald-200/90 bg-emerald-700/85 px-5 py-3 font-mono text-base font-bold text-white shadow-[0_6px_20px_rgba(16,185,129,0.45)] backdrop-blur-sm">
              {toast}
            </div>
          </div>
        ) : null}
      </div>
      </div>
      <LeaderboardPanel game="sudoku" entries={leaderboard} difficultyLabels={DIFFICULTY_LABELS} onClear={clearLeaderboard} />
      </section>
    </>
  );
}
