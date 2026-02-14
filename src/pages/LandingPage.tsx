import { Link } from 'react-router-dom';

export function LandingPage() {
  const conceptImageSrc = `${import.meta.env.BASE_URL}concept.png`;

  return (
    <section className="grid gap-4">
      <article className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4 sm:p-6">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-white/60">바로 시작</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Link
            to="/nonogram"
            className="group rounded-xl border border-white/20 bg-white/10 px-4 py-4 transition hover:bg-white/20 sm:px-5 sm:py-5"
          >
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-white/65">Logic Grid</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">노노그램</p>
          </Link>
          <Link
            to="/sudoku"
            className="group rounded-xl border border-white/20 bg-white/10 px-4 py-4 transition hover:bg-white/20 sm:px-5 sm:py-5"
          >
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-white/65">Number Logic</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">스도쿠</p>
          </Link>
        </div>
      </article>
      <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-white/60">소개</p>
        <p className="mt-3 text-sm leading-6 text-white/80">
          노노그램과 스도쿠를 하나의 로직 퍼즐 플랫폼으로 묶은 웹 앱입니다.
          <br />
          상단 탭에서 게임을 선택해 바로 플레이할 수 있습니다.
        </p>
        <img
          src={conceptImageSrc}
          alt="서비스 콘셉트"
          className="mt-4 w-full max-w-[480px] rounded-xl border border-white/10 object-cover"
        />
      </article>
    </section>
  );
}
