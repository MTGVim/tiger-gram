import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { SudokuGrid } from './types';

type SudokuBoardProps = {
  grid: SudokuGrid;
  notes: number[][];
  noteMode: boolean;
  onToggleNoteMode: () => void;
  fixed: boolean[];
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
  onInput: (value: number) => void;
  onClear: () => void;
  locked?: boolean;
};

export function SudokuBoard({
  grid,
  notes,
  noteMode,
  onToggleNoteMode,
  fixed,
  selectedIndex,
  onSelect,
  onInput,
  onClear,
  locked = false
}: SudokuBoardProps) {
  const CELL_WIDTH = Math.round(56 * 1.1);
  const CELL_HEIGHT = Math.round(56 * 1.1);
  const PAD_WIDTH = Math.round(176 * 1.2);
  const GRID_WIDTH = CELL_WIDTH * 9 + 8;
  const LAYOUT_GAP = 12;
  const BASE_WIDTH = GRID_WIDTH + PAD_WIDTH + LAYOUT_GAP;
  const rootRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState(0);

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

  const cellBorderClass = (index: number): string => {
    const row = Math.floor(index / 9);
    const col = index % 9;
    const top = row % 3 === 0 ? 'border-t-2 border-t-slate-700/90' : 'border-t border-t-slate-500/60';
    const left = col % 3 === 0 ? 'border-l-2 border-l-slate-700/90' : 'border-l border-l-slate-500/60';
    const right = col === 8 ? 'border-r-2 border-r-slate-700/90' : '';
    const bottom = row === 8 ? 'border-b-2 border-b-slate-700/90' : '';
    return `${top} ${left} ${right} ${bottom}`;
  };

  const selectedValue = selectedIndex !== null ? grid[selectedIndex] : 0;
  const highlightRows = new Set<number>();
  const highlightCols = new Set<number>();
  const highlightBoxes = new Set<number>();

  if (selectedValue > 0) {
    grid.forEach((value, index) => {
      if (value !== selectedValue) return;
      const row = Math.floor(index / 9);
      const col = index % 9;
      const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
      highlightRows.add(row);
      highlightCols.add(col);
      highlightBoxes.add(box);
    });
  }

  const selectionLocked = selectedIndex === null ? true : fixed[selectedIndex];
  const editableSelected = selectedIndex !== null && !selectionLocked;

  useEffect(() => {
    if (!editableSelected) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      onSelect(null);
    };
    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [editableSelected, onSelect]);

  return (
    <section
      ref={rootRef}
      className="box-border max-w-full overflow-hidden rounded-2xl border border-slate-400/60 bg-[#e7e7e7] p-3 text-slate-900 sm:p-4"
      style={{ width: `min(96vw, ${BASE_WIDTH}px)`, marginInline: 'auto' }}
    >
      <div ref={viewportRef} className="flex w-full justify-center overflow-hidden">
        <div className="overflow-hidden" style={{ width: BASE_WIDTH * scale, height: scaledHeight || 'auto' }}>
          <div ref={contentRef} style={{ width: `${BASE_WIDTH}px`, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <div className="flex items-start gap-3">
              <div className="grid w-fit grid-cols-9 gap-0 rounded-md bg-[#efefef] p-1">
                {grid.map((value, index) => {
                  const row = Math.floor(index / 9);
                  const col = index % 9;
                  const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
                  const inHighlightLine = highlightRows.has(row) || highlightCols.has(col) || highlightBoxes.has(box);
                  return (
                    <button
                      type="button"
                      disabled={locked}
                      onClick={() => onSelect(index)}
                      key={index}
                      className={`relative flex items-center justify-center rounded-none font-mono text-lg ${cellBorderClass(index)} ${
                        selectedIndex === index
                          ? 'bg-sky-200 text-sky-900'
                          : selectedValue > 0 && value === selectedValue
                            ? 'bg-amber-100 text-amber-900'
                            : selectedValue > 0 && inHighlightLine
                              ? 'bg-sky-100/60 text-slate-900'
                              : fixed[index]
                                ? 'bg-slate-300 text-slate-900'
                                : 'bg-transparent text-slate-800'
                      }`}
                      style={{ width: `${CELL_WIDTH}px`, height: `${CELL_HEIGHT}px` }}
                    >
                      {value > 0 ? (
                        value
                      ) : notes[index].length > 0 ? (
                        <div className="grid grid-cols-3 gap-0 text-[9px] leading-[1] text-slate-600">
                          {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
                            <span key={n} className="inline-flex h-3 w-3 items-center justify-center">
                              {notes[index].includes(n) ? n : ''}
                            </span>
                          ))}
                        </div>
                      ) : (
                        ''
                      )}
                    </button>
                  );
                })}
              </div>
              <div
                className="rounded-lg border border-slate-500/65 bg-slate-100/78 p-2 shadow-[0_8px_28px_rgba(15,23,42,0.28)] backdrop-blur-[2px]"
                style={{ width: `${PAD_WIDTH}px` }}
              >
                <div className="mb-1 grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    disabled={locked || selectionLocked}
                    onClick={onToggleNoteMode}
                    className={`h-11 rounded-sm border px-1 font-mono text-sm uppercase disabled:opacity-40 ${
                      noteMode ? 'border-sky-500/60 bg-sky-100/75 text-sky-900' : 'border-slate-500/60 bg-slate-200/75 text-slate-900'
                    }`}
                  >
                    메모
                  </button>
                  <button
                    type="button"
                    disabled={locked || selectionLocked}
                    onClick={() => {
                      onClear();
                      onSelect(null);
                    }}
                    className="h-11 rounded-sm border border-slate-600/70 bg-slate-300/75 px-1 font-mono text-sm uppercase text-slate-900 disabled:opacity-40"
                  >
                    지우기
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {Array.from({ length: 9 }, (_, index) => (
                    <button
                      type="button"
                      disabled={locked || selectionLocked}
                      onClick={() => {
                        onInput(index + 1);
                        onSelect(null);
                      }}
                      key={`key-${index + 1}`}
                      className="h-[58px] w-[58px] rounded-sm border border-slate-500/60 bg-slate-200/75 font-mono text-lg text-slate-900 disabled:opacity-40"
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
