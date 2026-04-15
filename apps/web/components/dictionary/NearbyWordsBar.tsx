"use client";

type NearbyWordsBarProps = {
  words: string[];
  headword: string;
  onSearch: (word: string) => void;
};

const wordBtnStyle: React.CSSProperties = {
  borderRadius: 999,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  padding: "2px 10px",
  fontSize: 12,
  color: "var(--text-secondary)",
  cursor: "pointer",
  transition: "border-color 0.2s, color 0.2s",
};

export function NearbyWordsBar({ words, headword, onSearch }: NearbyWordsBarProps) {
  if (words.length === 0) return null;

  const half = Math.floor(words.length / 2);
  const before = words.slice(0, half);
  const after = words.slice(half);

  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          color: "var(--text-muted)",
          marginRight: 4,
        }}
      >
        Nearby
      </span>
      {before.map((word) => (
        <button key={word} type="button" onClick={() => onSearch(word)} style={wordBtnStyle}>
          {word}
        </button>
      ))}
      <span
        style={{
          borderRadius: 999,
          background: "rgba(154,177,122,0.1)",
          padding: "2px 10px",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--accent)",
        }}
      >
        {headword}
      </span>
      {after.map((word) => (
        <button key={word} type="button" onClick={() => onSearch(word)} style={wordBtnStyle}>
          {word}
        </button>
      ))}
    </div>
  );
}
