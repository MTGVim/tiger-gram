import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CelebrationBurst } from '../components/CelebrationBurst';
import { LeaderboardPanel } from '../components/LeaderboardPanel';
import { NonogramBoard } from '../features/nonogram/NonogramBoard';
import { parseNonogramSizeTier, type NonogramSizeTier } from '../features/nonogram/generator';
import { clearPuzzleLeaderboard, loadPuzzleLeaderboard, recordPuzzleClear, savePuzzleLeaderboard, type PuzzleLeaderboardEntry } from '../lib/leaderboard';
import { loadLocal, saveLocal } from '../lib/persistence';
import { randomSeed } from '../lib/seed';
import type { NonogramDifficulty, NonogramPuzzle, Cell } from '../features/nonogram/types';

type GameState = 'playing' | 'won' | 'lost';

type WorkerResponse = {
  id: number;
  type: 'progress' | 'done' | 'error';
  progress?: number;
  size?: number;
  attempt?: number;
  maxAttempts?: number;
  message?: string;
  puzzle?: NonogramPuzzle;
  logicDifficulty?: NonogramDifficulty;
  logicDepth?: number;
};

const DIFFICULTY_LABELS: Record<NonogramSizeTier, string> = {
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

function blankBoard(size: number): Cell[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => -1 as Cell));
}

function rowMatchesClue(row: Cell[], clue: number[]): boolean {
  const runs: number[] = [];
  let run = 0;
  for (const cell of row) {
    if (cell === 1) run += 1;
    else if (run > 0) {
      runs.push(run);
      run = 0;
    }
  }
  if (run > 0) runs.push(run);
  const normalizedRuns = runs.length > 0 ? runs : [0];
  return normalizedRuns.length === clue.length && normalizedRuns.every((value, i) => value === clue[i]);
}

function colMatchesClue(board: Cell[][], colIndex: number, clue: number[]): boolean {
  const runs: number[] = [];
  let run = 0;
  for (let r = 0; r < board.length; r += 1) {
    if (board[r][colIndex] === 1) run += 1;
    else if (run > 0) {
      runs.push(run);
      run = 0;
    }
  }
  if (run > 0) runs.push(run);
  const normalizedRuns = runs.length > 0 ? runs : [0];
  return normalizedRuns.length === clue.length && normalizedRuns.every((value, i) => value === clue[i]);
}

export function NonogramPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sizeTier = parseNonogramSizeTier(searchParams.get('difficulty'));
  const [seed, setSeed] = useState(() => randomSeed());
  const [model, setModel] = useState<{ puzzle: NonogramPuzzle; logicDifficulty: NonogramDifficulty; logicDepth: number } | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationInfo, setGenerationInfo] = useState('');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [board, setBoard] = useState<Cell[][]>([]);
  const [selectionResetKey, setSelectionResetKey] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [state, setState] = useState<GameState>('playing');
  const [leaderboard, setLeaderboard] = useState<PuzzleLeaderboardEntry[]>(() => loadPuzzleLeaderboard());
  const [burstSignal, setBurstSignal] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [muted, setMuted] = useState(() => loadLocal<boolean>('muted', false));

  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const requestTierRef = useRef<Record<number, NonogramSizeTier>>({});
  const activeTierRef = useRef<NonogramSizeTier>(sizeTier);
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
    const worker = new Worker(new URL('../features/nonogram/nonogram.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const payload = event.data;
      if (payload.id !== requestIdRef.current) return;

      if (payload.type === 'progress') {
        setGenerationProgress(payload.progress ?? 0);
        if (payload.size && payload.attempt && payload.maxAttempts) {
          setGenerationInfo(`${payload.size}x${payload.size} · 시도 ${payload.attempt}/${payload.maxAttempts}`);
        }
        return;
      }

      if (payload.type === 'error') {
        delete requestTierRef.current[payload.id];
        setGenerationError(payload.message ?? '생성 실패');
        setIsGenerating(false);
        return;
      }

      if (payload.type === 'done' && payload.puzzle && payload.logicDifficulty && payload.logicDepth !== undefined) {
        activeTierRef.current = requestTierRef.current[payload.id] ?? activeTierRef.current;
        delete requestTierRef.current[payload.id];
        setModel({
          puzzle: payload.puzzle,
          logicDifficulty: payload.logicDifficulty,
          logicDepth: payload.logicDepth
        });
        setBoard(blankBoard(payload.puzzle.size));
        setSelectionResetKey((prev) => prev + 1);
        setElapsedSeconds(0);
        setState('playing');
        setGenerationProgress(100);
        setGenerationInfo('');
        setGenerationError(null);
        setToast(null);
        setIsGenerating(false);
        winRecordedRef.current = false;
      }
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!workerRef.current) return;
    requestIdRef.current += 1;
    requestTierRef.current[requestIdRef.current] = sizeTier;
    setState('playing');
    setToast(null);
    winRecordedRef.current = false;
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationInfo('');
    setGenerationError(null);
    workerRef.current.postMessage({
      id: requestIdRef.current,
      seed,
      tier: sizeTier
    });
  }, [seed, sizeTier]);

  useEffect(() => {
    if (state !== 'playing' || isGenerating) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isGenerating, state]);

  useEffect(() => {
    if (state !== 'won' || isGenerating || winRecordedRef.current) return;
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
        game: 'nonogram',
        difficulty: activeTierRef.current,
        seconds: elapsedSeconds
      });
      savePuzzleLeaderboard(next);
      return next;
    });
  }, [elapsedSeconds, isGenerating, muted, state]);

  const completeIfSolved = useCallback(
    (nextBoard: Cell[][]) => {
      if (!model) return;
      const rowsSolved = nextBoard.every((row, rowIndex) => rowMatchesClue(row, model.puzzle.rowClues[rowIndex]));
      const colsSolved = model.puzzle.colClues.every((clue, colIndex) => colMatchesClue(nextBoard, colIndex, clue));
      const solved = rowsSolved && colsSolved;
      if (solved) setState('won');
    },
    [model]
  );

  const handleCycleCell = useCallback(
    (row: number, col: number) => {
      if (!model || state !== 'playing' || isGenerating) return;
      setBoard((prev) => {
        const next = prev.map((line) => [...line]);
        next[row][col] = prev[row][col] === 1 ? -1 : 1;
        completeIfSolved(next);
        return next;
      });
    },
    [completeIfSolved, isGenerating, model, state]
  );

  const handleSetCell = useCallback(
    (row: number, col: number, fill: boolean) => {
      if (!model || state !== 'playing' || isGenerating) return;
      setBoard((prev) => {
        const nextValue = fill ? 1 : -1;
        if (prev[row][col] === nextValue) return prev;
        const next = prev.map((line) => [...line]);
        next[row][col] = nextValue;
        completeIfSolved(next);
        return next;
      });
    },
    [completeIfSolved, isGenerating, model, state]
  );

  const handlePaintCell = useCallback(
    (row: number, col: number) => {
      handleSetCell(row, col, true);
    },
    [handleSetCell]
  );

  const handleEraseCell = useCallback(
    (row: number, col: number) => {
      handleSetCell(row, col, false);
    },
    [handleSetCell]
  );

  const restart = useCallback(() => {
    if (!model) return;
    setBoard(blankBoard(model.puzzle.size));
    setSelectionResetKey((prev) => prev + 1);
    setElapsedSeconds(0);
    setState('playing');
    winRecordedRef.current = false;
  }, [model]);

  const newPuzzle = useCallback(() => {
    setState('playing');
    setToast(null);
    setSeed((prev) => prev + 1);
    winRecordedRef.current = false;
  }, []);

  const abandon = useCallback(() => {
    setState('lost');
  }, []);

  const setDifficulty = useCallback(
    (tier: NonogramSizeTier) => {
      setState('playing');
      setToast(null);
      winRecordedRef.current = false;
      if (tier !== sizeTier) {
        setSeed((prev) => prev + 1);
      }
      const next = new URLSearchParams(searchParams);
      next.set('difficulty', tier);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, sizeTier]
  );

  const statusLabel = useMemo(() => (isGenerating ? '생성중' : STATE_LABELS[state]), [isGenerating, state]);
  const clearLeaderboard = useCallback(() => {
    if (!window.confirm('노노그램 리더보드를 초기화할까요?')) return;
    setLeaderboard((prev) => {
      const next = clearPuzzleLeaderboard(prev, 'nonogram');
      savePuzzleLeaderboard(next);
      return next;
    });
  }, []);

  return (
    <>
      <CelebrationBurst trigger={burstSignal} />
      <section className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <div className="space-y-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 lg:p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-[0.12em] text-white/70">{statusLabel}</span>
            <button
              type="button"
              onClick={() => setMuted((prev) => !prev)}
              aria-pressed={muted}
              className="rounded-md border border-white/20 bg-white/10 px-2 py-1 font-mono text-[11px] text-white/80"
            >
              {muted ? '음소거' : '소리 켜짐'}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(Object.keys(DIFFICULTY_LABELS) as NonogramSizeTier[]).map((tier) => (
              <button
                type="button"
                key={tier}
                onClick={() => setDifficulty(tier)}
                className={`rounded-md border px-2 py-1 font-mono text-[11px] uppercase ${
                  sizeTier === tier ? 'border-white/70 bg-white/15 text-white' : 'border-white/20 text-white/70'
                }`}
              >
                {DIFFICULTY_LABELS[tier]}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs text-white/80">
            <div className="rounded-md border border-white/10 bg-black/20 px-2 py-1">크기: {model ? `${model.puzzle.size}x${model.puzzle.size}` : '-'}</div>
            <div className="rounded-md border border-white/10 bg-black/20 px-2 py-1 text-right">
              {isGenerating ? `${generationProgress}%` : formatSeconds(elapsedSeconds)}
            </div>
          </div>
          {isGenerating ? (
            <div className="mt-2 rounded-md border border-white/10 bg-black/20 px-2 py-1 font-mono text-[11px] text-white/70">
              {generationInfo || '유일해 생성 검증 중...'}
            </div>
          ) : null}
          {generationError ? (
            <div className="mt-2 rounded-md border border-rose-400/40 bg-rose-400/10 px-2 py-1 font-mono text-[11px] text-rose-200">
              {generationError}
            </div>
          ) : null}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={restart}
              disabled={!model || isGenerating}
              className="rounded-lg border border-white/20 bg-white/10 px-2 py-2 font-mono text-[11px] uppercase text-white disabled:opacity-40"
            >
              재시작
            </button>
            <button
              type="button"
              onClick={newPuzzle}
              disabled={isGenerating}
              className="rounded-lg border border-white/20 bg-white/10 px-2 py-2 font-mono text-[11px] uppercase text-white disabled:opacity-40"
            >
              새 퍼즐
            </button>
            <button
              type="button"
              onClick={abandon}
              disabled={state !== 'playing' || isGenerating}
              className="rounded-lg border border-accent/40 bg-accent/10 px-2 py-2 font-mono text-[11px] uppercase text-accent disabled:opacity-40"
            >
              포기
            </button>
          </div>
        </div>
        <div className="hidden rounded-xl border border-white/10 bg-white/5 p-3 lg:block">
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-white/60">상세</p>
          <p className="mt-2 font-mono text-sm text-white/80">난이도 티어: {DIFFICULTY_LABELS[sizeTier]}</p>
          <p className="mt-1 font-mono text-sm text-white/80">로직 난이도: {model ? model.logicDifficulty : '-'}</p>
          <p className="mt-1 font-mono text-sm text-white/80">로직 깊이: {model ? model.logicDepth : '-'}</p>
        </div>
      </div>
      <div className="relative">
        {model ? (
          <NonogramBoard
            board={board}
            rowClues={model.puzzle.rowClues}
            colClues={model.puzzle.colClues}
            selectionResetKey={selectionResetKey}
            onCycleCell={handleCycleCell}
            onPaintCell={handlePaintCell}
            onEraseCell={handleEraseCell}
            locked={state !== 'playing' || isGenerating}
          />
        ) : (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">퍼즐 생성중...</section>
        )}
        {isGenerating ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/35 backdrop-blur-[1px]">
            <div className="rounded-xl border border-white/20 bg-black/45 px-4 py-3 text-center">
              <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              <p className="mt-2 font-mono text-xs text-white/80">생성중 {generationProgress}%</p>
            </div>
          </div>
        ) : null}
        {toast ? (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
            <div className="rounded-lg border border-emerald-200/90 bg-emerald-700/85 px-5 py-3 font-mono text-base font-bold text-white shadow-[0_6px_20px_rgba(16,185,129,0.45)] backdrop-blur-sm">
              {toast}
            </div>
          </div>
        ) : null}
      </div>
      </div>
      <LeaderboardPanel game="nonogram" entries={leaderboard} difficultyLabels={DIFFICULTY_LABELS} onClear={clearLeaderboard} />
      </section>
    </>
  );
}
