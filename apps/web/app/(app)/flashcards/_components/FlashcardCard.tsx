"use client";

import { useState } from "react";
import { Card, Flex, Space, Tag, Typography } from "antd";

import type { DueCard } from "@/lib/flashcard/types";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { api } from "@/lib/api-client";
import { WordFamilyExplorer } from "@/app/(app)/flashcards/_components/WordFamilyExplorer";
import * as m from "motion/react-client";
import { Lightbulb, Loader2, Network, Volume2 } from "lucide-react";

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
  const [contextSentences, setContextSentences] = useState<Array<{ en: string; vi: string; context: string }>>([]);
  const [contextLoading, setContextLoading] = useState(false);

  const handleFlip = () => {
    if (!isFlipped) setIsFlipped(true);
  };

  const firstSense = card.senses[0];
  const levelColor = LEVEL_COLORS[card.level ?? ""] ?? "var(--text-muted)";

  return (
    <Flex vertical align="stretch" style={{ width: "100%", maxWidth: 520, margin: "0 auto" }}>
      {/* 3D card layout container */}
      <div
        style={{
          cursor: "pointer",
          perspective: 1200,
          width: "100%",
        }}
        onClick={handleFlip}
      >
        <m.div
          style={{
            position: "relative",
            height: 380,
            width: "100%",
            transformStyle: "preserve-3d",
            transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0)",
          }}
        >
          {/* Front Side Card */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              borderRadius: "var(--radius-xl)",
              border: `1.5px solid ${isFlipped ? "var(--border)" : "color-mix(in srgb, var(--accent) 15%, var(--border))"}`,
              background: CEFR_GRADIENTS[card.level ?? ""] ?? DEFAULT_GRADIENT,
              padding: "40px 32px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--shadow-md)",
            }}
          >
            {/* Ambient overlay light */}
            <div style={{ position: "absolute", left: "50%", top: "45%", transform: "translate(-50%, -50%)", width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${levelColor}10 0%, transparent 70%)`, pointerEvents: "none" }} />

            <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative", zIndex: 2 }}>
              {card.level && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: levelColor,
                    border: `1px solid ${levelColor}`,
                    background: "var(--surface)",
                    padding: "2px 10px",
                    borderRadius: 99,
                  }}
                >
                  {card.level}
                </span>
              )}
              {card.partOfSpeech && (
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    background: "var(--surface-alt)",
                    padding: "2px 8px",
                    borderRadius: 6,
                  }}
                >
                  {card.partOfSpeech}
                </span>
              )}
            </div>

            <h2
              style={{
                marginTop: 20,
                marginBottom: 8,
                fontSize: 38,
                fontWeight: 900,
                textAlign: "center",
                fontFamily: "var(--font-display)",
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
                fontStyle: "italic",
                position: "relative",
                zIndex: 2,
              }}
            >
              {card.headword}
            </h2>

            {card.phonetic && (
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-secondary)",
                  background: "var(--surface-alt)",
                  padding: "4px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  position: "relative",
                  zIndex: 2,
                }}
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
              style={{
                marginTop: 24,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 20px",
                borderRadius: 99,
                border: "1.5px solid color-mix(in srgb, var(--accent) 30%, var(--border))",
                background: tts.isSpeaking ? "var(--accent-light)" : "var(--surface)",
                color: "var(--accent)",
                cursor: tts.isLoading ? "wait" : "pointer",
                fontSize: 13,
                fontWeight: 700,
                boxShadow: "var(--shadow-sm)",
                transition: "all 0.2s",
                position: "relative",
                zIndex: 2,
              }}
            >
              {tts.isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Volume2 />
              )}
              {tts.isSpeaking ? "Đang phát..." : "Nghe phát âm"}
            </m.button>

            <span
              style={{
                position: "absolute",
                bottom: 24,
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-muted)",
              }}
            >
              Nhấn thẻ để lật xem nghĩa
            </span>
          </div>

          {/* Back Side Card */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              boxShadow: "var(--shadow-md)",
              overflowY: "auto",
            }}
          >
            {/* Vietnamese overview meaning */}
            <div
              style={{
                textAlign: "center",
                fontSize: 20,
                fontWeight: 800,
                color: "var(--accent)",
                fontFamily: "var(--font-display)",
                marginBottom: 16,
                borderBottom: "1.5px dashed var(--border)",
                paddingBottom: 12,
              }}
            >
              {card.overviewVi}
            </div>

            {firstSense && (
              <Flex vertical gap={12}>
                <p style={{ fontSize: 14.5, lineHeight: 1.6, margin: 0, color: "var(--text-primary)" }}>
                  <span style={{ fontWeight: 800, color: "var(--text-secondary)" }}>
                    {firstSense.label}:
                  </span>{" "}
                  {firstSense.definitionVi}
                </p>

                {firstSense.examples.length > 0 && (
                  <Flex vertical gap={8}>
                    {firstSense.examples.slice(0, 2).map((ex, i) => (
                      <div
                        key={i}
                        style={{
                          background: "var(--surface-alt)",
                          borderLeft: "3.5px solid var(--accent)",
                          borderRadius: "var(--radius-md)",
                          padding: "10px 14px",
                        }}
                      >
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.5 }}>
                          {ex.en}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, marginTop: 3 }}>
                          {ex.vi}
                        </div>
                      </div>
                    ))}
                  </Flex>
                )}

                {firstSense.collocations.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                    {firstSense.collocations.slice(0, 4).map((c, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: "var(--success)",
                          background: "var(--success-bg)",
                          border: "1px solid color-mix(in srgb, var(--success) 20%, transparent)",
                          padding: "3px 10px",
                          borderRadius: 99,
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
                    const data = await api.post<{ sentences: Array<{ en: string; vi: string; context: string }> }>(
                      "/vocabulary/context-sentences",
                      { word: card.headword, partOfSpeech: card.partOfSpeech, level: card.level },
                    );
                    setContextSentences(data.sentences ?? []);
                  } catch { /* ignore */ }
                  setContextLoading(false);
                }}
                disabled={contextLoading}
                style={{
                  marginTop: 16,
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "10px 16px",
                  borderRadius: "var(--radius-lg)",
                  border: "1.5px solid color-mix(in srgb, var(--accent) 20%, var(--border))",
                  background: "var(--accent-light)",
                  color: "var(--accent)",
                  cursor: contextLoading ? "wait" : "pointer",
                  fontSize: 12,
                  fontWeight: 800,
                  transition: "all 0.2s",
                }}
              >
                {contextLoading ? (
                  <>
                    <Loader2 className="animate-spin" /> Đang tạo ví dụ...
                  </>
                ) : (
                  <>
                    <Lightbulb /> Xem thêm ví dụ TOEIC
                  </>
                )}
              </m.button>
            )}

            {contextSentences.length > 0 && (
              <Flex vertical gap={8} style={{ marginTop: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--accent)", display: "flex", alignItems: "center", gap: 4 }}>
                  <Lightbulb /> Ví dụ thực tế TOEIC
                </span>
                {contextSentences.slice(0, 3).map((s, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "var(--radius-lg)",
                      background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 4%, var(--surface)), var(--surface-alt))",
                      border: "1px solid color-mix(in srgb, var(--accent) 12%, var(--border))",
                    }}
                  >
                    <div
                      style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-primary)" }}
                      dangerouslySetInnerHTML={{
                        __html: s.en.replace(
                          /\*([^*]+)\*/g,
                          '<strong style="color: var(--accent); font-weight: 800;">$1</strong>',
                        ),
                      }}
                    />
                    <div style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 600, marginTop: 4 }}>
                      {s.vi}
                    </div>
                  </div>
                ))}
              </Flex>
            )}

            {/* Word Family Tree Explorer */}
            <div style={{ marginTop: 12 }}>
              <WordFamilyExplorer word={card.headword} />
            </div>
          </div>
        </m.div>
      </div>

      {/* Spaced Repetition score buttons below the card deck */}
      {isFlipped && (
        <RatingButtons onRate={onRate} isSubmitting={isSubmitting} />
      )}
    </Flex>
  );
}

const RATINGS = [
  { quality: 0, label: "Quên", emoji: "😵", color: "var(--error)", bg: "rgba(239, 68, 68, 0.08)", border: "rgba(239, 68, 68, 0.2)" },
  { quality: 2, label: "Khó", emoji: "😓", color: "var(--warning)", bg: "rgba(245, 158, 11, 0.08)", border: "rgba(245, 158, 11, 0.2)" },
  { quality: 3, label: "Ổn", emoji: "🙂", color: "var(--accent)", bg: "var(--accent-light)", border: "color-mix(in srgb, var(--accent) 15%, transparent)" },
  { quality: 5, label: "Dễ", emoji: "🤩", color: "var(--success)", bg: "rgba(16, 185, 129, 0.08)", border: "rgba(16, 185, 129, 0.2)" },
] as const;

function RatingButtons({
  onRate,
  isSubmitting,
}: {
  onRate: (q: number) => void;
  isSubmitting: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        marginTop: 24,
        alignSelf: "center",
      }}
      className="anim-fade-up"
    >
      {RATINGS.map((r, idx) => (
        <m.button
          key={r.quality}
          whileHover={{ scale: 1.06, y: -2 }}
          whileTap={{ scale: 0.94 }}
          disabled={isSubmitting}
          onClick={() => onRate(r.quality)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            width: 72,
            padding: "10px 0",
            borderRadius: "var(--radius-lg)",
            background: r.bg,
            border: `1.5px solid ${r.border}`,
            color: r.color,
            boxShadow: "var(--shadow-sm)",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          <span style={{ fontSize: 22 }}>{r.emoji}</span>
          <span style={{ fontSize: 12, fontWeight: 800 }}>{r.label}</span>
        </m.button>
      ))}
    </div>
  );
}
