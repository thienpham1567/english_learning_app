import { Tag, Space } from "antd";

const LEVEL_COLORS: Record<string, string> = {
  A1: "green",
  A2: "cyan",
  B1: "blue",
  B2: "gold",
  C1: "orange",
  C2: "volcano",
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
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "12px 32px",
        padding: "20px 0",
      }}
    >
      {/* Total */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 28,
            fontWeight: 700,
            lineHeight: 1,
            color: "var(--ink)",
          }}
        >
          {total}
        </span>
        <span
          style={{
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            color: "var(--text-muted)",
          }}
        >
          từ đã tra
        </span>
      </div>

      <div style={{ height: 32, width: 1, background: "var(--border)" }} />

      {/* Saved */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 28,
            fontWeight: 700,
            lineHeight: 1,
            color: "var(--accent)",
          }}
        >
          {savedCount}
        </span>
        <span
          style={{
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            color: "var(--text-muted)",
          }}
        >
          đã lưu
        </span>
      </div>

      {/* Level breakdown */}
      {hasLevels && (
        <>
          <div style={{ height: 32, width: 1, background: "var(--border)" }} />
          <Space size={6} wrap>
            {CEFR_LEVELS.filter((l) => levelCounts[l]).map((level) => (
              <Tag
                key={level}
                color={LEVEL_COLORS[level] ?? "default"}
                style={{ fontSize: 11, fontWeight: 600 }}
              >
                {level} {levelCounts[level]}
              </Tag>
            ))}
          </Space>
        </>
      )}
    </div>
  );
}
