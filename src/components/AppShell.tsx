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
    <main className="mx-auto min-h-screen w-full max-w-none px-4 py-6 sm:px-8 lg:max-w-6xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/45">PURE LOGIC. NO LUCK.</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">tigoku-gram</h1>
          <nav className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
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
