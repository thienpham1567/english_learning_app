"use client";

type NearbyWordsBarProps = {
  words: string[];
  headword: string;
  onSearch: (word: string) => void;
};

export function NearbyWordsBar({ words, headword, onSearch }: NearbyWordsBarProps) {
  if (words.length === 0) return null;

  // Split words into before/after groups around the headword's alphabetical position.
  // The server returns: [before_0, before_1, ..., after_0, after_1, ...]
  // We insert the headword marker between the two halves.
  const half = Math.floor(words.length / 2);
  const before = words.slice(0, half);
  const after = words.slice(half);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mr-1">
        Nearby
      </span>
      {before.map((word) => (
        <button
          key={word}
          type="button"
          onClick={() => onSearch(word)}
          className="rounded-full border border-[var(--border)] bg-white/60 px-2.5 py-0.5 text-xs text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          {word}
        </button>
      ))}
      <span className="rounded-full bg-[rgba(196,109,46,0.1)] px-2.5 py-0.5 text-xs font-semibold text-[var(--accent)]">
        {headword}
      </span>
      {after.map((word) => (
        <button
          key={word}
          type="button"
          onClick={() => onSearch(word)}
          className="rounded-full border border-[var(--border)] bg-white/60 px-2.5 py-0.5 text-xs text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          {word}
        </button>
      ))}
    </div>
  );
}
