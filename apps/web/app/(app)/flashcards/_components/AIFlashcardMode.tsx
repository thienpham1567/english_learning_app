"use client";

import { useState, useCallback } from "react";

import { Tag } from "antd";
import * as m from "motion/react-client";

import { api } from "@/lib/api-client";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import {
  BookOpen,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutGrid,
  Lightbulb,
  Loader2,
  RefreshCw,
  Volume2,
  Zap,
} from "lucide-react";

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
  { value: "mixed", label: "Tổng hợp", icon: <LayoutGrid /> },
  { value: "vocab", label: "Từ vựng", icon: <BookOpen /> },
  { value: "grammar", label: "Ngữ pháp", icon: <ClipboardList /> },
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
      <div className="flex flex-col gap-5 w-[600px] mx-auto w-full" >
        {/* Topic Grid */}
        <div>
          <div className="flex items-center gap-2 mb-3" >
            <Zap className="text-accent text-base" />
            <h3 className="m-0 text-base font-black text-ink font-display" >
              Chọn chủ đề TOEIC
            </h3>
          </div>

          <div className="grid gap-2.5" style={{gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))"}} >
            {TOEIC_TOPICS.map((topic) => {
              const isSelected = selectedTopic === topic.id;
              return (
                <m.button
                  key={topic.id}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedTopic(isSelected ? null : topic.id)} className="flex items-center gap-2.5 rounded-(--radius-lg) cursor-pointer text-left" style={{padding: "12px 14px", border: isSelected
                      ? "1.5px solid var(--accent)"
                      : "1.5px solid var(--border)", background: isSelected
                      ? "var(--accent-light)"
                      : "var(--surface)", boxShadow: isSelected ? "0 4px 14px var(--accent-muted)" : "var(--shadow-sm)", transition: "all 0.15s"}} >
                  <span className="text-xl" >{topic.emoji}</span>
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
          <label className="text-xs font-bold text-text-secondary block mb-1.5" >
            Hoặc nhập chủ đề tùy chỉnh:
          </label>
          <input
            value={customTopic}
            onChange={(e) => {
              setCustomTopic(e.target.value);
              if (e.target.value.trim()) setSelectedTopic("__custom");
              else if (selectedTopic === "__custom") setSelectedTopic(null);
            }}
            placeholder="VD: Negotiation Skills, Supply Chain, Real Estate..." className="w-full py-3 px-4 rounded-(--radius-lg) bg-(--surface) text-text-primary text-sm font-semibold" style={{border: selectedTopic === "__custom" ? "1.5px solid var(--accent)" : "1.5px solid var(--border)", outline: "none", boxSizing: "border-box"}} />
        </div>

        {/* Type & Count selector */}
        <div className="flex gap-3 flex-wrap" >
          {/* Type */}
          <div className="flex-1 w-[200px]" >
            <label className="text-[11px] font-bold text-text-muted uppercase block mb-1.5" style={{letterSpacing: "0.06em"}} >
              Loại flashcard
            </label>
            <div className="flex gap-1.5" >
              {TYPE_OPTIONS.map((opt) => (
                <m.button
                  key={opt.value}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setCardType(opt.value)} className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 cursor-pointer text-xs font-bold" style={{borderRadius: 10, border: cardType === opt.value ? "1.5px solid var(--accent)" : "1.5px solid var(--border)", background: cardType === opt.value ? "var(--accent-light)" : "var(--surface)", color: cardType === opt.value ? "var(--accent)" : "var(--text-secondary)"}} >
                  {opt.icon} {opt.label}
                </m.button>
              ))}
            </div>
          </div>

          {/* Count */}
          <div className="w-[140px]" >
            <label className="text-[11px] font-bold text-text-muted uppercase block mb-1.5" style={{letterSpacing: "0.06em"}} >
              Số lượng
            </label>
            <div className="flex gap-1.5" >
              {COUNT_OPTIONS.map((c) => (
                <m.button
                  key={c}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setCardCount(c)} className="flex-1 cursor-pointer text-[13px] font-extrabold" style={{padding: "8px 0", borderRadius: 10, border: cardCount === c ? "1.5px solid var(--accent)" : "1.5px solid var(--border)", background: cardCount === c ? "var(--accent-light)" : "var(--surface)", color: cardCount === c ? "var(--accent)" : "var(--text-secondary)"}} >
                  {c}
                </m.button>
              ))}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="text-destructive text-[13px] font-semibold" style={{padding: "10px 14px", borderRadius: 10, background: "rgba(239, 68, 68, 0.06)", border: "1px solid rgba(239, 68, 68, 0.15)"}} >
            {error}
          </div>
        )}

        {/* Generate button */}
        <m.button
          whileHover={{ scale: 1.01, y: -2 }}
          whileTap={{ scale: 0.99 }}
          onClick={generate}
          disabled={!selectedTopic} className="py-4 px-6 rounded-(--radius-xl) border-none text-[15px] font-black flex items-center justify-center gap-2.5 font-display relative overflow-hidden" style={{background: selectedTopic
              ? "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 80%, var(--secondary)))"
              : "var(--border)", color: selectedTopic ? "#fff" : "var(--text-muted)", cursor: selectedTopic ? "pointer" : "not-allowed", boxShadow: selectedTopic ? "0 8px 28px var(--accent-muted)" : "none"}} >
          {selectedTopic && (
            <div className="absolute w-[120px] h-[120px] rounded-full" style={{top: "-50%", right: "-10%", background: "rgba(255,255,255,0.06)", pointerEvents: "none"}} />
          )}
          <Zap /> Tạo {cardCount} Flashcard bằng AI
        </m.button>
      </div>
    );
  }

  /* ── PHASE: Loading ── */
  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center gap-5 w-[400px] mx-auto" style={{padding: "60px 24px"}} >
        <m.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-[64px] h-[64px] rounded-full grid" style={{background: "var(--accent-light)", placeItems: "center"}} >
          <Loader2 className="animate-spin text-accent" size={28} />
        </m.div>
        <div className="text-center" >
          <h3 className="text-lg font-black text-ink font-display" style={{margin: "0 0 6px"}} >
            Đang tạo flashcard...
          </h3>
          <p className="m-0 text-sm text-text-secondary font-medium" >
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
    <div className="flex flex-col gap-4 w-[520px] mx-auto w-full" >
      {/* Top bar */}
      <div className="flex items-center justify-between" >
        <m.button
          whileTap={{ scale: 0.95 }}
          onClick={resetToTopics} className="flex items-center gap-1.5 py-1.5 px-3.5 border border-(--border) bg-(--surface) text-text-secondary cursor-pointer text-xs font-bold" style={{borderRadius: 10}} >
          <ChevronLeft size={10} /> Chọn chủ đề khác
        </m.button>
        <span className="text-[13px] font-bold text-text-secondary" >
          <span className="text-accent" >{currentIdx + 1}</span> / {cards.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-[5px] rounded-full overflow-hidden" style={{background: "var(--border)"}} >
        <m.div
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 15 }} className="h-full rounded-full" style={{background: "linear-gradient(90deg, var(--accent), var(--xp))"}} />
      </div>

      {/* 3D Flip Card */}
      <div
        
        onClick={() => setFlipped(!flipped)} className="cursor-pointer w-full" style={{perspective: 1200}} >
        <m.div className="relative w-full" style={{height: isVocab ? 360 : 400, transformStyle: "preserve-3d", transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)", transform: flipped ? "rotateY(180deg)" : "rotateY(0)"}} >
          {/* Front */}
          <div className="absolute rounded-(--radius-xl) flex flex-col items-center justify-center" style={{inset: 0, backfaceVisibility: "hidden", border: `1.5px solid color-mix(in srgb, var(--accent) 15%, var(--border))`, background: isVocab
                ? "linear-gradient(135deg, color-mix(in srgb, var(--accent) 6%, var(--surface)), var(--surface))"
                : "linear-gradient(135deg, color-mix(in srgb, var(--secondary) 6%, var(--surface)), var(--surface))", padding: "40px 28px", boxShadow: "var(--shadow-md)"}} >
            {/* Ambient glow */}
            <div className="absolute w-[200px] h-[200px] rounded-full" style={{left: "50%", top: "45%", transform: "translate(-50%, -50%)", background: `radial-gradient(circle, ${isVocab ? "var(--accent)" : "var(--secondary)"}10 0%, transparent 70%)`, pointerEvents: "none"}} />

            {/* Type badge */}
            <Tag
              color={isVocab ? "blue" : "purple"} className="text-[10px] font-extrabold rounded-md mb-3 border-none" >
              {isVocab ? "📖 VOCABULARY" : "📐 GRAMMAR"}
            </Tag>

            {/* Tags row */}
            <div className="flex gap-1.5 mb-4 relative" style={{zIndex: 2}} >
              {isVocab && card.partOfSpeech && (
                <span className="text-[11px] font-bold text-text-muted bg-surface-alt rounded-md" style={{padding: "2px 8px"}} >
                  {card.partOfSpeech}
                </span>
              )}
              {card.level && (
                <Tag color={LEVEL_COLORS[card.level] ?? "default"} className="text-[10.5px] font-extrabold rounded-md m-0 border-none" >
                  {card.level}
                </Tag>
              )}
            </div>

            {/* Front text */}
            <h2 className="m-0 font-black text-center font-display text-text-primary relative" style={{fontSize: isVocab ? 36 : 22, letterSpacing: isVocab ? "-0.02em" : "0", fontStyle: isVocab ? "italic" : "normal", lineHeight: 1.3, zIndex: 2, maxWidth: "90%"}} >
              {card.front}
            </h2>

            {/* Phonetic */}
            {isVocab && card.phonetic && (
              <span className="mt-2.5 text-sm font-mono text-text-secondary bg-surface-alt rounded-lg border border-(--border) relative" style={{padding: "4px 12px", zIndex: 2}} >
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
                disabled={tts.isLoading || tts.isSpeaking} className="mt-5 items-center gap-2 rounded-full text-accent text-[13px] font-bold relative" style={{display: "inline-flex", padding: "8px 18px", border: "1.5px solid color-mix(in srgb, var(--accent) 30%, var(--border))", background: tts.isSpeaking ? "var(--accent-light)" : "var(--surface)", cursor: tts.isLoading ? "wait" : "pointer", boxShadow: "var(--shadow-sm)", zIndex: 2}} >
                {tts.isLoading ? <Loader2 className="animate-spin" /> : <Volume2 />}
                {tts.isSpeaking ? "Đang phát..." : "Nghe phát âm"}
              </m.button>
            )}

            <span className="absolute text-xs font-semibold text-text-muted" style={{bottom: 20}} >
              Nhấn thẻ để lật xem nghĩa
            </span>
          </div>

          {/* Back */}
          <div className="absolute rounded-(--radius-xl) border border-(--border) bg-(--surface) p-6 flex flex-col justify-start overflow-y-auto" style={{inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)", boxShadow: "var(--shadow-md)"}} >
            {/* Vietnamese meaning */}
            <div className="text-center text-2xl font-black text-accent font-display mb-4" style={{borderBottom: "1.5px dashed var(--border)", paddingBottom: 14}} >
              {card.back}
            </div>

            {/* Grammar explanation */}
            {!isVocab && card.explanation && (
              <div className="rounded-(--radius-lg) bg-surface-alt border border-(--border) mb-3" style={{padding: "12px 14px"}} >
                <span className="text-[11px] font-extrabold text-text-muted uppercase tracking-widest block mb-1.5" >
                  📌 Giải thích
                </span>
                <p className="m-0 text-text-primary font-medium" style={{fontSize: 13.5, lineHeight: 1.65}} >
                  {card.explanation}
                </p>
              </div>
            )}

            {/* Example */}
            <div className="rounded-(--radius-lg) bg-surface-alt mb-3" style={{padding: "12px 14px", borderLeft: "3.5px solid var(--accent)"}} >
              <div className="text-sm font-bold text-text-primary" style={{lineHeight: 1.55}} >
                {card.example}
              </div>
              <div className="text-text-muted font-semibold mt-1" style={{fontSize: 12.5}} >
                {card.exampleVi}
              </div>
            </div>

            {/* TOEIC Tip */}
            {card.toeicTip && (
              <div className="rounded-(--radius-lg)" style={{padding: "10px 14px", background: "linear-gradient(135deg, rgba(245, 158, 11, 0.04), rgba(239, 68, 68, 0.02))", border: "1px solid rgba(245, 158, 11, 0.15)"}} >
                <div className="flex items-start gap-2" >
                  <span className="text-sm shrink-0" style={{marginTop: 1}} >🎯</span>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{color: "var(--warning)"}} >
                      Mẹo thi TOEIC
                    </span>
                    <p className="text-text-primary font-semibold" style={{margin: "4px 0 0", fontSize: 12.5, lineHeight: 1.55}} >
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
      <div className="flex gap-2.5 justify-center mt-2" >
        <m.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={goPrev}
          disabled={currentIdx === 0} className="w-[48px] h-[48px] border border-(--border) bg-(--surface) grid text-base" style={{borderRadius: 14, color: currentIdx === 0 ? "var(--text-muted)" : "var(--text-primary)", cursor: currentIdx === 0 ? "not-allowed" : "pointer", placeItems: "center", boxShadow: "var(--shadow-sm)"}} >
          <ChevronLeft />
        </m.button>

        <m.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setFlipped(!flipped)} className="flex-1 w-[200px] h-[48px] text-accent cursor-pointer text-sm font-extrabold" style={{borderRadius: 14, border: "1.5px solid color-mix(in srgb, var(--accent) 20%, var(--border))", background: "var(--accent-light)", boxShadow: "var(--shadow-sm)"}} >
          {flipped ? "Xem mặt trước" : "Lật thẻ"}
        </m.button>

        <m.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={goNext}
          disabled={currentIdx === cards.length - 1} className="w-[48px] h-[48px] border border-(--border) bg-(--surface) grid text-base" style={{borderRadius: 14, color: currentIdx === cards.length - 1 ? "var(--text-muted)" : "var(--text-primary)", cursor: currentIdx === cards.length - 1 ? "not-allowed" : "pointer", placeItems: "center", boxShadow: "var(--shadow-sm)"}} >
          <ChevronRight />
        </m.button>
      </div>

      {/* Completed state */}
      {currentIdx === cards.length - 1 && flipped && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }} className="py-4 px-5 rounded-(--radius-xl) text-center" style={{background: "linear-gradient(135deg, rgba(16, 185, 129, 0.05), var(--surface))", border: "1px solid rgba(16, 185, 129, 0.15)"}} >
          <CheckCircle size={28} className="text-(--success)" />
          <h4 className="text-[15px] font-black text-ink" style={{margin: "0 0 6px"}} >
            🎉 Hoàn thành {cards.length} flashcard!
          </h4>
          <p className="mb-3 text-[13px] text-text-secondary font-medium" >
            Chủ đề: {topicLabel}
          </p>
          <div className="flex gap-2 justify-center" >
            <m.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setCurrentIdx(0);
                setFlipped(false);
              }} className="border border-(--border) bg-(--surface) text-text-secondary cursor-pointer text-[13px] font-bold" style={{padding: "8px 18px", borderRadius: 10}} >
              <RefreshCw /> Ôn lại
            </m.button>
            <m.button
              whileTap={{ scale: 0.95 }}
              onClick={resetToTopics} className="border-none cursor-pointer text-[13px] font-extrabold" style={{padding: "8px 18px", borderRadius: 10, background: "var(--accent)", color: "#fff", boxShadow: "0 4px 12px var(--accent-muted)"}} >
              Chủ đề mới
            </m.button>
          </div>
        </m.div>
      )}
    </div>
  );
}
