export function LandingPage() {
  const conceptImageSrc = `${import.meta.env.BASE_URL}concept.png`;

  return (
    <section className="grid gap-4">
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
          className="mt-4 w-full rounded-xl border border-white/10 object-cover"
        />
      </article>
    </section>
  );
}
