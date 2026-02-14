type StatCardProps = {
  label: string;
  value: string;
};

export function StatCard({ label, value }: StatCardProps) {
  return (
    <article className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-white/60">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold text-white">{value}</p>
    </article>
  );
}
