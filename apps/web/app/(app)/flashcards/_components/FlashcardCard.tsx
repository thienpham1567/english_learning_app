"use client";

import { useState } from "react";
import { Button, Card, Flex, Space, Tag, Typography } from "antd";
import { SoundOutlined, LoadingOutlined, BulbOutlined } from "@ant-design/icons";
import type { DueCard } from "@/lib/flashcard/types";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { api } from "@/lib/api-client";
import { WordFamilyExplorer } from "@/app/(app)/flashcards/_components/WordFamilyExplorer";

const { Title, Text, Paragraph } = Typography;

const LEVEL_COLORS: Record<string, string> = {
  A1: "green",
  A2: "cyan",
  B1: "blue",
  B2: "gold",
  C1: "orange",
  C2: "volcano",
};

const CEFR_GRADIENTS: Record<string, string> = {
  A1: "linear-gradient(135deg, color-mix(in srgb, var(--success) 6%, var(--surface)), color-mix(in srgb, var(--success) 12%, var(--surface)))",
  A2: "linear-gradient(135deg, color-mix(in srgb, var(--success) 8%, var(--surface)), color-mix(in srgb, var(--success) 14%, var(--surface)))",
  B1: "linear-gradient(135deg, color-mix(in srgb, var(--xp) 6%, var(--surface)), color-mix(in srgb, var(--xp) 12%, var(--surface)))",
  B2: "linear-gradient(135deg, color-mix(in srgb, var(--xp) 8%, var(--surface)), color-mix(in srgb, var(--xp) 14%, var(--surface)))",
  C1: "linear-gradient(135deg, color-mix(in srgb, var(--error) 6%, var(--surface)), color-mix(in srgb, var(--error) 10%, var(--surface)))",
  C2: "linear-gradient(135deg, color-mix(in srgb, var(--secondary) 6%, var(--surface)), color-mix(in srgb, var(--secondary) 10%, var(--surface)))",
};
const DEFAULT_GRADIENT = "linear-gradient(135deg, var(--accent-muted), var(--bg))";

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

  return (
    <Flex vertical align="center" style={{ width: "100%", maxWidth: 520, margin: "0 auto" }}>
      {/* Card container */}
      <div style={{ cursor: "pointer", perspective: 1200, width: "100%" }} onClick={handleFlip}>
        <div
          style={{
            position: "relative",
            height: 360,
            width: "100%",
            transformStyle: "preserve-3d",
            transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0)",
          }}
        >
          {/* Front */}
          <Card
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              boxShadow: "var(--shadow-lg)",
              background: CEFR_GRADIENTS[card.level ?? ""] ?? DEFAULT_GRADIENT,
            }}
            styles={{
              body: {
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                padding: "40px 32px",
              },
            }}
          >
            <Space size={8}>
              {card.level && <Tag color={LEVEL_COLORS[card.level] ?? "default"}>{card.level}</Tag>}
              {card.partOfSpeech && (
                <Text type="secondary" italic style={{ fontSize: 12 }}>
                  {card.partOfSpeech}
                </Text>
              )}
            </Space>
            <Title
              level={2}
              style={{
                marginTop: 16,
                textAlign: "center",
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: 36,
              }}
            >
              {card.headword}
            </Title>
            {card.phonetic && (
              <Text type="secondary" style={{ marginTop: 8, fontFamily: "var(--font-mono)" }}>
                {card.phonetic}
              </Text>
            )}
            {/* 🎵 Audio TTS Button */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); tts.speak(card.headword); }}
              disabled={tts.isLoading || tts.isSpeaking}
              aria-label={`Phát âm ${card.headword}`}
              style={{
                marginTop: 16,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "8px 20px",
                borderRadius: 99,
                border: "1.5px solid color-mix(in srgb, var(--accent) 30%, var(--border))",
                background: tts.isSpeaking
                  ? "color-mix(in srgb, var(--accent) 12%, var(--surface))"
                  : "color-mix(in srgb, var(--accent) 5%, var(--surface))",
                color: "var(--accent)",
                cursor: tts.isLoading ? "wait" : "pointer",
                fontSize: 13,
                fontWeight: 600,
                transition: "all 0.2s",
              }}
            >
              {tts.isLoading ? (
                <LoadingOutlined spin style={{ fontSize: 14 }} />
              ) : (
                <SoundOutlined style={{ fontSize: 14 }} />
              )}
              {tts.isSpeaking ? "Đang phát..." : "Phát âm"}
            </button>
            <Text type="secondary" style={{ marginTop: 16, fontSize: 12 }}>
              Nhấn để xem nghĩa
            </Text>
          </Card>

          {/* Back */}
          <Card
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              boxShadow: "var(--shadow-lg)",
              overflow: "auto",
            }}
            styles={{ body: { padding: 32 } }}
          >
            <Paragraph strong style={{ textAlign: "center", fontSize: 18 }}>
              {card.overviewVi}
            </Paragraph>

            {firstSense && (
              <Flex vertical gap={12} style={{ marginTop: 20 }}>
                <Paragraph style={{ fontSize: 14, lineHeight: 1.6 }}>
                  <Text strong>{firstSense.label}:</Text> {firstSense.definitionVi}
                </Paragraph>

                {firstSense.examples.length > 0 && (
                  <Flex vertical gap={6}>
                    {firstSense.examples.slice(0, 2).map((ex, i) => (
                      <Card
                        key={i}
                        size="small"
                        style={{ background: "var(--bg-deep)", border: "none" }}
                      >
                        <Text strong style={{ fontSize: 14 }}>
                          {ex.en}
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {ex.vi}
                        </Text>
                      </Card>
                    ))}
                  </Flex>
                )}

                {firstSense.collocations.length > 0 && (
                  <Space wrap size={6}>
                    {firstSense.collocations.slice(0, 4).map((c, i) => (
                      <Tag key={i} color="green" variant="outlined" style={{ borderRadius: 999 }}>
                        {c.en}
                      </Tag>
                    ))}
                  </Space>
                )}
              </Flex>
            )}

            {/* AI Context Sentences */}
            {contextSentences.length === 0 && (
              <button
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
                  marginTop: 12,
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "9px 16px",
                  borderRadius: 10,
                  border: "1.5px solid color-mix(in srgb, var(--accent) 20%, var(--border))",
                  background: "color-mix(in srgb, var(--accent) 4%, var(--surface))",
                  color: "var(--accent)",
                  cursor: contextLoading ? "wait" : "pointer",
                  fontSize: 12,
                  fontWeight: 700,
                  transition: "all 0.2s",
                }}
              >
                {contextLoading ? (
                  <><LoadingOutlined spin style={{ fontSize: 12 }} /> Đang tạo ví dụ...</>
                ) : (
                  <><BulbOutlined style={{ fontSize: 12 }} /> Xem thêm ví dụ TOEIC</>
                )}
              </button>
            )}

            {contextSentences.length > 0 && (
              <Flex vertical gap={6} style={{ marginTop: 12 }}>
                <Text style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--accent)" }}>
                  💡 Ví dụ TOEIC
                </Text>
                {contextSentences.slice(0, 5).map((s, i) => (
                  <Card
                    key={i}
                    size="small"
                    style={{
                      background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 4%, var(--surface)), var(--bg-deep))",
                      border: "1px solid color-mix(in srgb, var(--accent) 10%, var(--border))",
                    }}
                  >
                    <Text style={{ fontSize: 13, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: s.en.replace(/\*([^*]+)\*/g, '<strong style="color: var(--accent)">$1</strong>') }} />
                    <br />
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {s.vi}
                    </Text>
                    {s.context && (
                      <Tag color="blue" style={{ fontSize: 9, borderRadius: 99, marginLeft: 6 }}>{s.context}</Tag>
                    )}
                  </Card>
                ))}
              </Flex>
            )}

            {/* Word Family Explorer */}
            <WordFamilyExplorer word={card.headword} />
          </Card>
        </div>
      </div>

      {/* Rating buttons — only visible when flipped */}
      {isFlipped && <RatingButtons onRate={onRate} isSubmitting={isSubmitting} />}
    </Flex>
  );
}

const RATINGS = [
  { quality: 0, label: "Quên", emoji: "😵", bg: "linear-gradient(135deg, var(--error), color-mix(in srgb, var(--error) 80%, black))" },
  { quality: 2, label: "Khó", emoji: "😓", bg: "linear-gradient(135deg, var(--warning), color-mix(in srgb, var(--warning) 80%, black))" },
  { quality: 3, label: "Ổn", emoji: "🙂", bg: "linear-gradient(135deg, var(--accent), var(--accent-hover))" },
  { quality: 5, label: "Dễ", emoji: "🤩", bg: "linear-gradient(135deg, var(--success), color-mix(in srgb, var(--success) 80%, black))" },
] as const;

function RatingButtons({
  onRate,
  isSubmitting,
}: {
  onRate: (q: number) => void;
  isSubmitting: boolean;
}) {
  return (
    <Space size={12} className="anim-fade-up" style={{ marginTop: 24 }}>
      {RATINGS.map((r) => (
        <Button
          key={r.quality}
          type="text"
          disabled={isSubmitting}
          onClick={() => onRate(r.quality)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            height: "auto",
            borderRadius: "var(--radius)",
            background: r.bg,
            padding: "12px 16px",
            color: "var(--text-on-accent)",
            boxShadow: "var(--shadow-sm)",
            border: "none",
          }}
        >
          <span style={{ fontSize: 20 }}>{r.emoji}</span>
          <span style={{ fontSize: 11, fontWeight: 600 }}>{r.label}</span>
        </Button>
      ))}
    </Space>
  );
}
