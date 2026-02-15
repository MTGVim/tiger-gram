import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Grid } from './types';

type NonogramBoardProps = {
  board: Grid;
  rowClues: number[][];
  colClues: number[][];
  selectionResetKey?: number;
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
  selectionResetKey = 0,
  onCycleCell,
  onPaintCell,
  onEraseCell,
  conflictCells,
  locked = false
}: NonogramBoardProps) {
  const MIN_BASE_WIDTH = 800;
  const GAP_PX = 4;
  const HINT_FONT_SIZE = 34;
  const HINT_DIGIT_WIDTH = Math.ceil(HINT_FONT_SIZE * 0.62);
  const HINT_ROW_GAP = Math.max(4, Math.round(HINT_FONT_SIZE * 0.22));
  const HINT_COL_LINE_HEIGHT = Math.ceil(HINT_FONT_SIZE * 1.1);
  const draggingRef = useRef(false);
  const dragFillRef = useRef(true);
  const keyboardDragActiveRef = useRef(false);
  const keyboardDragFillRef = useRef(true);
  const lastDraggedCellRef = useRef<string | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState(0);
  const [selectedCell, setSelectedCell] = useState({ row: 0, col: 0 });
  const [hasKeyboardSelection, setHasKeyboardSelection] = useState(false);

  useEffect(() => {
    const stopDragging = () => {
      draggingRef.current = false;
      lastDraggedCellRef.current = null;
    };
    window.addEventListener('pointerup', stopDragging);
    window.addEventListener('pointercancel', stopDragging);
    return () => {
      window.removeEventListener('pointerup', stopDragging);
      window.removeEventListener('pointercancel', stopDragging);
    };
  }, []);

  useEffect(() => {
    setSelectedCell({ row: 0, col: 0 });
    keyboardDragActiveRef.current = false;
    setHasKeyboardSelection(false);
  }, [selectionResetKey, board.length]);

  const maxColClues = Math.max(...colClues.map((clue) => clue.length));
  const boardSize = board.length;
  const cellScale = boardSize <= 5 ? 2.3 : boardSize <= 10 ? 1.639 : 1;
  const cellSize = Math.round(40 * cellScale);
  const clueCellSize = cellSize;
  const hintFontSize = HINT_FONT_SIZE;
  const cellFontSize = Math.max(14, Math.round(18 * cellScale));
  const rowClueContentWidth = rowClues.reduce((maxWidth, clue) => {
    const valueWidth = clue.reduce((sum, value) => sum + String(value).length * HINT_DIGIT_WIDTH, 0);
    const gaps = Math.max(0, clue.length - 1) * HINT_ROW_GAP;
    return Math.max(maxWidth, valueWidth + gaps);
  }, 0);
  const rowClueWidth = Math.max(Math.ceil(hintFontSize * 1.2), rowClueContentWidth + 14);
  const colClueHeight = maxColClues * HINT_COL_LINE_HEIGHT + 12;
  const boardPixelWidth = boardSize * cellSize + Math.max(0, boardSize - 1) * GAP_PX;
  const baseWidth = Math.max(MIN_BASE_WIDTH, rowClueWidth + GAP_PX + boardPixelWidth + 8);

  useLayoutEffect(() => {
    const updateScale = () => {
      const targetWidth = viewportRef.current?.clientWidth ?? baseWidth;
      const nextScale = Math.min(1, Math.max(0, targetWidth / baseWidth));
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
  }, [baseWidth]);

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

  const isColSatisfied = (colIndex: number): boolean => {
    const runs: number[] = [];
    let run = 0;

    for (let r = 0; r < board.length; r += 1) {
      if (board[r][colIndex] === 1) {
        run += 1;
      } else if (run > 0) {
        runs.push(run);
        run = 0;
      }
    }

    if (run > 0) runs.push(run);
    const normalizedRuns = runs.length > 0 ? runs : [0];
    const target = colClues[colIndex];
    return normalizedRuns.length === target.length && normalizedRuns.every((value, i) => value === target[i]);
  };

  const applyDragCell = (row: number, col: number) => {
    const key = `${row}-${col}`;
    if (lastDraggedCellRef.current === key) return;
    lastDraggedCellRef.current = key;
    setSelectedCell({ row, col });
    if (dragFillRef.current) onPaintCell(row, col);
    else onEraseCell(row, col);
  };

  useEffect(() => {
    if (board.length === 0) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      if (event.key === ' ') {
        event.preventDefault();
        if (locked || event.repeat) return;
        keyboardDragActiveRef.current = true;
        const shouldFill = board[selectedCell.row]?.[selectedCell.col] !== 1;
        keyboardDragFillRef.current = shouldFill;
        if (shouldFill) onPaintCell(selectedCell.row, selectedCell.col);
        else onEraseCell(selectedCell.row, selectedCell.col);
        return;
      }

      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      if (locked) return;

      if (!hasKeyboardSelection) {
        setHasKeyboardSelection(true);
        setSelectedCell({ row: 0, col: 0 });
        if (keyboardDragActiveRef.current) {
          if (keyboardDragFillRef.current) onPaintCell(0, 0);
          else onEraseCell(0, 0);
        }
        return;
      }

      let nextRow = selectedCell.row;
      let nextCol = selectedCell.col;
      if (event.key === 'ArrowUp') nextRow = Math.max(0, selectedCell.row - 1);
      if (event.key === 'ArrowDown') nextRow = Math.min(board.length - 1, selectedCell.row + 1);
      if (event.key === 'ArrowLeft') nextCol = Math.max(0, selectedCell.col - 1);
      if (event.key === 'ArrowRight') nextCol = Math.min(board.length - 1, selectedCell.col + 1);

      if (nextRow === selectedCell.row && nextCol === selectedCell.col) return;
      setSelectedCell({ row: nextRow, col: nextCol });
      if (keyboardDragActiveRef.current) {
        if (keyboardDragFillRef.current) onPaintCell(nextRow, nextCol);
        else onEraseCell(nextRow, nextCol);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === ' ') {
        keyboardDragActiveRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [board, hasKeyboardSelection, locked, onEraseCell, onPaintCell, selectedCell]);

  return (
    <section
      className="box-border max-w-full overflow-hidden rounded-2xl border border-slate-400/60 bg-[#e7e7e7] p-3 text-slate-900 sm:p-4"
      style={{ width: `min(96vw, ${baseWidth}px)`, marginInline: 'auto' }}
    >
      <div ref={viewportRef} className="flex w-full justify-center overflow-hidden">
        <div className="overflow-hidden" style={{ width: baseWidth * scale, height: scaledHeight || 'auto' }}>
          <div ref={contentRef} className="pb-2" style={{ width: `${baseWidth}px`, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <div className="mx-auto w-fit">
              <div className="flex gap-1">
                <div style={{ width: rowClueWidth }} />
                <div className="flex gap-1">
                  {colClues.map((clue, index) => (
                    <div
                      key={`cc-${index}`}
                      className={`flex flex-col items-center justify-end gap-0.5 pb-1 font-mono font-bold ${
                        isColSatisfied(index) ? 'text-emerald-600' : 'text-slate-800'
                      }`}
                      style={{ width: clueCellSize, height: colClueHeight, fontSize: hintFontSize }}
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

              <div
                className="space-y-1"
                style={{ touchAction: 'none' }}
                onPointerMove={(event) => {
                  if (!draggingRef.current || locked) return;
                  if (event.pointerType !== 'mouse') event.preventDefault();
                  const target = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
                  const button = target?.closest('button[data-nonogram-cell="true"]') as HTMLButtonElement | null;
                  if (!button) return;
                  const row = Number(button.dataset.row);
                  const col = Number(button.dataset.col);
                  if (Number.isNaN(row) || Number.isNaN(col)) return;
                  applyDragCell(row, col);
                }}
              >
                {board.map((row, r) => (
                  <div key={`row-${r}`} className="flex gap-1">
                    <div
                      className={`flex items-center justify-end gap-1 pr-1 font-mono font-bold ${isRowSatisfied(r) ? 'text-emerald-600' : 'text-slate-800'}`}
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
                        data-nonogram-cell="true"
                        data-row={r}
                        data-col={c}
                        disabled={locked}
                        onPointerDown={(event) => {
                          if (event.pointerType === 'mouse' && event.button !== 0) return;
                          if (event.pointerType !== 'mouse') event.preventDefault();
                          setSelectedCell({ row: r, col: c });
                          draggingRef.current = true;
                          const shouldFill = board[r][c] !== 1;
                          dragFillRef.current = shouldFill;
                          lastDraggedCellRef.current = null;
                          applyDragCell(r, c);
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
                        } ${hasKeyboardSelection && selectedCell.row === r && selectedCell.col === c ? 'ring-2 ring-sky-400 ring-offset-1 ring-offset-[#e7e7e7]' : ''} ${
                          conflictCells?.has(`${r}-${c}`) ? 'animate-pulse border-rose-500 bg-rose-200' : ''
                        }`}
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
