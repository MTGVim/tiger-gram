export function LandingPage() {
  return (
    <section className="grid gap-4">
      <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-white/60">소개</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">tigoku-gram</h2>
        <p className="mt-3 text-sm leading-6 text-white/80">
          노노그램과 스도쿠를 하나의 로직 퍼즐 플랫폼으로 묶은 웹 앱입니다.
          <br />
          상단 탭에서 게임을 선택해 바로 플레이할 수 있습니다.
        </p>
      </article>

      <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-white/60">링크</p>
        <a
          href="#"
          className="mt-2 inline-flex rounded-lg border border-white/20 bg-white/10 px-3 py-2 font-mono text-xs uppercase text-white/90"
        >
          GitHub (URL 예정)
        </a>
      </article>
    </section>
  );
}
