"use client";

import { Card, Flex, Space, Tag, Typography } from "antd";
import { Frown, Lightbulb, Loader2, Meh, Network, Smile, Sparkles, Volume2 } from "lucide-react";
import * as m from "motion/react-client";
import { useState } from "react";
import { WordFamilyExplorer } from "@/app/(app)/flashcards/_components/WordFamilyExplorer";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { api } from "@/lib/api-client";
import type { DueCard } from "@/lib/flashcard/types";

const { Title, Text, Paragraph } = Typography;

const LEVEL_COLORS: Record<string, string> = {
  A1: "var(--success)",
  A2: "var(--success)",
  B1: "var(--accent)",
  B2: "var(--accent)",
  C1: "var(--error)",
  C2: "var(--error)",
};

const CEFR_GRADIENTS: Record<string, string> = {
  A1: "linear-gradient(135deg, color-mix(in srgb, var(--success) 6%, var(--surface)), var(--surface))",
  A2: "linear-gradient(135deg, color-mix(in srgb, var(--success) 8%, var(--surface)), var(--surface))",
  B1: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 6%, var(--surface)), var(--surface))",
  B2: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 8%, var(--surface)), var(--surface))",
  C1: "linear-gradient(135deg, color-mix(in srgb, var(--error) 6%, var(--surface)), var(--surface))",
  C2: "linear-gradient(135deg, color-mix(in srgb, var(--error) 8%, var(--surface)), var(--surface))",
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
  const levelColor = LEVEL_COLORS[card.level ?? ""] ?? "var(--text-muted)";

  return (
    <Flex vertical align="stretch" className="w-full w-[520px] mx-auto">
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
          <div
            className="absolute rounded-(--radius-xl) flex flex-col items-center justify-center"
            style={{
              inset: 0,
              backfaceVisibility: "hidden",
              border: `1.5px solid ${isFlipped ? "var(--border)" : "color-mix(in srgb, var(--accent) 15%, var(--border))"}`,
              background: CEFR_GRADIENTS[card.level ?? ""] ?? DEFAULT_GRADIENT,
              padding: "40px 32px",
              boxShadow: "var(--shadow-md)",
            }}
          >
            {/* Ambient overlay light */}
            <div
              className="absolute w-[200px] h-[200px] rounded-full"
              style={{
                left: "50%",
                top: "45%",
                transform: "translate(-50%, -50%)",
                background: `radial-gradient(circle, ${levelColor}10 0%, transparent 70%)`,
                pointerEvents: "none",
              }}
            />

            <div className="flex items-center gap-2 relative" style={{ zIndex: 2 }}>
              {card.level && (
                <span
                  className="text-[11px] font-extrabold bg-(--surface) rounded-full"
                  style={{
                    color: levelColor,
                    border: `1px solid ${levelColor}`,
                    padding: "2px 10px",
                  }}
                >
                  {card.level}
                </span>
              )}
              {card.partOfSpeech && (
                <span
                  className="font-bold text-text-muted bg-surface-alt rounded-md"
                  style={{ fontSize: 11.5, padding: "2px 8px" }}
                >
                  {card.partOfSpeech}
                </span>
              )}
            </div>

            <h2
              className="mt-5 mb-2 font-black text-center font-display text-text-primary tracking-tight italic relative"
              style={{ fontSize: 38, zIndex: 2 }}
            >
              {card.headword}
            </h2>

            {card.phonetic && (
              <span
                className="text-sm font-semibold font-mono text-text-secondary bg-surface-alt rounded-lg border-2 border-border relative"
                style={{ padding: "4px 12px", zIndex: 2 }}
              >
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
              className="mt-6 items-center gap-2 rounded-full text-accent text-[13px] font-bold relative"
              style={{
                display: "inline-flex",
                padding: "8px 20px",
                border: "1.5px solid color-mix(in srgb, var(--accent) 30%, var(--border))",
                background: tts.isSpeaking ? "var(--accent-light)" : "var(--surface)",
                cursor: tts.isLoading ? "wait" : "pointer",
                boxShadow: "var(--shadow-sm)",
                transition: "all 0.2s",
                zIndex: 2,
              }}
            >
              {tts.isLoading ? <Loader2 className="animate-spin" /> : <Volume2 />}
              {tts.isSpeaking ? "Playing..." : "Listen"}
            </m.button>

            <span className="absolute text-xs font-semibold text-text-muted" style={{ bottom: 24 }}>
              Click card to flip
            </span>
          </div>

          {/* Back Side Card */}
          <div
            className="absolute rounded-(--radius-xl) border-2 border-border bg-(--surface) p-6 flex flex-col justify-start overflow-y-auto"
            style={{
              inset: 0,
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            {/* Vietnamese overview meaning */}
            <div
              className="text-center text-xl font-extrabold text-accent font-display mb-4 pb-3"
              style={{ borderBottom: "1.5px dashed var(--border)" }}
            >
              {card.overviewVi}
            </div>

            {firstSense && (
              <Flex vertical gap={12}>
                <p className="leading-relaxed m-0 text-text-primary" style={{ fontSize: 14.5 }}>
                  <span className="font-extrabold text-text-secondary">{firstSense.label}:</span>{" "}
                  {firstSense.definitionVi}
                </p>

                {firstSense.examples.length > 0 && (
                  <Flex vertical gap={8}>
                    {firstSense.examples.slice(0, 2).map((ex, i) => (
                      <div
                        key={i}
                        className="bg-surface-alt"
                        style={{
                          borderLeft: "3.5px solid var(--accent)",
                          borderRadius: "var(--radius-md)",
                          padding: "10px 14px",
                        }}
                      >
                        <div
                          className="font-bold text-text-primary leading-normal"
                          style={{ fontSize: 13.5 }}
                        >
                          {ex.en}
                        </div>
                        <div
                          className="text-xs text-text-muted font-semibold"
                          style={{ marginTop: 3 }}
                        >
                          {ex.vi}
                        </div>
                      </div>
                    ))}
                  </Flex>
                )}

                {firstSense.collocations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {firstSense.collocations.slice(0, 4).map((c, i) => (
                      <span
                        key={i}
                        className="font-bold text-emerald-500 rounded-full"
                        style={{
                          fontSize: 11.5,
                          background: "var(--success-bg)",
                          border: "1px solid color-mix(in srgb, var(--success) 20%, transparent)",
                          padding: "3px 10px",
                        }}
                      >
                        {c.en}
                      </span>
                    ))}
                  </div>
                )}
              </Flex>
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
                className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-(--radius-lg) text-accent text-xs font-extrabold"
                style={{
                  border: "1.5px solid color-mix(in srgb, var(--accent) 20%, var(--border))",
                  background: "var(--accent-light)",
                  cursor: contextLoading ? "wait" : "pointer",
                  transition: "all 0.2s",
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
              <Flex vertical gap={8} className="mt-4">
                <span
                  className="text-[11px] font-extrabold uppercase text-accent flex items-center gap-1"
                  style={{ letterSpacing: ".1em" }}
                >
                  <Lightbulb /> TOEIC Context Examples
                </span>
                {contextSentences.slice(0, 3).map((s, i) => (
                  <div
                    key={i}
                    className="rounded-(--radius-lg)"
                    style={{
                      padding: "10px 14px",
                      background:
                        "linear-gradient(135deg, color-mix(in srgb, var(--accent) 4%, var(--surface)), var(--surface-alt))",
                      border: "1px solid color-mix(in srgb, var(--accent) 12%, var(--border))",
                    }}
                  >
                    <div
                      dangerouslySetInnerHTML={{
                        __html: s.en.replace(
                          /\*([^*]+)\*/g,
                          '<strong style="color: var(--accent); font-weight: 800;">$1</strong>',
                        ),
                      }}
                      className="text-[13px] leading-relaxed text-text-primary"
                    />
                    <div className="text-text-muted font-semibold mt-1" style={{ fontSize: 11.5 }}>
                      {s.vi}
                    </div>
                  </div>
                ))}
              </Flex>
            )}

            {/* Word Family Tree Explorer */}
            <div className="mt-3">
              <WordFamilyExplorer word={card.headword} />
            </div>
          </div>
        </m.div>
      </div>

      {/* Spaced Repetition score buttons below the card deck */}
      {isFlipped && <RatingButtons onRate={onRate} isSubmitting={isSubmitting} />}
    </Flex>
  );
}

const RATINGS = [
  {
    quality: 0,
    label: "Forgot",
    icon: Frown,
    color: "var(--error)",
    bg: "rgba(239, 68, 68, 0.08)",
    border: "rgba(239, 68, 68, 0.2)",
  },
  {
    quality: 2,
    label: "Hard",
    icon: Meh,
    color: "var(--warning)",
    bg: "rgba(245, 158, 11, 0.08)",
    border: "rgba(245, 158, 11, 0.2)",
  },
  {
    quality: 3,
    label: "Good",
    icon: Smile,
    color: "var(--accent)",
    bg: "var(--accent-light)",
    border: "color-mix(in srgb, var(--accent) 15%, transparent)",
  },
  {
    quality: 5,
    label: "Easy",
    icon: Sparkles,
    color: "var(--success)",
    bg: "rgba(16, 185, 129, 0.08)",
    border: "rgba(16, 185, 129, 0.2)",
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
    <div className="anim-fade-up flex gap-3 mt-6" style={{ alignSelf: "center" }}>
      {RATINGS.map((r, idx) => {
        const IconComponent = r.icon;
        return (
          <m.button
            key={r.quality}
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.94 }}
            disabled={isSubmitting}
            onClick={() => onRate(r.quality)}
            className="flex flex-col items-center gap-1.5 w-[72px] rounded-(--radius-lg) cursor-pointer"
            style={{
              padding: "10px 0",
              background: r.bg,
              border: `1.5px solid ${r.border}`,
              color: r.color,
              boxShadow: "var(--shadow-sm)",
              transition: "all 0.2s",
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
