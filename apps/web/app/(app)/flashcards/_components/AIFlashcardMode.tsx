"use client";

import { useState, useCallback } from "react";
import {
  ThunderboltOutlined,
  LoadingOutlined,
  SoundOutlined,
  LeftOutlined,
  RightOutlined,
  ReloadOutlined,
  BulbOutlined,
  CheckCircleFilled,
  BookOutlined,
  FormOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import { Tag } from "antd";
import * as m from "motion/react-client";

import { api } from "@/lib/api-client";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";

/* ── Types ── */
type AICard = {
  type: "vocab" | "grammar";
  front: string;
  back: string;
  phonetic?: string;
  partOfSpeech?: string;
  level?: string;
  explanation?: string;
  example: string;
  exampleVi: string;
  toeicTip?: string;
};

type CardType = "mixed" | "vocab" | "grammar";

/* ── TOEIC Topics ── */
const TOEIC_TOPICS = [
  { id: "meetings", label: "Business Meetings", emoji: "🤝" },
  { id: "email", label: "Email & Correspondence", emoji: "📧" },
  { id: "hiring", label: "Hiring & Recruitment", emoji: "👤" },
  { id: "marketing", label: "Marketing & Advertising", emoji: "📊" },
  { id: "finance", label: "Finance & Banking", emoji: "💰" },
  { id: "travel", label: "Travel & Tourism", emoji: "✈️" },
  { id: "office", label: "Office Equipment & Supplies", emoji: "🖨️" },
  { id: "contracts", label: "Contracts & Agreements", emoji: "📝" },
  { id: "training", label: "Training & Development", emoji: "🎓" },
  { id: "customer-service", label: "Customer Service", emoji: "🎧" },
  { id: "shipping", label: "Shipping & Logistics", emoji: "📦" },
  { id: "health", label: "Health & Safety", emoji: "🏥" },
];

const TYPE_OPTIONS: { value: CardType; label: string; icon: React.ReactNode }[] = [
  { value: "mixed", label: "Tổng hợp", icon: <AppstoreOutlined /> },
  { value: "vocab", label: "Từ vựng", icon: <BookOutlined /> },
  { value: "grammar", label: "Ngữ pháp", icon: <FormOutlined /> },
];

const COUNT_OPTIONS = [5, 10, 15, 20];

const LEVEL_COLORS: Record<string, string> = {
  A2: "green",
  B1: "blue",
  B2: "purple",
  C1: "magenta",
};

/* ── Main Component ── */
export function AIFlashcardMode() {
  const [phase, setPhase] = useState<"pick" | "loading" | "study">("pick");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [customTopic, setCustomTopic] = useState("");
  const [cardType, setCardType] = useState<CardType>("mixed");
  const [cardCount, setCardCount] = useState(10);
  const [cards, setCards] = useState<AICard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tts = useTextToSpeech("us");

  const topicLabel =
    selectedTopic === "__custom"
      ? customTopic
      : TOEIC_TOPICS.find((t) => t.id === selectedTopic)?.label ?? "";

  const generate = useCallback(async () => {
    const topic = selectedTopic === "__custom" ? customTopic.trim() : topicLabel;
    if (!topic) return;
    setPhase("loading");
    setError(null);
    try {
      const data = await api.post<{ cards: AICard[] }>("/flashcards/generate", {
        topic,
        type: cardType,
        count: cardCount,
      });
      if (!data.cards || data.cards.length === 0) {
        setError("AI không tạo được flashcard. Thử chủ đề khác.");
        setPhase("pick");
        return;
      }
      setCards(data.cards);
      setCurrentIdx(0);
      setFlipped(false);
      setPhase("study");
    } catch {
      setError("Lỗi kết nối. Vui lòng thử lại.");
      setPhase("pick");
    }
  }, [selectedTopic, customTopic, topicLabel, cardType, cardCount]);

  const goNext = () => {
    if (currentIdx < cards.length - 1) {
      setCurrentIdx((i) => i + 1);
      setFlipped(false);
    }
  };

  const goPrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((i) => i - 1);
      setFlipped(false);
    }
  };

  const resetToTopics = () => {
    setPhase("pick");
    setCards([]);
    setCurrentIdx(0);
    setFlipped(false);
    setSelectedTopic(null);
    setCustomTopic("");
  };

  /* ── PHASE: Topic Picker ── */
  if (phase === "pick") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 600, margin: "0 auto", width: "100%" }}>
        {/* Topic Grid */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <ThunderboltOutlined style={{ color: "var(--accent)", fontSize: 16 }} />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "var(--ink)", fontFamily: "var(--font-display)" }}>
              Chọn chủ đề TOEIC
            </h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: 10 }}>
            {TOEIC_TOPICS.map((topic) => {
              const isSelected = selectedTopic === topic.id;
              return (
                <m.button
                  key={topic.id}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedTopic(isSelected ? null : topic.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 14px",
                    borderRadius: "var(--radius-lg)",
                    border: isSelected
                      ? "1.5px solid var(--accent)"
                      : "1.5px solid var(--border)",
                    background: isSelected
                      ? "var(--accent-light)"
                      : "var(--surface)",
                    cursor: "pointer",
                    textAlign: "left",
                    boxShadow: isSelected ? "0 4px 14px var(--accent-muted)" : "var(--shadow-sm)",
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ fontSize: 20 }}>{topic.emoji}</span>
                  <span style={{
                    fontSize: 12.5,
                    fontWeight: isSelected ? 800 : 600,
                    color: isSelected ? "var(--accent)" : "var(--text-primary)",
                    lineHeight: 1.3,
                  }}>
                    {topic.label}
                  </span>
                </m.button>
              );
            })}
          </div>
        </div>

        {/* Custom topic */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
            Hoặc nhập chủ đề tùy chỉnh:
          </label>
          <input
            value={customTopic}
            onChange={(e) => {
              setCustomTopic(e.target.value);
              if (e.target.value.trim()) setSelectedTopic("__custom");
              else if (selectedTopic === "__custom") setSelectedTopic(null);
            }}
            placeholder="VD: Negotiation Skills, Supply Chain, Real Estate..."
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "var(--radius-lg)",
              border: selectedTopic === "__custom" ? "1.5px solid var(--accent)" : "1.5px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text-primary)",
              fontSize: 14,
              fontWeight: 600,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Type & Count selector */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {/* Type */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
              Loại flashcard
            </label>
            <div style={{ display: "flex", gap: 6 }}>
              {TYPE_OPTIONS.map((opt) => (
                <m.button
                  key={opt.value}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setCardType(opt.value)}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: cardType === opt.value ? "1.5px solid var(--accent)" : "1.5px solid var(--border)",
                    background: cardType === opt.value ? "var(--accent-light)" : "var(--surface)",
                    color: cardType === opt.value ? "var(--accent)" : "var(--text-secondary)",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {opt.icon} {opt.label}
                </m.button>
              ))}
            </div>
          </div>

          {/* Count */}
          <div style={{ minWidth: 140 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
              Số lượng
            </label>
            <div style={{ display: "flex", gap: 6 }}>
              {COUNT_OPTIONS.map((c) => (
                <m.button
                  key={c}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setCardCount(c)}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    borderRadius: 10,
                    border: cardCount === c ? "1.5px solid var(--accent)" : "1.5px solid var(--border)",
                    background: cardCount === c ? "var(--accent-light)" : "var(--surface)",
                    color: cardCount === c ? "var(--accent)" : "var(--text-secondary)",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  {c}
                </m.button>
              ))}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(239, 68, 68, 0.06)", border: "1px solid rgba(239, 68, 68, 0.15)", color: "var(--error)", fontSize: 13, fontWeight: 600 }}>
            {error}
          </div>
        )}

        {/* Generate button */}
        <m.button
          whileHover={{ scale: 1.01, y: -2 }}
          whileTap={{ scale: 0.99 }}
          onClick={generate}
          disabled={!selectedTopic}
          style={{
            padding: "16px 24px",
            borderRadius: "var(--radius-xl)",
            border: "none",
            background: selectedTopic
              ? "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 80%, var(--secondary)))"
              : "var(--border)",
            color: selectedTopic ? "#fff" : "var(--text-muted)",
            fontSize: 15,
            fontWeight: 900,
            cursor: selectedTopic ? "pointer" : "not-allowed",
            boxShadow: selectedTopic ? "0 8px 28px var(--accent-muted)" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            fontFamily: "var(--font-display)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {selectedTopic && (
            <div style={{ position: "absolute", top: "-50%", right: "-10%", width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
          )}
          <ThunderboltOutlined /> Tạo {cardCount} Flashcard bằng AI
        </m.button>
      </div>
    );
  }

  /* ── PHASE: Loading ── */
  if (phase === "loading") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: "60px 24px", maxWidth: 400, margin: "0 auto" }}>
        <m.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--accent-light)", display: "grid", placeItems: "center" }}
        >
          <LoadingOutlined style={{ fontSize: 28, color: "var(--accent)" }} />
        </m.div>
        <div style={{ textAlign: "center" }}>
          <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 900, color: "var(--ink)", fontFamily: "var(--font-display)" }}>
            Đang tạo flashcard...
          </h3>
          <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>
            AI đang sinh {cardCount} flashcard về &quot;{topicLabel}&quot;
          </p>
        </div>
      </div>
    );
  }

  /* ── PHASE: Study ── */
  const card = cards[currentIdx];
  if (!card) return null;

  const isVocab = card.type === "vocab";
  const pct = cards.length > 0 ? Math.round(((currentIdx + 1) / cards.length) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 520, margin: "0 auto", width: "100%" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <m.button
          whileTap={{ scale: 0.95 }}
          onClick={resetToTopics}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          <LeftOutlined style={{ fontSize: 10 }} /> Chọn chủ đề khác
        </m.button>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)" }}>
          <span style={{ color: "var(--accent)" }}>{currentIdx + 1}</span> / {cards.length}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 5, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
        <m.div
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 15 }}
          style={{ height: "100%", background: "linear-gradient(90deg, var(--accent), var(--xp))", borderRadius: 99 }}
        />
      </div>

      {/* 3D Flip Card */}
      <div
        style={{ cursor: "pointer", perspective: 1200, width: "100%" }}
        onClick={() => setFlipped(!flipped)}
      >
        <m.div
          style={{
            position: "relative",
            height: isVocab ? 360 : 400,
            width: "100%",
            transformStyle: "preserve-3d",
            transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0)",
          }}
        >
          {/* Front */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              borderRadius: "var(--radius-xl)",
              border: `1.5px solid color-mix(in srgb, var(--accent) 15%, var(--border))`,
              background: isVocab
                ? "linear-gradient(135deg, color-mix(in srgb, var(--accent) 6%, var(--surface)), var(--surface))"
                : "linear-gradient(135deg, color-mix(in srgb, var(--secondary) 6%, var(--surface)), var(--surface))",
              padding: "40px 28px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--shadow-md)",
            }}
          >
            {/* Ambient glow */}
            <div style={{ position: "absolute", left: "50%", top: "45%", transform: "translate(-50%, -50%)", width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${isVocab ? "var(--accent)" : "var(--secondary)"}10 0%, transparent 70%)`, pointerEvents: "none" }} />

            {/* Type badge */}
            <Tag
              color={isVocab ? "blue" : "purple"}
              style={{ fontSize: 10, fontWeight: 800, borderRadius: 6, margin: "0 0 12px", border: "none" }}
            >
              {isVocab ? "📖 VOCABULARY" : "📐 GRAMMAR"}
            </Tag>

            {/* Tags row */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16, position: "relative", zIndex: 2 }}>
              {isVocab && card.partOfSpeech && (
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", background: "var(--surface-alt)", padding: "2px 8px", borderRadius: 6 }}>
                  {card.partOfSpeech}
                </span>
              )}
              {card.level && (
                <Tag color={LEVEL_COLORS[card.level] ?? "default"} style={{ fontSize: 10.5, fontWeight: 800, borderRadius: 6, margin: 0, border: "none" }}>
                  {card.level}
                </Tag>
              )}
            </div>

            {/* Front text */}
            <h2 style={{
              margin: 0,
              fontSize: isVocab ? 36 : 22,
              fontWeight: 900,
              textAlign: "center",
              fontFamily: "var(--font-display)",
              color: "var(--text-primary)",
              letterSpacing: isVocab ? "-0.02em" : "0",
              fontStyle: isVocab ? "italic" : "normal",
              lineHeight: 1.3,
              position: "relative",
              zIndex: 2,
              maxWidth: "90%",
            }}>
              {card.front}
            </h2>

            {/* Phonetic */}
            {isVocab && card.phonetic && (
              <span style={{
                marginTop: 10,
                fontSize: 14,
                fontFamily: "var(--font-mono)",
                color: "var(--text-secondary)",
                background: "var(--surface-alt)",
                padding: "4px 12px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                position: "relative",
                zIndex: 2,
              }}>
                {card.phonetic}
              </span>
            )}

            {/* TTS button */}
            {isVocab && (
              <m.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  tts.speak(card.front);
                }}
                disabled={tts.isLoading || tts.isSpeaking}
                style={{
                  marginTop: 20,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 18px",
                  borderRadius: 99,
                  border: "1.5px solid color-mix(in srgb, var(--accent) 30%, var(--border))",
                  background: tts.isSpeaking ? "var(--accent-light)" : "var(--surface)",
                  color: "var(--accent)",
                  cursor: tts.isLoading ? "wait" : "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  boxShadow: "var(--shadow-sm)",
                  position: "relative",
                  zIndex: 2,
                }}
              >
                {tts.isLoading ? <LoadingOutlined spin /> : <SoundOutlined />}
                {tts.isSpeaking ? "Đang phát..." : "Nghe phát âm"}
              </m.button>
            )}

            <span style={{ position: "absolute", bottom: 20, fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>
              Nhấn thẻ để lật xem nghĩa
            </span>
          </div>

          {/* Back */}
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
            {/* Vietnamese meaning */}
            <div style={{
              textAlign: "center",
              fontSize: 22,
              fontWeight: 900,
              color: "var(--accent)",
              fontFamily: "var(--font-display)",
              marginBottom: 16,
              borderBottom: "1.5px dashed var(--border)",
              paddingBottom: 14,
            }}>
              {card.back}
            </div>

            {/* Grammar explanation */}
            {!isVocab && card.explanation && (
              <div style={{
                padding: "12px 14px",
                borderRadius: "var(--radius-lg)",
                background: "var(--surface-alt)",
                border: "1px solid var(--border)",
                marginBottom: 12,
              }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
                  📌 Giải thích
                </span>
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: "var(--text-primary)", fontWeight: 500 }}>
                  {card.explanation}
                </p>
              </div>
            )}

            {/* Example */}
            <div style={{
              padding: "12px 14px",
              borderRadius: "var(--radius-lg)",
              background: "var(--surface-alt)",
              borderLeft: "3.5px solid var(--accent)",
              marginBottom: 12,
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.55 }}>
                {card.example}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 600, marginTop: 4 }}>
                {card.exampleVi}
              </div>
            </div>

            {/* TOEIC Tip */}
            {card.toeicTip && (
              <div style={{
                padding: "10px 14px",
                borderRadius: "var(--radius-lg)",
                background: "linear-gradient(135deg, rgba(245, 158, 11, 0.04), rgba(239, 68, 68, 0.02))",
                border: "1px solid rgba(245, 158, 11, 0.15)",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>🎯</span>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "var(--warning)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Mẹo thi TOEIC
                    </span>
                    <p style={{ margin: "4px 0 0", fontSize: 12.5, lineHeight: 1.55, color: "var(--text-primary)", fontWeight: 600 }}>
                      {card.toeicTip}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </m.div>
      </div>

      {/* Navigation buttons */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 8 }}>
        <m.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={goPrev}
          disabled={currentIdx === 0}
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: currentIdx === 0 ? "var(--text-muted)" : "var(--text-primary)",
            cursor: currentIdx === 0 ? "not-allowed" : "pointer",
            display: "grid",
            placeItems: "center",
            fontSize: 16,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <LeftOutlined />
        </m.button>

        <m.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setFlipped(!flipped)}
          style={{
            flex: 1,
            maxWidth: 200,
            height: 48,
            borderRadius: 14,
            border: "1.5px solid color-mix(in srgb, var(--accent) 20%, var(--border))",
            background: "var(--accent-light)",
            color: "var(--accent)",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 800,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {flipped ? "Xem mặt trước" : "Lật thẻ"}
        </m.button>

        <m.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={goNext}
          disabled={currentIdx === cards.length - 1}
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: currentIdx === cards.length - 1 ? "var(--text-muted)" : "var(--text-primary)",
            cursor: currentIdx === cards.length - 1 ? "not-allowed" : "pointer",
            display: "grid",
            placeItems: "center",
            fontSize: 16,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <RightOutlined />
        </m.button>
      </div>

      {/* Completed state */}
      {currentIdx === cards.length - 1 && flipped && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: "16px 20px",
            borderRadius: "var(--radius-xl)",
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.05), var(--surface))",
            border: "1px solid rgba(16, 185, 129, 0.15)",
            textAlign: "center",
          }}
        >
          <CheckCircleFilled style={{ fontSize: 28, color: "var(--success)", marginBottom: 8 }} />
          <h4 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 900, color: "var(--ink)" }}>
            🎉 Hoàn thành {cards.length} flashcard!
          </h4>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>
            Chủ đề: {topicLabel}
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <m.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setCurrentIdx(0);
                setFlipped(false);
              }}
              style={{
                padding: "8px 18px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text-secondary)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <ReloadOutlined /> Ôn lại
            </m.button>
            <m.button
              whileTap={{ scale: 0.95 }}
              onClick={resetToTopics}
              style={{
                padding: "8px 18px",
                borderRadius: 10,
                border: "none",
                background: "var(--accent)",
                color: "#fff",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 800,
                boxShadow: "0 4px 12px var(--accent-muted)",
              }}
            >
              Chủ đề mới
            </m.button>
          </div>
        </m.div>
      )}
    </div>
  );
}
