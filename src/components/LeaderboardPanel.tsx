import { useMemo, useState } from 'react';
import type { PuzzleLeaderboardEntry } from '../lib/leaderboard';
import type { GameType } from '../lib/validation';

type LeaderboardPanelProps = {
  game: GameType;
  entries: PuzzleLeaderboardEntry[];
  difficultyLabels: Record<string, string>;
  onClear: () => void;
};

const MAX_ROWS = 20;

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(timestamp));
}

export function LeaderboardPanel({ game, entries, difficultyLabels, onClear }: LeaderboardPanelProps) {
  const [collapsed, setCollapsed] = useState(true);
  const difficulties = useMemo(() => Object.keys(difficultyLabels), [difficultyLabels]);
  const topRows = useMemo(
    () =>
      entries
        .filter((entry) => entry.game === game)
        .sort((a, b) => {
          if (a.seconds !== b.seconds) return a.seconds - b.seconds;
          return b.createdAt - a.createdAt;
        })
        .slice(0, MAX_ROWS),
    [entries, game]
  );
  const rowsByDifficulty = useMemo(
    () =>
      difficulties.map((difficulty) => ({
        difficulty,
        rows: topRows
          .filter((entry) => entry.difficulty === difficulty)
          .sort((a, b) => a.seconds - b.seconds)
      })),
    [difficulties, topRows]
  );
  const totalCount = rowsByDifficulty.reduce((sum, item) => sum + item.rows.length, 0);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className={`${collapsed ? 'mb-0' : 'mb-3'} flex items-center justify-between`}>
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-white/60">리더보드</p>
        <div className="flex items-center gap-1.5">
          {!collapsed ? (
            <button
              type="button"
              className="rounded-md border border-white/20 bg-white/10 px-2 py-1 font-mono text-[11px] text-white/75"
              onClick={onClear}
            >
              초기화
            </button>
          ) : null}
          <button
            type="button"
            aria-label="리더보드 토글"
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((prev) => !prev)}
            className="rounded-md border border-white/20 bg-white/10 px-2 py-1 font-mono text-[11px] text-white/75"
          >
            {collapsed ? '▼' : '▲'}
          </button>
        </div>
      </div>

      {collapsed ? null : totalCount === 0 ? (
        <p className="text-sm text-white/60">아직 기록이 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {rowsByDifficulty.map(({ difficulty, rows }) =>
            rows.length > 0 ? (
              <section key={difficulty}>
                <p className="mb-1 font-mono text-[11px] text-white/70">{difficultyLabels[difficulty] ?? difficulty}</p>
                <div className="space-y-1.5">
                  {rows.map((entry, index) => (
                    <div key={entry.id} className="grid grid-cols-[28px_1fr_auto] items-center gap-2 rounded-md border border-white/10 bg-black/20 px-2 py-1">
                      <span className="font-mono text-xs text-white/60">#{index + 1}</span>
                      <span className="font-mono text-[11px] text-white/60">{formatDate(entry.createdAt)}</span>
                      <span className="font-mono text-xs text-white">{entry.seconds}s</span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
