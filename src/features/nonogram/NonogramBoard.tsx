import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Grid } from './types';

type NonogramBoardProps = {
  board: Grid;
  rowClues: number[][];
  colClues: number[][];
  onCycleCell: (row: number, col: number) => void;
  onPaintCell: (row: number, col: number) => void;
  conflictCells?: Set<string>;
  locked?: boolean;
};

export function NonogramBoard({
  board,
  rowClues,
  colClues,
  onCycleCell,
  onPaintCell,
  conflictCells,
  locked = false
}: NonogramBoardProps) {
  const draggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [scaledWidth, setScaledWidth] = useState<number>(0);
  const [scaledHeight, setScaledHeight] = useState<number>(0);

  useEffect(() => {
    const handleMouseUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  useLayoutEffect(() => {
    const updateScale = () => {
      if (!containerRef.current || !contentRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const contentWidth = contentRef.current.scrollWidth;
      const contentHeight = contentRef.current.scrollHeight;
      const nextScale = contentWidth > 0 ? Math.min(1, containerWidth / contentWidth) : 1;
      setScale(nextScale);
      setScaledWidth(contentWidth * nextScale);
      setScaledHeight(contentHeight * nextScale);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) observer.observe(containerRef.current);
    if (contentRef.current) observer.observe(contentRef.current);
    window.addEventListener('resize', updateScale);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [board.length, colClues.length, rowClues.length]);

  const maxRowClues = Math.max(...rowClues.map((clue) => clue.length));
  const maxColClues = Math.max(...colClues.map((clue) => clue.length));
  const rowClueWidth = maxRowClues * 16 + 12;
  const colClueHeight = maxColClues * 14 + 8;

  const isRowSatisfied = (rowIndex: number): boolean => {
    const row = board[rowIndex];
    const runs: number[] = [];
    let run = 0;

    for (const cell of row) {
      if (cell === 1) {
        run += 1;
      } else if (run > 0) {
        runs.push(run);
        run = 0;
      }
    }

    if (run > 0) runs.push(run);

    const normalizedRuns = runs.length > 0 ? runs : [0];
    const target = rowClues[rowIndex];
    return normalizedRuns.length === target.length && normalizedRuns.every((value, i) => value === target[i]);
  };

  return (
    <section className="rounded-2xl border border-slate-400/60 bg-[#e7e7e7] p-4 text-slate-900">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">노노그램</h2>
      <div ref={containerRef} className="w-full overflow-hidden">
        <div className="mx-auto" style={{ width: scaledWidth || '100%', height: scaledHeight || 'auto' }}>
          <div ref={contentRef} className="w-fit" style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <div className="flex">
              <div style={{ width: rowClueWidth }} />
              <div className="flex gap-1">
                {colClues.map((clue, index) => (
                  <div
                    key={`cc-${index}`}
                    className="flex w-8 flex-col items-center justify-end gap-0.5 pb-1 font-mono text-[10px] text-slate-800"
                    style={{ height: colClueHeight }}
                  >
                    {clue.map((value, i) => (
                      <span key={`cc-${index}-${i}`} className="leading-none">
                        {value}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              {board.map((row, r) => (
                <div key={`row-${r}`} className="flex gap-1">
                  <div
                    className={`flex h-8 items-center justify-end gap-1 pr-1 font-mono text-[11px] ${
                      isRowSatisfied(r) ? 'text-emerald-600' : 'text-slate-800'
                    }`}
                    style={{ width: rowClueWidth }}
                  >
                    {rowClues[r].map((value, i) => (
                      <span key={`rc-${r}-${i}`} className="leading-none">
                        {value}
                      </span>
                    ))}
                  </div>

                  {row.map((cell, c) => (
                    <button
                      type="button"
                      disabled={locked}
                      onMouseDown={(event) => {
                        if (event.button !== 0) return;
                        draggingRef.current = true;
                        onCycleCell(r, c);
                      }}
                      onMouseEnter={() => {
                        if (!draggingRef.current) return;
                        onPaintCell(r, c);
                      }}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        onCycleCell(r, c);
                      }}
                      key={`${r}-${c}`}
                      className={`flex h-8 w-8 items-center justify-center rounded-sm border border-slate-500/70 font-mono text-xs transition-transform active:scale-95 ${
                        cell === 1
                          ? 'bg-slate-600 text-slate-100'
                          : cell === 0
                            ? 'bg-slate-300/70 text-slate-600'
                            : 'bg-[#efefef] text-slate-500'
                      } ${conflictCells?.has(`${r}-${c}`) ? 'animate-pulse border-rose-500 bg-rose-200' : ''}`}
                    >
                      {cell === 0 ? 'x' : ''}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
