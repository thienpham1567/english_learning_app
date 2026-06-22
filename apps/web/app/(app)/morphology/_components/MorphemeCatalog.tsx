"use client";

import { CircleCheckBig } from "lucide-react";
import * as m from "motion/react-client";
import type { MorphemeProgressItem } from "@/lib/morphology/schema";
import {
  MORPHEME_TYPE_LABELS,
  MORPHEME_TYPE_ORDER,
  MORPHEMES_BY_TYPE,
  type MorphemeCatalogItem,
} from "../_data/morphemes";

interface MorphemeCatalogProps {
  progress: Record<string, MorphemeProgressItem>;
  onSelect: (item: MorphemeCatalogItem) => void;
}

/** Browseable, grouped morpheme catalog with completion badges. */
export function MorphemeCatalog({ progress, onSelect }: MorphemeCatalogProps) {
  return (
    <div className="flex flex-col gap-6">
      {MORPHEME_TYPE_ORDER.map((type) => (
        <div key={type}>
          <h3 className="text-[12.5px] font-bold text-text-secondary uppercase tracking-wider mb-3">
            {MORPHEME_TYPE_LABELS[type]}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {MORPHEMES_BY_TYPE[type].map((item) => {
              const done = progress[item.id]?.status === "completed";
              return (
                <m.button
                  key={item.id}
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelect(item)}
                  className={`text-left rounded-xl border p-4 bg-surface cursor-pointer transition-colors shadow-sm hover:border-accent ${
                    done ? "border-success/40" : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-accent-active text-lg font-mono">
                      {item.morpheme}
                    </span>
                    {done && <CircleCheckBig size={16} className="text-success" />}
                  </div>
                  <p className="mt-1 m-0 text-[13px] font-semibold text-text-primary leading-snug">
                    {item.gloss}
                  </p>
                  <p className="mt-1 m-0 text-[11.5px] text-text-muted font-medium italic">
                    e.g. {item.example}
                  </p>
                </m.button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
