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
  const MOBILE_STACK_BREAKPOINT = 800;
  const CELL_WIDTH = Math.round(56 * 1.18);
  const CELL_HEIGHT = Math.round(56 * 1.18);
  const GRID_WIDTH = CELL_WIDTH * 9 + 8;
  const LAYOUT_GAP = 12;
  const PAD_BASE_WIDTH = 162;
  const rootRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [stackedLayout, setStackedLayout] = useState(() => (typeof window === 'undefined' ? false : window.innerWidth < MOBILE_STACK_BREAKPOINT));
  const PAD_SCALE = stackedLayout ? 2 : 1;
  const FONT_SCALE = stackedLayout ? 2.1 : 1.15;
  const PAD_WIDTH = Math.round(PAD_BASE_WIDTH * PAD_SCALE);
  const PAD_CONTROL_HEIGHT = Math.round(40 * PAD_SCALE);
  const PAD_NUMBER_SIZE = Math.round(44 * PAD_SCALE);
  const STACKED_BUTTON_SIZE = Math.round(44 * 1.5);
  const STACKED_CONTROL_BUTTON_WIDTH = STACKED_BUTTON_SIZE * 2;
  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState(0);
  const baseWidth = stackedLayout ? GRID_WIDTH : GRID_WIDTH + PAD_WIDTH + LAYOUT_GAP;
  const keypadValues = [7, 8, 9, 4, 5, 6, 1, 2, 3];
  const stackedTopKeypadValues = [1, 2, 3, 4, 5];
  const stackedBottomKeypadValues = [6, 7, 8, 9];

  useLayoutEffect(() => {
    const updateScale = () => {
      const nextStackedLayout = window.innerWidth < MOBILE_STACK_BREAKPOINT;
      if (nextStackedLayout !== stackedLayout) {
        setStackedLayout(nextStackedLayout);
      }
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
  }, [baseWidth, stackedLayout]);

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
  const lineHighlight = new Set<number>();
  const boxHighlight = new Set<number>();
  const conflictIndices = new Set<number>();

  const registerConflicts = (indices: number[]) => {
    const seen = new Map<number, number[]>();
    indices.forEach((index) => {
      const value = grid[index];
      if (value === 0) return;
      const bucket = seen.get(value) ?? [];
      bucket.push(index);
      seen.set(value, bucket);
    });
    seen.forEach((bucket) => {
      if (bucket.length < 2) return;
      bucket.forEach((index) => conflictIndices.add(index));
    });
  };

  for (let row = 0; row < 9; row += 1) {
    registerConflicts(Array.from({ length: 9 }, (_, col) => row * 9 + col));
  }

  for (let col = 0; col < 9; col += 1) {
    registerConflicts(Array.from({ length: 9 }, (_, row) => row * 9 + col));
  }

  for (let boxRow = 0; boxRow < 3; boxRow += 1) {
    for (let boxCol = 0; boxCol < 3; boxCol += 1) {
      const indices: number[] = [];
      for (let r = 0; r < 3; r += 1) {
        for (let c = 0; c < 3; c += 1) {
          indices.push((boxRow * 3 + r) * 9 + (boxCol * 3 + c));
        }
      }
      registerConflicts(indices);
    }
  }

  if (selectedValue > 0) {
    grid.forEach((value, index) => {
      if (value !== selectedValue) return;
      const row = Math.floor(index / 9);
      const col = index % 9;
      for (let c = 0; c < 9; c += 1) {
        lineHighlight.add(row * 9 + c);
      }
      for (let r = 0; r < 9; r += 1) {
        lineHighlight.add(r * 9 + col);
      }

      const boxRow = Math.floor(row / 3) * 3;
      const boxCol = Math.floor(col / 3) * 3;
      for (let r = 0; r < 3; r += 1) {
        for (let c = 0; c < 3; c += 1) {
          boxHighlight.add((boxRow + r) * 9 + (boxCol + c));
        }
      }
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

  useEffect(() => {
    if (locked) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const row = selectedIndex === null ? 0 : Math.floor(selectedIndex / 9);
      const col = selectedIndex === null ? 0 : selectedIndex % 9;
      const hasSelection = selectedIndex !== null;

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        onSelect(hasSelection ? ((row + 8) % 9) * 9 + col : 0);
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        onSelect(hasSelection ? ((row + 1) % 9) * 9 + col : 0);
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        onSelect(hasSelection ? row * 9 + ((col + 8) % 9) : 0);
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        onSelect(hasSelection ? row * 9 + ((col + 1) % 9) : 0);
        return;
      }

      if (!hasSelection) return;

      if (event.key === 'Tab') {
        event.preventDefault();
        onToggleNoteMode();
        return;
      }

      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        onClear();
        return;
      }

      if (/^[1-9]$/.test(event.key)) {
        event.preventDefault();
        onInput(Number(event.key));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [locked, onClear, onInput, onSelect, onToggleNoteMode, selectedIndex]);

  return (
    <section
      ref={rootRef}
      className="box-border max-w-full overflow-hidden rounded-2xl border border-slate-400/60 bg-[#e7e7e7] p-3 text-slate-900 sm:p-4"
      style={{ width: `min(96vw, ${baseWidth}px)`, marginInline: 'auto' }}
    >
      <div ref={viewportRef} className="flex w-full justify-center overflow-hidden">
        <div className="overflow-hidden" style={{ width: baseWidth * scale, height: scaledHeight || 'auto' }}>
          <div ref={contentRef} style={{ width: `${baseWidth}px`, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <div className={`flex items-start ${stackedLayout ? 'flex-col gap-3' : 'gap-2'}`}>
              <div className="grid w-fit grid-cols-9 gap-0 rounded-md bg-[#efefef] p-1">
                {grid.map((value, index) => {
                  return (
                    <button
                      type="button"
                      disabled={locked}
                      onClick={() => onSelect(index)}
                      key={index}
                      className={`relative flex items-center justify-center rounded-none font-mono font-bold ${cellBorderClass(index)} ${
                        conflictIndices.has(index)
                          ? 'bg-rose-200 text-rose-900'
                          : selectedIndex === index
                          ? 'bg-sky-200 text-sky-900'
                          : selectedValue > 0 && value === selectedValue
                            ? 'bg-amber-100 text-amber-900'
                            : selectedValue > 0 && boxHighlight.has(index)
                              ? 'bg-indigo-50/70 text-slate-900'
                            : selectedValue > 0 && lineHighlight.has(index)
                              ? 'bg-sky-50/70 text-slate-900'
                            : fixed[index]
                                ? 'bg-slate-300 text-slate-900'
                                : 'bg-transparent text-slate-800'
                      }`}
                      style={{ width: `${CELL_WIDTH}px`, height: `${CELL_HEIGHT}px`, fontSize: `${Math.round(24 * FONT_SCALE)}px` }}
                    >
                      {value > 0 ? (
                        value
                      ) : notes[index].length > 0 ? (
                        <div className="grid grid-cols-3 gap-0 font-semibold leading-[1] text-slate-700" style={{ fontSize: `${Math.round(11 * FONT_SCALE)}px` }}>
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
                className={`rounded-lg border border-slate-500/65 bg-slate-100/78 p-1 backdrop-blur-[2px] ${stackedLayout ? 'self-center' : ''}`}
                style={{ width: `${stackedLayout ? GRID_WIDTH : PAD_WIDTH}px` }}
              >
                {stackedLayout ? (
                  <div className="flex items-start justify-center gap-2 pb-1">
                    <div className="grid gap-1.5">
                      <div className="flex items-center gap-1.5">
                        {stackedTopKeypadValues.map((value) => (
                          <button
                            type="button"
                            disabled={locked || selectionLocked}
                            onClick={() => onInput(value)}
                            key={`key-${value}`}
                            className="shrink-0 rounded-sm border border-slate-500/60 bg-slate-200/75 font-mono font-bold text-slate-900 disabled:opacity-40"
                            style={{ width: `${STACKED_BUTTON_SIZE}px`, height: `${STACKED_BUTTON_SIZE}px`, fontSize: `${Math.round(18 * FONT_SCALE)}px` }}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {stackedBottomKeypadValues.map((value) => (
                          <button
                            type="button"
                            disabled={locked || selectionLocked}
                            onClick={() => onInput(value)}
                            key={`key-${value}`}
                            className="shrink-0 rounded-sm border border-slate-500/60 bg-slate-200/75 font-mono font-bold text-slate-900 disabled:opacity-40"
                            style={{ width: `${STACKED_BUTTON_SIZE}px`, height: `${STACKED_BUTTON_SIZE}px`, fontSize: `${Math.round(18 * FONT_SCALE)}px` }}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid gap-1.5">
                      <button
                        type="button"
                        disabled={locked || selectionLocked}
                        onClick={onToggleNoteMode}
                        className={`shrink-0 rounded-sm border px-2 font-mono font-bold uppercase disabled:opacity-40 ${
                          noteMode ? 'border-sky-500/60 bg-sky-100/75 text-sky-900' : 'border-slate-500/60 bg-slate-200/75 text-slate-900'
                        }`}
                        style={{ width: `${STACKED_CONTROL_BUTTON_WIDTH}px`, height: `${STACKED_BUTTON_SIZE}px`, fontSize: `${Math.round(12 * FONT_SCALE)}px` }}
                      >
                        메모
                      </button>
                      <button
                        type="button"
                        disabled={locked || selectionLocked}
                        onClick={onClear}
                        className="shrink-0 rounded-sm border border-slate-600/70 bg-slate-300/75 px-2 font-mono font-bold uppercase text-slate-900 disabled:opacity-40"
                        style={{ width: `${STACKED_CONTROL_BUTTON_WIDTH}px`, height: `${STACKED_BUTTON_SIZE}px`, fontSize: `${Math.round(12 * FONT_SCALE)}px` }}
                      >
                        지우기
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-2 grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        disabled={locked || selectionLocked}
                        onClick={onToggleNoteMode}
                        className={`rounded-sm border px-1 font-mono font-bold uppercase disabled:opacity-40 ${
                          noteMode ? 'border-sky-500/60 bg-sky-100/75 text-sky-900' : 'border-slate-500/60 bg-slate-200/75 text-slate-900'
                        }`}
                        style={{ height: `${PAD_CONTROL_HEIGHT}px`, fontSize: `${Math.round(12 * FONT_SCALE)}px` }}
                      >
                        메모
                      </button>
                      <button
                        type="button"
                        disabled={locked || selectionLocked}
                        onClick={() => {
                          onClear();
                        }}
                        className="rounded-sm border border-slate-600/70 bg-slate-300/75 px-1 font-mono font-bold uppercase text-slate-900 disabled:opacity-40"
                        style={{ height: `${PAD_CONTROL_HEIGHT}px`, fontSize: `${Math.round(12 * FONT_SCALE)}px` }}
                      >
                        지우기
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {keypadValues.map((value) => (
                        <button
                          type="button"
                          disabled={locked || selectionLocked}
                          onClick={() => {
                            onInput(value);
                          }}
                          key={`key-${value}`}
                          className="rounded-sm border border-slate-500/60 bg-slate-200/75 font-mono font-bold text-slate-900 disabled:opacity-40"
                          style={{ width: `${PAD_NUMBER_SIZE}px`, height: `${PAD_NUMBER_SIZE}px`, fontSize: `${Math.round(18 * FONT_SCALE)}px` }}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
