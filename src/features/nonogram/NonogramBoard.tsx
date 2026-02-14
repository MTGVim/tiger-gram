import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Grid } from './types';

type NonogramBoardProps = {
  board: Grid;
  rowClues: number[][];
  colClues: number[][];
  onCycleCell: (row: number, col: number) => void;
  onPaintCell: (row: number, col: number) => void;
  onEraseCell: (row: number, col: number) => void;
  conflictCells?: Set<string>;
  locked?: boolean;
};

export function NonogramBoard({
  board,
  rowClues,
  colClues,
  onCycleCell,
  onPaintCell,
  onEraseCell,
  conflictCells,
  locked = false
}: NonogramBoardProps) {
  const BASE_WIDTH = 800;
  const draggingRef = useRef(false);
  const dragFillRef = useRef(true);
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState(0);

  useEffect(() => {
    const handleMouseUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  useLayoutEffect(() => {
    const updateScale = () => {
      const targetWidth = viewportRef.current?.clientWidth ?? BASE_WIDTH;
      const nextScale = Math.min(1, Math.max(0, targetWidth / BASE_WIDTH));
      setScale(nextScale);
      if (contentRef.current) {
        setScaledHeight(contentRef.current.scrollHeight * nextScale);
      }
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (viewportRef.current) observer.observe(viewportRef.current);
    if (contentRef.current) observer.observe(contentRef.current);
    window.addEventListener('resize', updateScale);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  const maxRowClues = Math.max(...rowClues.map((clue) => clue.length));
  const maxColClues = Math.max(...colClues.map((clue) => clue.length));
  const size = board.length;
  const cellSize = size <= 5 ? 12 : size <= 10 ? 10 : size <= 15 ? 8 : 7;
  const clueCell = Math.max(7, cellSize - 1);
  const hintFontSize = size <= 10 ? 14 : 13;
  const cellFontSize = size <= 10 ? 13 : 12;
  const rowClueWidth = Math.min(maxRowClues * (clueCell + 4) + 8, 160);
  const colClueHeight = maxColClues * (clueCell + 2) + 4;

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
    <section
      className="box-border max-w-full overflow-hidden rounded-2xl border border-slate-400/60 bg-[#e7e7e7] p-3 text-slate-900 sm:p-4"
      style={{ width: 'min(96vw, 800px)', marginInline: 'auto' }}
    >
      <div ref={viewportRef} className="flex w-full justify-center overflow-hidden">
        <div className="overflow-hidden" style={{ width: BASE_WIDTH * scale, height: scaledHeight || 'auto' }}>
          <div ref={contentRef} className="w-[800px]" style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <div className="mx-auto w-fit">
              <div className="flex gap-1">
                <div style={{ width: rowClueWidth }} />
                <div className="flex gap-1">
                  {colClues.map((clue, index) => (
                    <div
                      key={`cc-${index}`}
                      className="flex flex-col items-center justify-end gap-0.5 pb-0.5 font-mono text-slate-800"
                      style={{ width: clueCell, height: colClueHeight, fontSize: hintFontSize }}
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
                      className={`flex items-center justify-end gap-1 pr-1 font-mono ${isRowSatisfied(r) ? 'text-emerald-600' : 'text-slate-800'}`}
                      style={{ width: rowClueWidth, height: cellSize, fontSize: hintFontSize }}
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
                          const shouldFill = board[r][c] !== 1;
                          dragFillRef.current = shouldFill;
                          if (shouldFill) onPaintCell(r, c);
                          else onEraseCell(r, c);
                        }}
                        onMouseEnter={() => {
                          if (!draggingRef.current) return;
                          if (dragFillRef.current) onPaintCell(r, c);
                          else onEraseCell(r, c);
                        }}
                        onContextMenu={(event) => {
                          event.preventDefault();
                          onCycleCell(r, c);
                        }}
                        key={`${r}-${c}`}
                        style={{ width: cellSize, height: cellSize, fontSize: cellFontSize }}
                        className={`flex items-center justify-center rounded-sm border border-slate-500/70 font-mono transition-transform active:scale-95 ${
                          cell === 1
                            ? 'bg-slate-600 text-slate-100'
                            : 'bg-[#efefef] text-slate-500'
                        } ${conflictCells?.has(`${r}-${c}`) ? 'animate-pulse border-rose-500 bg-rose-200' : ''}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
