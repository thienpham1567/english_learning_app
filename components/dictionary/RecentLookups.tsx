"use client";

const STORAGE_KEY = "dictionary-recent-lookups";
const MAX_ITEMS = 8;

export function getRecentLookups(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function pushRecentLookup(headword: string): void {
  if (typeof window === "undefined") return;
  try {
    const list = getRecentLookups().filter((w) => w.toLowerCase() !== headword.toLowerCase());
    list.unshift(headword);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_ITEMS)));
  } catch {
    // silent
  }
}

type Props = {
  words: string[];
  onSelect: (word: string) => void;
};

export function RecentLookups({ words, onSelect }: Props) {
  if (words.length === 0) return null;

  return (
    <div
      className="scrollbar-none"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        overflowX: "auto",
        paddingBottom: 4,
      }}
    >
      <span
        style={{
          flexShrink: 0,
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--text-muted)",
        }}
      >
        Gần đây
      </span>
      {words.map((word) => (
        <button
          key={word}
          type="button"
          onClick={() => onSelect(word)}
          style={{
            flexShrink: 0,
            borderRadius: 999,
            border: "1px solid rgba(154,177,122,0.3)",
            background: "var(--surface)",
            padding: "4px 12px",
            fontSize: 12,
            fontWeight: 500,
            color: "var(--accent)",
            cursor: "pointer",
            transition: "all 0.15s",
            whiteSpace: "nowrap",
          }}
        >
          {word}
        </button>
      ))}
    </div>
  );
}
