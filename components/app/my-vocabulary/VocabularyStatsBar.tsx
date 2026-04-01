const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  A2: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
  B1: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  B2: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  C1: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
  C2: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
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
    <div className="flex flex-wrap items-center gap-x-8 gap-y-3 py-5">

      {/* Total */}
      <div className="flex flex-col gap-0.5">
        <span className="[font-family:var(--font-display)] text-3xl font-bold leading-none text-(--ink)">
          {total}
        </span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-(--text-muted)">
          từ đã tra
        </span>
      </div>

      <div className="h-8 w-px bg-(--border)" />

      {/* Saved */}
      <div className="flex flex-col gap-0.5">
        <span className="[font-family:var(--font-display)] text-3xl font-bold leading-none text-(--accent)">
          {savedCount}
        </span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-(--text-muted)">
          đã lưu
        </span>
      </div>

      {/* Level breakdown */}
      {hasLevels && (
        <>
          <div className="h-8 w-px bg-(--border)" />
          <div className="flex flex-wrap items-center gap-1.5">
            {CEFR_LEVELS.filter((l) => levelCounts[l]).map((level) => (
              <span
                key={level}
                className={`rounded px-2 py-0.5 text-[11px] font-semibold ${LEVEL_COLORS[level] ?? "bg-gray-50 text-gray-700 ring-1 ring-gray-200"}`}
              >
                {level} {levelCounts[level]}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
