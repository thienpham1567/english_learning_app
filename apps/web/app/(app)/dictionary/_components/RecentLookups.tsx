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
    <div className="scrollbar-none flex items-center gap-2 overflow-x-auto pb-1">
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-text-muted">
        Recent
      </span>
      {words.map((word) => (
        <button
          key={word}
          type="button"
          onClick={() => onSelect(word)}
          className="shrink-0 rounded-full border border-border bg-surface py-1 px-3 text-xs font-medium text-accent cursor-pointer whitespace-nowrap transition-all duration-150 hover:border-accent hover:bg-accent-light"
        >
          {word}
        </button>
      ))}
    </div>
  );
}
