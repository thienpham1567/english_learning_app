"use client";

import { motion } from "motion/react";
import type { DueCard } from "@/lib/flashcard/types";
import { useState } from "react";

const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  A2: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
  B1: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  B2: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  C1: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
  C2: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
};

type Props = {
  card: DueCard;
  onRate: (quality: number) => void;
  isSubmitting: boolean;
};

export function FlashcardCard({ card, onRate, isSubmitting }: Props) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    if (!isFlipped) setIsFlipped(true);
  };

  const firstSense = card.senses[0];

  return (
    <div className="mx-auto w-full max-w-lg">
      {/* Card container */}
      <div
        className="cursor-pointer [perspective:1200px]"
        onClick={handleFlip}
      >
        <motion.div
          className="relative h-[360px] w-full [transform-style:preserve-3d] max-[720px]:h-[320px]"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Front */}
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-(--border) bg-(--surface) px-8 py-10 shadow-(--shadow-lg) [backface-visibility:hidden]">
            <div className="flex items-center gap-2">
              {card.level && (
                <span
                  className={`rounded px-2 py-0.5 text-[11px] font-semibold ${LEVEL_COLORS[card.level] ?? "bg-gray-50 text-gray-700 ring-1 ring-gray-200"}`}
                >
                  {card.level}
                </span>
              )}
              {card.partOfSpeech && (
                <span className="text-xs italic text-(--text-muted)">
                  {card.partOfSpeech}
                </span>
              )}
            </div>
            <h2 className="mt-4 text-center [font-family:var(--font-display)] text-4xl italic text-(--ink) max-[720px]:text-3xl">
              {card.headword}
            </h2>
            {card.phonetic && (
              <p className="mt-2 text-sm text-(--text-muted) [font-family:var(--font-mono)]">
                {card.phonetic}
              </p>
            )}
            <p className="mt-8 text-xs text-(--text-muted)">
              Nhấn để xem nghĩa
            </p>
          </div>

          {/* Back */}
          <div className="absolute inset-0 flex flex-col overflow-y-auto rounded-2xl border border-(--border) bg-(--surface) px-8 py-8 shadow-(--shadow-lg) [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <p className="text-center text-lg font-semibold text-(--ink)">
              {card.overviewVi}
            </p>

            {firstSense && (
              <div className="mt-5 space-y-3">
                <p className="text-sm leading-relaxed text-(--text-secondary)">
                  <span className="font-medium text-(--ink)">
                    {firstSense.label}:
                  </span>{" "}
                  {firstSense.definitionVi}
                </p>

                {firstSense.examples.length > 0 && (
                  <div className="space-y-1.5">
                    {firstSense.examples.slice(0, 2).map((ex, i) => (
                      <div key={i} className="rounded-lg bg-(--bg-deep) px-3 py-2 text-sm">
                        <p className="font-medium text-(--ink)">{ex.en}</p>
                        <p className="text-xs text-(--text-muted)">{ex.vi}</p>
                      </div>
                    ))}
                  </div>
                )}

                {firstSense.collocations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {firstSense.collocations.slice(0, 4).map((c, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-(--accent-muted) px-2.5 py-0.5 text-[11px] font-medium text-(--accent)"
                      >
                        {c.en}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Rating buttons — only visible when flipped */}
      {isFlipped && (
        <RatingButtons onRate={onRate} isSubmitting={isSubmitting} />
      )}
    </div>
  );
}

const RATINGS = [
  { quality: 0, label: "Quên", emoji: "😵", color: "from-red-500 to-rose-600" },
  { quality: 2, label: "Khó", emoji: "😓", color: "from-amber-500 to-orange-600" },
  { quality: 3, label: "Ổn", emoji: "🙂", color: "from-sky-500 to-blue-600" },
  { quality: 5, label: "Dễ", emoji: "🤩", color: "from-emerald-500 to-green-600" },
] as const;

function RatingButtons({
  onRate,
  isSubmitting,
}: {
  onRate: (q: number) => void;
  isSubmitting: boolean;
}) {
  return (
    <motion.div
      className="mt-6 flex justify-center gap-3"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      {RATINGS.map((r) => (
        <motion.button
          key={r.quality}
          className={`flex flex-col items-center gap-1 rounded-xl bg-linear-to-br ${r.color} px-4 py-3 text-white shadow-(--shadow-sm) transition-transform enabled:hover:-translate-y-0.5 enabled:hover:shadow-(--shadow-md) disabled:opacity-50 max-[720px]:px-3 max-[720px]:py-2`}
          onClick={() => onRate(r.quality)}
          disabled={isSubmitting}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-xl">{r.emoji}</span>
          <span className="text-[11px] font-semibold">{r.label}</span>
        </motion.button>
      ))}
    </motion.div>
  );
}
