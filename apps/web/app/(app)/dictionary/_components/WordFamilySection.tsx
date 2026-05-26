"use client";

import { Network } from "lucide-react";
import type { WordFamilyGroup } from "@/lib/schemas/vocabulary";

type WordFamilySectionProps = {
  wordFamily: WordFamilyGroup[] | null;
  onSearch: (word: string) => void;
};

export function WordFamilySection({ wordFamily, onSearch }: WordFamilySectionProps) {
  if (!wordFamily || wordFamily.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">
        <Network className="h-3 w-3" />
        Word Family
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {wordFamily.map((group) => (
          <div key={group.pos} className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{group.pos}</span>
            {group.words.map((word) => (
              <button
                key={word}
                type="button"
                onClick={() => onSearch(word)}
                className="rounded-full bg-surface px-3 py-1 text-[13px] text-text-primary border-2 border-border cursor-pointer transition-all duration-150 hover:bg-accent/10 hover:text-accent hover:border-accent/30"
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
