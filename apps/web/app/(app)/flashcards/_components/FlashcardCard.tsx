"use client";

import { useState } from "react";
import { Button, Card, Flex, Space, Tag, Typography } from "antd";
import type { DueCard } from "@/lib/flashcard/types";

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
  A1: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
  A2: "linear-gradient(135deg, #ecfdf5, #d1fae5)",
  B1: "linear-gradient(135deg, #fffbeb, #fef3c7)",
  B2: "linear-gradient(135deg, #fefce8, #fef9c3)",
  C1: "linear-gradient(135deg, #fff1f2, #ffe4e6)",
  C2: "linear-gradient(135deg, #fdf2f8, #fce7f3)",
};
const DEFAULT_GRADIENT = "linear-gradient(135deg, var(--accent-muted), var(--bg))";

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
            <Text type="secondary" style={{ marginTop: 32, fontSize: 12 }}>
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
          </Card>
        </div>
      </div>

      {/* Rating buttons — only visible when flipped */}
      {isFlipped && <RatingButtons onRate={onRate} isSubmitting={isSubmitting} />}
    </Flex>
  );
}

const RATINGS = [
  { quality: 0, label: "Quên", emoji: "😵", bg: "linear-gradient(135deg, #ef4444, #e11d48)" },
  { quality: 2, label: "Khó", emoji: "😓", bg: "linear-gradient(135deg, #f59e0b, #ea580c)" },
  { quality: 3, label: "Ổn", emoji: "🙂", bg: "linear-gradient(135deg, var(--accent), var(--accent-hover, #5bb8be))" },
  { quality: 5, label: "Dễ", emoji: "🤩", bg: "linear-gradient(135deg, #10b981, #16a34a)" },
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
            color: "#fff",
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
