import { useLayoutEffect, useRef, useState } from 'react';
import type { SudokuGrid } from './types';

type SudokuBoardProps = {
  grid: SudokuGrid;
  fixed: boolean[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onInput: (value: number) => void;
  onClear: () => void;
  locked?: boolean;
};

export function SudokuBoard({
  grid,
  fixed,
  selectedIndex,
  onSelect,
  onInput,
  onClear,
  locked = false
}: SudokuBoardProps) {
  const BASE_WIDTH = 800;
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

  return (
    <section
      className="box-border max-w-full overflow-hidden rounded-2xl border border-slate-400/60 bg-[#e7e7e7] p-3 text-slate-900 sm:p-4"
      style={{ width: 'min(98vw, 800px)', marginInline: 'auto' }}
    >
      <div ref={viewportRef} className="flex w-full justify-center overflow-hidden">
        <div className="overflow-hidden" style={{ width: BASE_WIDTH * scale, height: scaledHeight || 'auto' }}>
          <div ref={contentRef} className="w-[800px]" style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <div className="mx-auto w-fit">
              <div className="grid w-fit grid-cols-9 gap-0 rounded-md bg-[#efefef] p-1">
                {grid.map((value, index) => (
                  <button
                    type="button"
                    disabled={locked || fixed[index]}
                    onClick={() => onSelect(index)}
                    key={index}
                    className={`flex h-12 w-12 items-center justify-center rounded-none font-mono text-base ${cellBorderClass(index)} ${
                      fixed[index]
                        ? 'bg-slate-300 text-slate-900'
                        : selectedIndex === index
                          ? 'bg-sky-200 text-sky-900'
                          : 'bg-transparent text-slate-800'
                    }`}
                  >
                    {value || '·'}
                  </button>
                ))}
              </div>
              <div className="mt-4 grid w-fit grid-cols-5 gap-1">
                {Array.from({ length: 9 }, (_, index) => (
                  <button
                    type="button"
                    disabled={locked || selectedIndex === null}
                    onClick={() => onInput(index + 1)}
                    key={`key-${index + 1}`}
                    className="h-11 w-11 rounded-sm border border-slate-500/60 bg-slate-200 font-mono text-base text-slate-900 disabled:opacity-40"
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={locked || selectedIndex === null}
                  onClick={onClear}
                  className="col-span-2 h-11 rounded-sm border border-slate-600/70 bg-slate-300 px-2 font-mono text-base uppercase text-slate-900 disabled:opacity-40"
                >
                  지우기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
