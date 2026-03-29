const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-green-100 text-green-800",
  A2: "bg-cyan-100 text-cyan-800",
  B1: "bg-blue-100 text-blue-800",
  B2: "bg-yellow-100 text-yellow-800",
  C1: "bg-orange-100 text-orange-800",
  C2: "bg-red-100 text-red-800",
};

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

type StatsEntry = { level: string | null; saved: boolean };

type Props = { entries: StatsEntry[] };

export function VocabularyStatsBar({ entries }: Props) {
  const total = entries.length;
  const savedCount = entries.filter((e) => e.saved).length;

  const levelCounts = CEFR_LEVELS.reduce<Record<string, number>>((acc, level) => {
    const count = entries.filter((e) => e.level === level).length;
    if (count > 0) acc[level] = count;
    return acc;
  }, {});

  const hasLevels = Object.keys(levelCounts).length > 0;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm shadow-[var(--shadow-sm)]">
      <span className="text-[var(--text-secondary)]">
        <span className="font-semibold text-[var(--ink)]">{total}</span> từ
      </span>
      <span className="text-[var(--text-muted)]">·</span>
      <span className="text-[var(--text-secondary)]">
        <span className="font-semibold text-[var(--ink)]">{savedCount}</span> đã lưu
      </span>
      {hasLevels && <span className="text-[var(--text-muted)]">·</span>}
      {CEFR_LEVELS.filter((l) => levelCounts[l]).map((level) => (
        <span
          key={level}
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${LEVEL_COLORS[level]}`}
        >
          {level} {levelCounts[level]}
        </span>
      ))}
    </div>
  );
}
