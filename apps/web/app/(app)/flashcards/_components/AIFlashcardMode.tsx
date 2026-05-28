"use client";

import {
  AlertTriangle,
  BookOpen,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutGrid,
  Lightbulb,
  Loader2,
  Pin,
  RefreshCw,
  Target,
  Trash2,
  Volume2,
  Zap,
} from "lucide-react";
import * as m from "motion/react-client";
import { useCallback, useEffect, useState } from "react";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { api } from "@/lib/api-client";

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
  { value: "mixed", label: "Mixed", icon: <LayoutGrid /> },
  { value: "vocab", label: "Vocabulary", icon: <BookOpen /> },
  { value: "grammar", label: "Grammar", icon: <ClipboardList /> },
];

const COUNT_OPTIONS = [5, 10, 15, 20];

const LEVEL_COLORS: Record<string, string> = {
  A2: "var(--success)",
  B1: "var(--accent-active)",
  B2: "var(--tertiary, #8B5CF6)",
  C1: "var(--error)",
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
  const [errorFlashcards, setErrorFlashcards] = useState<AICard[]>([]);

  // Load error-sourced flashcards from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("error-flashcards");
      if (stored) {
        const parsed = JSON.parse(stored) as AICard[];
        setErrorFlashcards(parsed);
      }
    } catch {
      // Ignore
    }
  }, []);

  const clearErrorFlashcards = useCallback(() => {
    localStorage.removeItem("error-flashcards");
    setErrorFlashcards([]);
  }, []);

  const studyErrorDeck = useCallback(() => {
    if (errorFlashcards.length === 0) return;
    setCards(errorFlashcards);
    setCurrentIdx(0);
    setFlipped(false);
    setPhase("study");
  }, [errorFlashcards]);

  const tts = useTextToSpeech("us");

  const topicLabel =
    selectedTopic === "__custom"
      ? customTopic
      : (TOEIC_TOPICS.find((t) => t.id === selectedTopic)?.label ?? "");

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
        setError("AI could not generate flashcards. Please try another topic.");
        setPhase("pick");
        return;
      }
      setCards(data.cards);
      setCurrentIdx(0);
      setFlipped(false);
      setPhase("study");
    } catch {
      setError("Connection error. Please try again.");
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
      <div className="flex flex-col gap-5 w-full max-w-[600px] mx-auto">
        {/* Error Flashcard Deck */}
        {errorFlashcards.length > 0 && (
          <m.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border-2 border-amber-500/25 overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(245, 158, 11, 0.04), var(--surface))",
            }}
          >
            <div className="px-4 py-3.5 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg grid place-items-center shrink-0"
                style={{ background: "linear-gradient(135deg, var(--warning), var(--error))" }}
              >
                <AlertTriangle size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="m-0 text-sm font-black text-ink">Error Review Deck</h4>
                <p className="m-0 text-xs text-text-muted font-medium">
                  {errorFlashcards.length} flashcard{errorFlashcards.length > 1 ? "s" : ""} from
                  your mistakes
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <m.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={studyErrorDeck}
                  className="flex items-center gap-1.5 py-2 px-4 rounded-lg border-none text-xs font-extrabold cursor-pointer text-white shadow-sm"
                  style={{ background: "linear-gradient(135deg, var(--warning), var(--error))" }}
                >
                  <Zap size={12} /> Study Now
                </m.button>
                <m.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearErrorFlashcards}
                  className="w-8 h-8 grid place-items-center rounded-lg border-2 border-border bg-surface text-text-muted cursor-pointer text-xs hover:text-error transition-colors"
                  title="Clear error deck"
                >
                  <Trash2 size={13} />
                </m.button>
              </div>
            </div>
          </m.div>
        )}

        {/* Topic Grid */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="text-accent text-base" />
            <h3 className="m-0 text-base font-black text-ink font-display">Choose a TOEIC Topic</h3>
          </div>

          <div className="grid gap-2.5 grid-cols-[repeat(auto-fill,minmax(155px,1fr))]">
            {TOEIC_TOPICS.map((topic) => {
              const isSelected = selectedTopic === topic.id;
              return (
                <m.button
                  key={topic.id}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedTopic(isSelected ? null : topic.id)}
                  className={`flex items-center gap-2.5 rounded-lg cursor-pointer text-left py-3 px-3.5 transition-all duration-150 ${
                    isSelected
                      ? "border-[1.5px] border-accent bg-accent-light shadow-[0_4px_14px_var(--accent-muted)]"
                      : "border-[1.5px] border-border bg-surface shadow-sm"
                  }`}
                >
                  <span className="text-xl">{topic.emoji}</span>
                  <span
                    className={`text-[12.5px] leading-snug ${
                      isSelected ? "font-extrabold text-ink" : "font-semibold text-text-primary"
                    }`}
                  >
                    {topic.label}
                  </span>
                </m.button>
              );
            })}
          </div>
        </div>

        {/* Custom topic */}
        <div>
          <label className="text-xs font-bold text-text-secondary block mb-1.5">
            Or enter a custom topic:
          </label>
          <input
            value={customTopic}
            onChange={(e) => {
              setCustomTopic(e.target.value);
              if (e.target.value.trim()) setSelectedTopic("__custom");
              else if (selectedTopic === "__custom") setSelectedTopic(null);
            }}
            placeholder="e.g. Negotiation Skills, Supply Chain, Real Estate..."
            className={`w-full py-3 px-4 rounded-lg bg-surface text-text-primary text-sm font-semibold outline-none box-border ${
              selectedTopic === "__custom"
                ? "border-[1.5px] border-accent"
                : "border-[1.5px] border-border"
            }`}
          />
        </div>

        {/* Type & Count selector */}
        <div className="flex gap-3 flex-wrap">
          {/* Type */}
          <div className="flex-1 min-w-[200px]">
            <label className="text-[11px] font-bold text-text-muted uppercase block mb-1.5 tracking-[0.06em]">
              Flashcard Type
            </label>
            <div className="flex gap-1.5">
              {TYPE_OPTIONS.map((opt) => (
                <m.button
                  key={opt.value}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setCardType(opt.value)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 cursor-pointer text-xs font-bold rounded-[10px] ${
                    cardType === opt.value
                      ? "border-[1.5px] border-accent bg-accent-light text-ink font-extrabold"
                      : "border-[1.5px] border-border bg-surface text-text-secondary"
                  }`}
                >
                  {opt.icon} {opt.label}
                </m.button>
              ))}
            </div>
          </div>

          {/* Count */}
          <div className="w-[140px]">
            <label className="text-[11px] font-bold text-text-muted uppercase block mb-1.5 tracking-[0.06em]">
              Quantity
            </label>
            <div className="flex gap-1.5">
              {COUNT_OPTIONS.map((c) => (
                <m.button
                  key={c}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setCardCount(c)}
                  className={`flex-1 cursor-pointer text-[13px] font-extrabold py-2 rounded-[10px] ${
                    cardCount === c
                      ? "border-[1.5px] border-accent bg-accent-light text-ink"
                      : "border-[1.5px] border-border bg-surface text-text-secondary"
                  }`}
                >
                  {c}
                </m.button>
              ))}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="text-destructive text-[13px] font-semibold py-2.5 px-3.5 rounded-[10px] bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.15)]">
            {error}
          </div>
        )}

        {/* Generate button */}
        <m.button
          whileHover={{ scale: 1.01, y: -2 }}
          whileTap={{ scale: 0.99 }}
          onClick={generate}
          disabled={!selectedTopic}
          className={`py-4 px-6 rounded-xl border-none text-[15px] font-black flex items-center justify-center gap-2.5 font-display relative overflow-hidden ${
            selectedTopic
              ? "cursor-pointer text-white shadow-[0_8px_28px_var(--accent-muted)]"
              : "cursor-not-allowed text-text-muted"
          }`}
          style={{
            background: selectedTopic
              ? "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 80%, var(--secondary)))"
              : "var(--border)",
          }}
        >
          {selectedTopic && (
            <div className="absolute w-[120px] h-[120px] rounded-full -top-1/2 -right-[10%] bg-white/[0.06] pointer-events-none" />
          )}
          <Zap /> Generate {cardCount} AI Flashcards
        </m.button>
      </div>
    );
  }

  /* ── PHASE: Loading ── */
  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center gap-5 max-w-[400px] mx-auto py-15 px-6">
        <m.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-full grid place-items-center bg-accent-light"
        >
          <Loader2 className="animate-spin text-accent" size={28} />
        </m.div>
        <div className="text-center">
          <h3 className="text-lg font-black text-ink font-display m-0 mb-1.5">
            Generating flashcards...
          </h3>
          <p className="m-0 text-sm text-text-secondary font-medium">
            AI is generating {cardCount} flashcards for &quot;{topicLabel}&quot;
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
    <div className="flex flex-col gap-4 w-full max-w-[520px] mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <m.button
          whileTap={{ scale: 0.95 }}
          onClick={resetToTopics}
          className="flex items-center gap-1.5 py-1.5 px-3.5 border-2 border-border bg-surface text-text-secondary cursor-pointer text-xs font-bold rounded-[10px]"
        >
          <ChevronLeft size={10} /> Choose another topic
        </m.button>
        <span className="text-[13px] font-bold text-text-secondary">
          <span className="text-accent-active">{currentIdx + 1}</span> / {cards.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-[5px] rounded-full overflow-hidden bg-border">
        <m.div
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 15 }}
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, var(--accent), var(--xp))" }}
        />
      </div>

      {/* 3D Flip Card */}
      <div
        onClick={() => setFlipped(!flipped)}
        className="cursor-pointer w-full"
        style={{ perspective: 1200 }}
      >
        <m.div
          className="relative w-full"
          style={{
            height: isVocab ? 360 : 400,
            transformStyle: "preserve-3d",
            transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0)",
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-xl flex flex-col items-center justify-center py-10 px-7 shadow-md"
            style={{
              backfaceVisibility: "hidden",
              border: `1.5px solid color-mix(in srgb, var(--accent) 15%, var(--border))`,
              background: isVocab
                ? "linear-gradient(135deg, color-mix(in srgb, var(--accent) 6%, var(--surface)), var(--surface))"
                : "linear-gradient(135deg, color-mix(in srgb, var(--secondary) 6%, var(--surface)), var(--surface))",
            }}
          >
            {/* Ambient glow */}
            <div
              className="absolute w-[200px] h-[200px] rounded-full left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${isVocab ? "var(--accent)" : "var(--secondary)"}10 0%, transparent 70%)`,
              }}
            />

            {/* Type badge */}
            <span
              className={`text-[10px] font-extrabold rounded-md mb-3 border-none py-1 px-2.5 ${
                isVocab
                  ? "bg-[rgba(59,130,246,0.1)] text-[#3B82F6]"
                  : "bg-[rgba(139,92,246,0.1)] text-[#8B5CF6]"
              }`}
            >
              {isVocab ? "📖 VOCABULARY" : "📐 GRAMMAR"}
            </span>

            {/* Tags row */}
            <div className="flex gap-1.5 mb-4 relative z-[2]">
              {isVocab && card.partOfSpeech && (
                <span className="text-[11px] font-bold text-text-muted bg-surface-alt rounded-md py-0.5 px-2">
                  {card.partOfSpeech}
                </span>
              )}
              {card.level && (
                <span
                  className="text-[10.5px] font-extrabold rounded-md py-0.5 px-2"
                  style={{
                    color: LEVEL_COLORS[card.level] ?? "var(--text-muted)",
                    background: `color-mix(in srgb, ${LEVEL_COLORS[card.level] ?? "var(--text-muted)"} 10%, var(--surface))`,
                  }}
                >
                  {card.level}
                </span>
              )}
            </div>

            {/* Front text */}
            <h2
              className="m-0 font-black text-center font-display text-text-primary relative z-[2] max-w-[90%]"
              style={{
                fontSize: isVocab ? 36 : 22,
                letterSpacing: isVocab ? "-0.02em" : "0",
                fontStyle: isVocab ? "italic" : "normal",
                lineHeight: 1.3,
              }}
            >
              {card.front}
            </h2>

            {/* Phonetic */}
            {isVocab && card.phonetic && (
              <span className="mt-2.5 text-sm font-mono text-text-secondary bg-surface-alt rounded-lg border-2 border-border relative z-[2] py-1 px-3">
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
                className="mt-5 inline-flex items-center gap-2 rounded-full text-accent-active text-[13px] font-bold relative z-[2] py-2 px-4.5 shadow-sm transition-all duration-200"
                style={{
                  border: "1.5px solid color-mix(in srgb, var(--accent) 30%, var(--border))",
                  background: tts.isSpeaking ? "var(--accent-light)" : "var(--surface)",
                  cursor: tts.isLoading ? "wait" : "pointer",
                }}
              >
                {tts.isLoading ? <Loader2 className="animate-spin" /> : <Volume2 />}
                {tts.isSpeaking ? "Playing..." : "Listen"}
              </m.button>
            )}

            <span className="absolute bottom-5 text-xs font-semibold text-text-muted">
              Click card to flip
            </span>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-xl border-2 border-border bg-surface p-6 flex flex-col justify-start overflow-y-auto shadow-md"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            {/* Vietnamese meaning */}
            <div className="text-center text-2xl font-black text-accent-active font-display mb-4 pb-3.5 border-b border-dashed border-border">
              {card.back}
            </div>

            {/* Grammar explanation */}
            {!isVocab && card.explanation && (
              <div className="rounded-lg bg-surface-alt border-2 border-border mb-3 py-3 px-3.5">
                <span className="text-[11px] font-extrabold text-text-muted uppercase tracking-widest block mb-1.5">
                  <Pin className="h-3.5 w-3.5 inline mr-1" /> Explanation
                </span>
                <p className="m-0 text-text-primary font-medium text-[13.5px] leading-[1.65]">
                  {card.explanation}
                </p>
              </div>
            )}

            {/* Example */}
            <div className="rounded-lg bg-surface-alt mb-3 py-3 px-3.5 border-l-[3.5px] border-l-accent">
              <div className="text-sm font-bold text-text-primary leading-relaxed">
                {card.example}
              </div>
              <div className="text-text-muted font-semibold mt-1 text-[12.5px]">
                {card.exampleVi}
              </div>
            </div>

            {/* TOEIC Tip */}
            {card.toeicTip && (
              <div
                className="rounded-lg py-2.5 px-3.5"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(245, 158, 11, 0.04), rgba(239, 68, 68, 0.02))",
                  border: "1px solid rgba(245, 158, 11, 0.15)",
                }}
              >
                <div className="flex items-start gap-2">
                  <span className="text-sm shrink-0 mt-px">🎯</span>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-warning">
                      TOEIC Exam Tip
                    </span>
                    <p className="text-text-primary font-semibold m-0 mt-1 text-[12.5px] leading-relaxed">
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
      <div className="flex gap-2.5 justify-center mt-2">
        <m.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={goPrev}
          disabled={currentIdx === 0}
          className={`w-12 h-12 border-2 border-border bg-surface grid place-items-center text-base rounded-[14px] shadow-sm ${
            currentIdx === 0
              ? "text-text-muted cursor-not-allowed"
              : "text-text-primary cursor-pointer"
          }`}
        >
          <ChevronLeft />
        </m.button>

        <m.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setFlipped(!flipped)}
          className="flex-1 max-w-[200px] h-12 text-accent-active cursor-pointer text-sm font-extrabold rounded-[14px] shadow-sm"
          style={{
            border: "1.5px solid color-mix(in srgb, var(--accent) 20%, var(--border))",
            background: "var(--accent-light)",
          }}
        >
          {flipped ? "Show Front" : "Flip Card"}
        </m.button>

        <m.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={goNext}
          disabled={currentIdx === cards.length - 1}
          className={`w-12 h-12 border-2 border-border bg-surface grid place-items-center text-base rounded-[14px] shadow-sm ${
            currentIdx === cards.length - 1
              ? "text-text-muted cursor-not-allowed"
              : "text-text-primary cursor-pointer"
          }`}
        >
          <ChevronRight />
        </m.button>
      </div>

      {/* Completed state */}
      {currentIdx === cards.length - 1 && flipped && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-4 px-5 rounded-xl text-center"
          style={{
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.05), var(--surface))",
            border: "1px solid rgba(16, 185, 129, 0.15)",
          }}
        >
          <CheckCircle size={28} className="text-success mx-auto mb-2" />
          <h4 className="text-[15px] font-black text-ink m-0 mb-1.5">
            Completed {cards.length} flashcards!
          </h4>
          <p className="mb-3 text-[13px] text-text-secondary font-medium">Topic: {topicLabel}</p>
          <div className="flex gap-2 justify-center">
            <m.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setCurrentIdx(0);
                setFlipped(false);
              }}
              className="border-2 border-border bg-surface text-text-secondary cursor-pointer text-[13px] font-bold py-2 px-4.5 rounded-[10px] flex items-center gap-1.5"
            >
              <RefreshCw size={12} /> Review Again
            </m.button>
            <m.button
              whileTap={{ scale: 0.95 }}
              onClick={resetToTopics}
              className="border-none cursor-pointer text-[13px] font-extrabold py-2 px-4.5 rounded-[10px] bg-accent text-white shadow-[0_4px_12px_var(--accent-muted)]"
            >
              New Topic
            </m.button>
          </div>
        </m.div>
      )}
    </div>
  );
}
