"use client";

type NearbyWordsBarProps = {
  words: string[];
  headword: string;
  onSearch: (word: string) => void;
};

export function NearbyWordsBar({ words, headword, onSearch }: NearbyWordsBarProps) {
  if (words.length === 0) return null;

  const half = Math.floor(words.length / 2);
  const before = words.slice(0, half);
  const after = words.slice(half);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted mr-1">
        Nearby
      </span>
      {before.map((word) => (
        <button
          key={word}
          type="button"
          onClick={() => onSearch(word)}
          className="rounded-full border-2 border-border bg-surface py-0.5 px-2.5 text-xs font-semibold text-ink cursor-pointer transition-colors duration-150 hover:bg-accent-light shadow-sm"
        >
          {word}
        </button>
      ))}
      <span className="rounded-full bg-accent py-0.5 px-2.5 text-xs font-extrabold text-[var(--text-on-accent)] border border-border shadow-sm">
        {headword}
      </span>
      {after.map((word) => (
        <button
          key={word}
          type="button"
          onClick={() => onSearch(word)}
          className="rounded-full border-2 border-border bg-surface py-0.5 px-2.5 text-xs font-semibold text-ink cursor-pointer transition-colors duration-150 hover:bg-accent-light shadow-sm"
        >
          {word}
        </button>
      ))}
    </div>
  );
}
