"use client";

import { Frown, Lightbulb, Loader2, Meh, Smile, Sparkles, Volume2 } from "lucide-react";
import * as m from "motion/react-client";
import { useState } from "react";
import { WordFamilyExplorer } from "@/app/(app)/flashcards/_components/WordFamilyExplorer";
import { Card } from "@/components/ui/card";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { api } from "@/lib/api-client";
import { CEFR_COLORS } from "@/lib/constants/cefr";
import type { DueCard } from "@/lib/flashcard/types";

const CEFR_GRADIENTS: Record<string, string> = {
  A1: "linear-gradient(135deg, color-mix(in srgb, var(--cefr-a1) 6%, var(--surface)), var(--surface))",
  A2: "linear-gradient(135deg, color-mix(in srgb, var(--cefr-a2) 8%, var(--surface)), var(--surface))",
  B1: "linear-gradient(135deg, color-mix(in srgb, var(--cefr-b1) 6%, var(--surface)), var(--surface))",
  B2: "linear-gradient(135deg, color-mix(in srgb, var(--cefr-b2) 8%, var(--surface)), var(--surface))",
  C1: "linear-gradient(135deg, color-mix(in srgb, var(--cefr-c1) 6%, var(--surface)), var(--surface))",
  C2: "linear-gradient(135deg, color-mix(in srgb, var(--cefr-c2) 8%, var(--surface)), var(--surface))",
};

const DEFAULT_GRADIENT = "linear-gradient(135deg, var(--surface-alt), var(--surface))";

type Props = {
  card: DueCard;
  onRate: (quality: number) => void;
  isSubmitting: boolean;
};

export function FlashcardCard({ card, onRate, isSubmitting }: Props) {
  const [isFlipped, setIsFlipped] = useState(false);
  const tts = useTextToSpeech("us");
  const [contextSentences, setContextSentences] = useState<
    Array<{ en: string; vi: string; context: string }>
  >([]);
  const [contextLoading, setContextLoading] = useState(false);

  const handleFlip = () => {
    if (!isFlipped) setIsFlipped(true);
  };

  const firstSense = card.senses[0];
  const levelColor = CEFR_COLORS[card.level ?? ""] ?? "var(--text-muted)";

  return (
    <div className="w-full max-w-[520px] mx-auto flex flex-col items-stretch">
      {/* 3D card layout container */}
      <div onClick={handleFlip} className="cursor-pointer w-full" style={{ perspective: 1200 }}>
        <m.div
          className="relative h-[380px] w-full"
          style={{
            transformStyle: "preserve-3d",
            transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0)",
          }}
        >
          {/* Front Side Card */}
          <Card
            shadowSize="md"
            className="absolute inset-0 flex flex-col items-center justify-center py-10 px-8 rounded-xl"
            style={{
              backfaceVisibility: "hidden",
              border: `1.5px solid ${isFlipped ? "var(--border)" : "color-mix(in srgb, var(--accent) 15%, var(--border))"}`,
              background: CEFR_GRADIENTS[card.level ?? ""] ?? DEFAULT_GRADIENT,
            }}
          >
            {/* Ambient overlay light */}
            <div
              className="absolute w-[200px] h-[200px] rounded-full left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${levelColor}10 0%, transparent 70%)`,
              }}
            />

            <div className="flex items-center gap-2 relative z-[2]">
              {card.level && (
                <span
                  className="text-[11px] font-extrabold bg-surface rounded-lg py-0.5 px-2.5"
                  style={{
                    color: levelColor,
                    border: `1px solid ${levelColor}`,
                  }}
                >
                  {card.level}
                </span>
              )}
              {card.partOfSpeech && (
                <span className="font-bold text-text-muted bg-surface-alt rounded-md text-[11.5px] py-0.5 px-2">
                  {card.partOfSpeech}
                </span>
              )}
            </div>

            <h2 className="mt-5 mb-2 font-black text-center font-display text-text-primary tracking-tight italic relative z-[2] text-[38px]">
              {card.headword}
            </h2>

            {card.phonetic && (
              <span className="text-sm font-semibold font-mono text-text-secondary bg-surface-alt rounded-lg border-2 border-border relative z-[2] py-1 px-3">
                {card.phonetic}
              </span>
            )}

            {/* Speaking audio control */}
            <m.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                tts.speak(card.headword);
              }}
              disabled={tts.isLoading || tts.isSpeaking}
              className="mt-6 inline-flex items-center gap-2 rounded-lg text-accent-active text-[13px] font-bold relative z-[2] py-2 px-5 shadow-sm transition-all duration-200"
              style={{
                border: "1.5px solid color-mix(in srgb, var(--accent) 30%, var(--border))",
                background: tts.isSpeaking ? "var(--accent-light)" : "var(--surface)",
                cursor: tts.isLoading ? "wait" : "pointer",
              }}
            >
              {tts.isLoading ? <Loader2 className="animate-spin" /> : <Volume2 />}
              {tts.isSpeaking ? "Playing..." : "Listen"}
            </m.button>

            <span className="absolute bottom-6 text-xs font-semibold text-text-muted">
              Click card to flip
            </span>
          </Card>

          {/* Back Side Card */}
          <Card
            shadowSize="md"
            className="absolute inset-0 p-6 flex flex-col justify-start overflow-y-auto rounded-xl"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            {/* Vietnamese overview meaning */}
            <div className="text-center text-xl font-extrabold text-accent-active font-display mb-4 pb-3 border-b border-dashed border-border">
              {card.overviewVi}
            </div>

            {firstSense && (
              <div className="flex flex-col gap-3">
                <p className="leading-relaxed m-0 text-text-primary text-[14.5px]">
                  <span className="font-extrabold text-text-secondary">{firstSense.label}:</span>{" "}
                  {firstSense.definitionVi}
                </p>

                {firstSense.examples.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {firstSense.examples.slice(0, 2).map((ex, i) => (
                      <Card
                        key={i}
                        size="sm"
                        bgType="alt"
                        accentColor="accent"
                        accentPosition="left"
                        shadowSize="none"
                        className="py-2.5 px-3.5 gap-0.5 border-l-4"
                      >
                        <div className="font-bold text-text-primary leading-normal text-[13.5px]">
                          {ex.en}
                        </div>
                        <div className="text-xs text-text-muted font-semibold mt-0.5">{ex.vi}</div>
                      </Card>
                    ))}
                  </div>
                )}

                {firstSense.collocations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {firstSense.collocations.slice(0, 4).map((c, i) => (
                      <span
                        key={i}
                        className="font-bold text-success rounded-lg text-[11.5px] py-0.5 px-2.5"
                        style={{
                          background: "var(--success-bg)",
                          border: "1px solid color-mix(in srgb, var(--success) 20%, transparent)",
                        }}
                      >
                        {c.en}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI TOEIC Examples section */}
            {contextSentences.length === 0 && (
              <m.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  if (contextLoading) return;
                  setContextLoading(true);
                  try {
                    const data = await api.post<{
                      sentences: Array<{ en: string; vi: string; context: string }>;
                    }>("/vocabulary/context-sentences", {
                      word: card.headword,
                      partOfSpeech: card.partOfSpeech,
                      level: card.level,
                    });
                    setContextSentences(data.sentences ?? []);
                  } catch {
                    /* ignore */
                  }
                  setContextLoading(false);
                }}
                disabled={contextLoading}
                className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg text-accent-active text-xs font-extrabold transition-all duration-200"
                style={{
                  border: "1.5px solid color-mix(in srgb, var(--accent) 20%, var(--border))",
                  background: "var(--accent-light)",
                  cursor: contextLoading ? "wait" : "pointer",
                }}
              >
                {contextLoading ? (
                  <>
                    <Loader2 className="animate-spin" /> Generating examples...
                  </>
                ) : (
                  <>
                    <Lightbulb /> Show TOEIC Examples
                  </>
                )}
              </m.button>
            )}

            {contextSentences.length > 0 && (
              <div className="flex flex-col gap-2 mt-4">
                <span className="text-[11px] font-extrabold uppercase text-accent-active flex items-center gap-1 tracking-[.1em]">
                  <Lightbulb /> TOEIC Context Examples
                </span>
                {contextSentences.slice(0, 3).map((s, i) => (
                  <Card
                    key={i}
                    size="sm"
                    shadowSize="none"
                    bgType="alt"
                    className="py-2.5 px-3.5 gap-1 border-2 border-border/80"
                  >
                    <div
                      dangerouslySetInnerHTML={{
                        __html: s.en.replace(
                          /\*([^*]+)\*/g,
                          '<strong style="color: var(--accent-active); font-weight: 800;">$1</strong>',
                        ),
                      }}
                      className="text-[13px] leading-relaxed text-text-primary"
                    />
                    <div className="text-text-muted font-semibold mt-1 text-[11.5px]">{s.vi}</div>
                  </Card>
                ))}
              </div>
            )}

            {/* Word Family Tree Explorer */}
            <div className="mt-3">
              <WordFamilyExplorer word={card.headword} />
            </div>
          </Card>
        </m.div>
      </div>

      {/* Spaced Repetition score buttons below the card deck */}
      {isFlipped && <RatingButtons onRate={onRate} isSubmitting={isSubmitting} />}
    </div>
  );
}

const RATINGS = [
  {
    quality: 0,
    label: "Forgot",
    icon: Frown,
    color: "var(--error)",
    bg: "color-mix(in srgb, var(--error) 8%, transparent)",
    border: "color-mix(in srgb, var(--error) 20%, transparent)",
  },
  {
    quality: 2,
    label: "Hard",
    icon: Meh,
    color: "var(--warning)",
    bg: "color-mix(in srgb, var(--warning) 8%, transparent)",
    border: "color-mix(in srgb, var(--warning) 20%, transparent)",
  },
  {
    quality: 3,
    label: "Good",
    icon: Smile,
    color: "var(--accent-active)",
    bg: "var(--accent-light)",
    border: "color-mix(in srgb, var(--accent) 15%, transparent)",
  },
  {
    quality: 5,
    label: "Easy",
    icon: Sparkles,
    color: "var(--success)",
    bg: "color-mix(in srgb, var(--success) 8%, transparent)",
    border: "color-mix(in srgb, var(--success) 20%, transparent)",
  },
] as const;

function RatingButtons({
  onRate,
  isSubmitting,
}: {
  onRate: (q: number) => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="anim-fade-up flex gap-3 mt-6 self-center">
      {RATINGS.map((r) => {
        const IconComponent = r.icon;
        return (
          <m.button
            key={r.quality}
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.94 }}
            disabled={isSubmitting}
            onClick={() => onRate(r.quality)}
            className="flex flex-col items-center gap-1.5 w-[72px] rounded-lg cursor-pointer py-2.5 shadow-sm transition-all duration-200"
            style={{
              background: r.bg,
              border: `1.5px solid ${r.border}`,
              color: r.color,
            }}
          >
            <IconComponent className="h-5 w-5" />
            <span className="text-xs font-extrabold">{r.label}</span>
          </m.button>
        );
      })}
    </div>
  );
}
