"use client";

import { ApartmentOutlined } from "@ant-design/icons";
import type { WordFamilyGroup } from "@/lib/schemas/vocabulary";

type WordFamilySectionProps = {
  wordFamily: WordFamilyGroup[] | null;
  onSearch: (word: string) => void;
};

const POS_LABEL_STYLE: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "var(--text-muted)",
};

const PILL_STYLE: React.CSSProperties = {
  borderRadius: 999,
  background: "var(--surface)",
  padding: "4px 12px",
  fontSize: 13,
  color: "var(--text-primary)",
  border: "1px solid var(--border)",
  cursor: "pointer",
  transition: "background 0.15s, color 0.15s",
};

export function WordFamilySection({ wordFamily, onSearch }: WordFamilySectionProps) {
  if (!wordFamily || wordFamily.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "var(--text-muted)",
        }}
      >
        <ApartmentOutlined style={{ fontSize: 11 }} />
        Word Family
      </span>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
        {wordFamily.map((group) => (
          <div key={group.pos} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={POS_LABEL_STYLE}>{group.pos}</span>
            {group.words.map((word) => (
              <button
                key={word}
                type="button"
                onClick={() => onSearch(word)}
                style={PILL_STYLE}
              >
                {word}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

