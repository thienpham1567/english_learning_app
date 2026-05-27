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
          className="rounded-full border border-border bg-surface py-0.5 px-2.5 text-xs text-text-secondary cursor-pointer transition-colors duration-200 hover:border-accent hover:text-accent"
        >
          {word}
        </button>
      ))}
      <span className="rounded-full bg-accent-muted py-0.5 px-2.5 text-xs font-semibold text-accent">
        {headword}
      </span>
      {after.map((word) => (
        <button
          key={word}
          type="button"
          onClick={() => onSearch(word)}
          className="rounded-full border border-border bg-surface py-0.5 px-2.5 text-xs text-text-secondary cursor-pointer transition-colors duration-200 hover:border-accent hover:text-accent"
        >
          {word}
        </button>
      ))}
    </div>
  );
}
