"use client";

import { api } from "@/lib/api-client";
import { useState, useEffect, useCallback } from "react";

import type { ReactNode } from "react";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import * as m from "motion/react-client";
import { AnimatePresence } from "motion/react";
import { Progress } from "antd";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BookOpenText,
  Calculator,
  Check,
  CheckCircle,
  ChevronRight,
  Lightbulb,
  Loader2,
  Pencil,
  Trophy,
  Volume2,
  X,
  XCircle,
} from "lucide-react";

type VocabWord = { word: string; ipa: string; meaning: string; example: string; exampleVi: string };
type GrammarData = { title: string; formula: string; explanation: string; topicExample: string; topicExampleVi: string };
type ReadingQuestion = { question: string; options: string[]; answer: number; explanation: string };
type ReadingData = { title: string; passage: string; questions: ReadingQuestion[] };
type ExerciseItem = { sentence: string; options: string[]; answer: string; explanation: string };

type StudySetData = {
  vocabulary: VocabWord[];
  grammar: GrammarData;
  reading: ReadingData;
  exercises: ExerciseItem[];
};

type Section = "vocabulary" | "grammar" | "reading" | "exercises";
const SECTIONS: { key: Section; label: string; icon: ReactNode }[] = [
  { key: "vocabulary", label: "Từ vựng", icon: <BookOpen /> },
  { key: "grammar", label: "Ngữ pháp", icon: <Calculator /> },
  { key: "reading", label: "Đọc hiểu", icon: <BookOpenText /> },
  { key: "exercises", label: "Bài tập", icon: <Pencil /> },
];

interface Props {
  topicId: string;
  topicTitle: string;
  level: string;
  examMode: string;
  onBack: () => void;
  onComplete: (topicId: string) => void;
}

export function StudySetView({ topicId, topicTitle, level, examMode, onBack, onComplete }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StudySetData | null>(null);
  const [activeSection, setActiveSection] = useState<Section>("vocabulary");
  const [completedSections, setCompletedSections] = useState<Set<Section>>(new Set());
  const [allDone, setAllDone] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(0);
  const { speak: speakTts } = useTextToSpeech();

  // Reading answers
  const [readingAnswers, setReadingAnswers] = useState<Record<number, number>>({});
  const [readingRevealed, setReadingRevealed] = useState(false);

  // Exercise state
  const [exIdx, setExIdx] = useState(0);
  const [exSelected, setExSelected] = useState<string | null>(null);
  const [exRevealed, setExRevealed] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await api.post<StudySetData>("/study-sets/generate", {
        topicId, topicTitle, examMode, level,
      });
      setData(payload);
    } catch {
      setError("Không thể tạo nội dung học thử nghiệm. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [topicId, topicTitle, examMode, level]);

  useEffect(() => { generate(); }, [generate]);

  const markDone = (section: Section) => {
    const next = new Set(completedSections).add(section);
    setCompletedSections(next);

    if (next.size === 4 && !allDone) {
      setAllDone(true);
      api.post<{ xpAwarded: number }>("/study-sets/complete", {
        topicId, sectionsCompleted: 4,
      })
        .then((d) => { if (d) setXpAwarded(d.xpAwarded); })
        .catch(() => {});
      onComplete(topicId);
    } else {
      const nextSection = SECTIONS.find((s) => !next.has(s.key));
      if (nextSection) setActiveSection(nextSection.key);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <Loader2 className="animate-spin text-[var(--accent)]" size={32} />
        <p style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 700 }}>Đang khởi tạo bài học chủ đề {topicTitle}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, borderRadius: "var(--radius-xl)", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "var(--error)", textAlign: "center" }} className="anim-fade-up">
        <p style={{ fontSize: 14, fontWeight: 650, margin: "0 0 16px" }}>{error}</p>
        <m.button
          onClick={generate}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "var(--error)", color: "var(--text-on-accent)", fontWeight: 800, cursor: "pointer" }}
        >
          Thử lại
        </m.button>
      </div>
    );
  }

  if (!data) return null;

  if (allDone) {
    return (
      <div style={{ textAlign: "center", padding: "40px 24px", borderRadius: "var(--radius-xl)", background: "var(--surface)", border: "1.5px solid var(--border)", boxShadow: "var(--shadow-md)" }} className="anim-fade-up">
        <CheckCircle size={48} className="text-[var(--success)]" />
        <h2 style={{ fontSize: 20, fontWeight: 950, color: "var(--text-primary)", margin: "0 0 6px", fontFamily: "var(--font-display)" }}>
          Chủ đề đã hoàn thành!
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, margin: "0 0 4px" }}>
          {topicTitle} · 4/4 phần
        </p>
        
        {xpAwarded > 0 && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 16px", borderRadius: 20,
            background: "var(--accent-light)",
            color: "var(--accent)", fontSize: 14.5, fontWeight: 800, margin: "12px 0 24px",
            border: "1px solid var(--accent-muted)"
          }}>
            <Trophy size={13} />
            <span>+{xpAwarded} XP</span>
          </div>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <m.button
            onClick={onBack}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 20px", borderRadius: 10, border: "1px solid var(--border)",
              background: "var(--surface)", color: "var(--text-primary)", cursor: "pointer",
              fontSize: 13.5, fontWeight: 800
            }}
          >
            <ArrowLeft /> Quay lại danh sách
          </m.button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }} className="anim-fade-up">
      {/* Back Link Breadcrumb */}
      <button
        onClick={onBack}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 0",
          border: "none",
          background: "transparent",
          color: "var(--accent)",
          cursor: "pointer",
          fontSize: 13.5,
          fontWeight: 800,
          width: "fit-content"
        }}
      >
        <ArrowLeft size={12} />
        <span>Quay về danh sách</span>
      </button>

      {/* Styled Section pill selector */}
      <div style={{
        display: "flex",
        gap: 6,
        background: "var(--surface-alt)",
        border: "1.5px solid var(--border)",
        borderRadius: "var(--radius-xl)",
        padding: 5,
        flexWrap: "wrap"
      }}>
        {SECTIONS.map((s) => {
          const done = completedSections.has(s.key);
          const active = activeSection === s.key;
          return (
            <m.button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              whileTap={{ scale: 0.97 }}
              style={{
                flex: "1 1 auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: "var(--radius-lg)",
                fontSize: 13,
                fontWeight: 800,
                border: "none",
                background: active
                  ? "var(--accent)"
                  : done
                  ? "rgba(16, 185, 129, 0.08)"
                  : "transparent",
                color: active
                  ? "var(--text-on-accent)"
                  : done
                  ? "var(--success)"
                  : "var(--text-secondary)",
                cursor: "pointer",
                transition: "color 0.2s, background 0.2s",
              }}
            >
              {done ? <CheckCircle size={13} /> : s.icon}
              <span>{s.label}</span>
            </m.button>
          );
        })}
      </div>

      {/* Progress banner indicator */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed var(--border)", paddingBottom: 10 }}>
        <span style={{ fontSize: 12.5, color: "var(--text-secondary)", fontWeight: 700 }}>
          Tiến trình chủ đề này:
        </span>
        <span style={{
          fontSize: 11,
          fontWeight: 800,
          padding: "2px 8px",
          borderRadius: 8,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          color: "var(--text-secondary)",
        }}>
          {completedSections.size} / 4 phần học xong
        </span>
      </div>

      {/* ── VOCABULARY SECTION ── */}
      {activeSection === "vocabulary" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {data.vocabulary.map((w, i) => (
            <div
              key={i}
              style={{
                padding: "16px 18px",
                borderRadius: "var(--radius-xl)",
                background: "var(--surface)",
                border: "1.5px solid var(--border)",
                boxShadow: "var(--shadow-sm)",
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                position: "relative"
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <strong style={{ fontSize: 16, fontWeight: 900, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>{w.word}</strong>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700, fontFamily: "var(--font-mono)" }}>{w.ipa}</span>
                  <m.button
                    onClick={() => speakTts(w.word)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    style={{
                      border: "none",
                      background: "var(--accent-light)",
                      borderRadius: "50%",
                      width: 24,
                      height: 24,
                      display: "grid",
                      placeItems: "center",
                      cursor: "pointer",
                      color: "var(--accent)",
                      padding: 0
                    }}
                  >
                    <Volume2 size={12} />
                  </m.button>
                </div>
                <p style={{ margin: "2px 0 6px", fontSize: 13.5, color: "var(--accent)", fontWeight: 800 }}>
                  {w.meaning}
                </p>
                <div style={{ borderLeft: "2.5px solid var(--border)", paddingLeft: 12, marginTop: 8 }}>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", fontStyle: "italic", fontWeight: 500 }}>
                    {w.example}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
                    {w.exampleVi}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {!completedSections.has("vocabulary") && (
            <m.button
              onClick={() => markDone("vocabulary")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                marginTop: 12,
                padding: "14px",
                borderRadius: "var(--radius-lg)",
                border: "none",
                background: "var(--accent)",
                color: "var(--text-on-accent)",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 4px 12px var(--accent-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8
              }}
            >
              <span>Hoàn thành mục này</span>
              <CheckCircle />
            </m.button>
          )}
        </div>
      )}

      {/* ── GRAMMAR SECTION ── */}
      {activeSection === "grammar" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Formula Card */}
          <div style={{
            padding: "24px 20px",
            borderRadius: "var(--radius-xl)",
            textAlign: "center",
            background: "linear-gradient(135deg, var(--accent-light) 0%, var(--surface) 100%)",
            border: "1.5px solid var(--accent-muted)",
            position: "relative",
            overflow: "hidden"
          }}>
            <p style={{ fontSize: 12, color: "var(--accent)", margin: "0 0 8px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              <Calculator style={{ marginRight: 4 }} /> {data.grammar.title}
            </p>
            <p style={{ fontSize: 20, fontWeight: 950, color: "var(--text-primary)", margin: 0, fontFamily: "var(--font-mono)", letterSpacing: "0.02em" }}>
              {data.grammar.formula}
            </p>
          </div>

          {/* Explanation panel */}
          <div style={{ padding: 18, borderRadius: "var(--radius-xl)", background: "var(--surface)", border: "1.5px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
            <span style={{ fontSize: 11.5, fontWeight: 850, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", display: "block", marginBottom: 8 }}>
              Giải thích cấu trúc:
            </span>
            <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0, color: "var(--text-primary)", fontWeight: 500 }}>
              {data.grammar.explanation}
            </p>
          </div>

          {/* Example card */}
          <div style={{ padding: 16, borderRadius: "var(--radius-xl)", background: "var(--surface-alt)", border: "1.5px solid var(--border)" }}>
            <span style={{ fontSize: 11.5, fontWeight: 850, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", display: "block", marginBottom: 8 }}>
              Ví dụ minh họa:
            </span>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <p style={{ margin: 0, fontSize: 14.5, fontWeight: 700, flex: 1, color: "var(--text-primary)" }}>
                {data.grammar.topicExample}
              </p>
              <m.button
                onClick={() => speakTts(data.grammar.topicExample)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{
                  border: "none",
                  background: "var(--surface)",
                  borderRadius: "50%",
                  width: 24,
                  height: 24,
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                  color: "var(--accent)",
                  boxShadow: "var(--shadow-sm)",
                  padding: 0
                }}
              >
                <Volume2 size={12} />
              </m.button>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-secondary)", fontStyle: "italic", fontWeight: 500 }}>
              {data.grammar.topicExampleVi}
            </p>
          </div>

          {!completedSections.has("grammar") && (
            <m.button
              onClick={() => markDone("grammar")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                marginTop: 12,
                padding: "14px",
                borderRadius: "var(--radius-lg)",
                border: "none",
                background: "var(--accent)",
                color: "var(--text-on-accent)",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 4px 12px var(--accent-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8
              }}
            >
              <span>Hoàn thành mục này</span>
              <CheckCircle />
            </m.button>
          )}
        </div>
      )}

      {/* ── READING SECTION ── */}
      {activeSection === "reading" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Reading passage card */}
          <div style={{ padding: 20, borderRadius: "var(--radius-xl)", background: "var(--surface)", border: "1.5px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 900, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
              {data.reading.title}
            </h3>
            <p style={{ fontSize: 14.5, lineHeight: 1.8, color: "var(--text-primary)", margin: 0, whiteSpace: "pre-wrap", fontWeight: 500 }}>
              {data.reading.passage}
            </p>
          </div>

          {/* Reading questions list */}
          {data.reading.questions.map((q, qi) => {
            const isQAnswered = readingAnswers[qi] !== undefined;
            return (
              <div
                key={qi}
                style={{
                  padding: 18,
                  borderRadius: "var(--radius-xl)",
                  background: "var(--surface)",
                  border: "1.5px solid var(--border)",
                  boxShadow: "var(--shadow-sm)"
                }}
              >
                <p style={{ margin: "0 0 12px", fontWeight: 800, fontSize: 14.5, color: "var(--text-primary)" }}>
                  {qi + 1}. {q.question}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {q.options.map((o, oi) => {
                    let bg = "var(--surface)";
                    let border = "1px solid var(--border)";
                    let color = "var(--text-primary)";
                    let fontWeight = 600;
                    let iconElement = null;

                    if (readingRevealed) {
                      if (oi === q.answer) {
                        bg = "rgba(16, 185, 129, 0.08)";
                        border = "1.5px solid var(--success)";
                        color = "var(--success)";
                        iconElement = <Check style={{ marginLeft: "auto", color: "var(--success)" }} />;
                      } else if (readingAnswers[qi] === oi) {
                        bg = "rgba(239, 68, 68, 0.08)";
                        border = "1.5px solid var(--error)";
                        color = "var(--error)";
                        iconElement = <X style={{ marginLeft: "auto", color: "var(--error)" }} />;
                      } else {
                        bg = "var(--surface-alt)";
                        color = "var(--text-muted)";
                        border = "1px solid var(--border)";
                      }
                    } else if (readingAnswers[qi] === oi) {
                      border = "1.5px solid var(--accent)";
                      bg = "var(--accent-light)";
                      color = "var(--accent)";
                    }

                    return (
                      <m.button
                        key={oi}
                        onClick={() => { if (!readingRevealed) setReadingAnswers((p) => ({ ...p, [qi]: oi })); }}
                        disabled={readingRevealed}
                        whileHover={readingRevealed ? {} : { x: 3, borderColor: "var(--accent)" }}
                        whileTap={readingRevealed ? {} : { scale: 0.98 }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "12px 14px",
                          borderRadius: "var(--radius-lg)",
                          border,
                          background: bg,
                          color,
                          fontSize: 13.5,
                          cursor: readingRevealed ? "default" : "pointer",
                          textAlign: "left",
                          fontWeight,
                          transition: "all 0.2s"
                        }}
                      >
                        <span style={{ marginRight: 8, opacity: 0.7 }}>{String.fromCharCode(65 + oi)}.</span>
                        <span>{o}</span>
                        {iconElement}
                      </m.button>
                    );
                  })}
                </div>

                {readingRevealed && (
                  <div style={{
                    marginTop: 12,
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    background: "var(--surface-alt)",
                    border: "1.5px solid var(--border)",
                    fontSize: 12.5,
                    color: "var(--text-secondary)",
                    fontWeight: 500,
                    lineHeight: 1.55
                  }}>
                    <p style={{ margin: 0, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                      <Lightbulb style={{ color: "var(--warning)", fontSize: 13 }} />
                      <span>Giải thích đáp án:</span>
                    </p>
                    <p style={{ margin: 0 }}>{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}

          {!readingRevealed && Object.keys(readingAnswers).length === data.reading.questions.length && (
            <m.button
              onClick={() => setReadingRevealed(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: "14px",
                borderRadius: "var(--radius-lg)",
                border: "none",
                background: "var(--accent)",
                color: "var(--text-on-accent)",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 4px 12px var(--accent-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8
              }}
            >
              <span>Kiểm tra kết quả</span>
              <ChevronRight />
            </m.button>
          )}

          {readingRevealed && !completedSections.has("reading") && (
            <m.button
              onClick={() => markDone("reading")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: "14px",
                borderRadius: "var(--radius-lg)",
                border: "none",
                background: "var(--success)",
                color: "var(--text-on-accent)",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8
              }}
            >
              <span>Hoàn thành mục này</span>
              <CheckCircle />
            </m.button>
          )}
        </div>
      )}

      {/* ── EXERCISES SECTION ── */}
      {activeSection === "exercises" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Question card wrapper */}
          {(() => {
            const ex = data.exercises[exIdx];
            if (!ex) return null;
            return (
              <div style={{
                padding: 24,
                borderRadius: "var(--radius-xl)",
                background: "var(--surface)",
                border: "1.5px solid var(--border)",
                boxShadow: "var(--shadow-sm)",
                position: "relative"
              }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                  Câu hỏi luyện tập {exIdx + 1} / {data.exercises.length}
                </div>

                <p style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.6, color: "var(--text-primary)", margin: "0 0 20px" }}>
                  {ex.sentence}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {ex.options.map((o) => {
                    const isCorrect = o === ex.answer;
                    const isSel = o === exSelected;
                    let bg = "var(--surface)";
                    let border = "1px solid var(--border)";
                    let color = "var(--text-primary)";
                    let fontWeight = 600;
                    let iconElement = null;

                    if (exRevealed) {
                      if (isCorrect) {
                        bg = "rgba(16, 185, 129, 0.08)";
                        border = "1.5px solid var(--success)";
                        color = "var(--success)";
                        iconElement = <CheckCircle style={{ marginLeft: "auto", color: "var(--success)" }} />;
                      } else if (isSel) {
                        bg = "rgba(239, 68, 68, 0.08)";
                        border = "1.5px solid var(--error)";
                        color = "var(--error)";
                        iconElement = <XCircle style={{ marginLeft: "auto", color: "var(--error)" }} />;
                      } else {
                        bg = "var(--surface-alt)";
                        color = "var(--text-muted)";
                        border = "1px solid var(--border)";
                      }
                    } else if (exSelected === o) {
                      border = "1.5px solid var(--accent)";
                      bg = "var(--accent-light)";
                      color = "var(--accent)";
                    }

                    return (
                      <m.button
                        key={o}
                        onClick={() => { if (!exRevealed) { setExSelected(o); setExRevealed(true); } }}
                        disabled={exRevealed}
                        whileHover={exRevealed ? {} : { x: 3, borderColor: "var(--accent)" }}
                        whileTap={exRevealed ? {} : { scale: 0.98 }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "12px 14px",
                          borderRadius: "var(--radius-lg)",
                          border,
                          background: bg,
                          color,
                          fontSize: 13.5,
                          cursor: exRevealed ? "default" : "pointer",
                          textAlign: "left",
                          fontWeight,
                          transition: "all 0.2s"
                        }}
                      >
                        <span>{o}</span>
                        {iconElement}
                      </m.button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {exRevealed && (
                    <m.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        marginTop: 16,
                        padding: "12px 16px",
                        borderRadius: "var(--radius-md)",
                        background: "var(--surface-alt)",
                        border: "1.5px solid var(--border)",
                        fontSize: 12.5,
                        color: "var(--text-secondary)",
                        fontWeight: 500,
                        lineHeight: 1.55
                      }}
                    >
                      <p style={{ margin: 0, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                        <Lightbulb style={{ color: "var(--warning)", fontSize: 13 }} />
                        <span>Giải thích đáp án:</span>
                      </p>
                      <p style={{ margin: 0 }}>{ex.explanation}</p>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })()}

          {exRevealed && (
            <m.button
              onClick={() => {
                if (exIdx < data.exercises.length - 1) {
                  setExIdx((i) => i + 1);
                  setExSelected(null);
                  setExRevealed(false);
                } else {
                  markDone("exercises");
                }
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: "14px",
                borderRadius: "var(--radius-lg)",
                border: "none",
                background: "var(--accent)",
                color: "var(--text-on-accent)",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 4px 12px var(--accent-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8
              }}
            >
              <span>{exIdx < data.exercises.length - 1 ? "Câu hỏi tiếp theo" : "Hoàn thành và tính điểm"}</span>
              {exIdx < data.exercises.length - 1 ? <ArrowRight /> : <CheckCircle />}
            </m.button>
          )}
        </div>
      )}
    </div>
  );
}
