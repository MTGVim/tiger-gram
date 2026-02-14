import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-1.5 font-mono text-xs uppercase tracking-[0.12em] transition ${
      isActive ? 'bg-white text-black' : 'text-white/70 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <main className="mx-auto min-h-screen w-full max-w-none overflow-x-hidden px-3 py-6 sm:px-8 lg:max-w-6xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/45">PURE LOGIC. NO LUCK.</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">tigoku-gram</h1>
            <a
              href="https://github.com/MTGVim/tigoku-gram"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub 저장소"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white/90 transition-colors hover:bg-white/20"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
                <path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.87 10.92c.58.1.8-.25.8-.56v-2.1c-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.72-1.52-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.14 1.18a10.9 10.9 0 0 1 5.72 0c2.18-1.5 3.14-1.18 3.14-1.18.62 1.59.23 2.76.12 3.05.73.8 1.18 1.82 1.18 3.08 0 4.43-2.7 5.4-5.27 5.68.41.35.78 1.04.78 2.1v3.11c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
              </svg>
            </a>
          </div>
          <nav className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
            <NavLink to="/" end className={navClass}>
              홈
            </NavLink>
            <NavLink to="/nonogram" className={navClass}>
              노노그램
            </NavLink>
            <NavLink to="/sudoku" className={navClass}>
              스도쿠
            </NavLink>
          </nav>
        </div>
      </header>
      {children}
    </main>
  );
}
