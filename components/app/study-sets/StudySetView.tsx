"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  SoundOutlined,
  BulbOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { Tag } from "antd";

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
const SECTIONS: { key: Section; label: string; icon: string }[] = [
  { key: "vocabulary", label: "Từ vựng", icon: "📚" },
  { key: "grammar", label: "Ngữ pháp", icon: "📐" },
  { key: "reading", label: "Đọc hiểu", icon: "📖" },
  { key: "exercises", label: "Bài tập", icon: "✍️" },
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

  // Reading answers
  const [readingAnswers, setReadingAnswers] = useState<Record<number, number>>({});
  const [readingRevealed, setReadingRevealed] = useState(false);

  // Exercise state
  const [exIdx, setExIdx] = useState(0);
  const [exSelected, setExSelected] = useState<string | null>(null);
  const [exRevealed, setExRevealed] = useState(false);
  const [exCorrect, setExCorrect] = useState(0);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/study-sets/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, topicTitle, examMode, level }),
      });
      if (!res.ok) throw new Error("Failed");
      setData(await res.json());
    } catch {
      setError("Không thể tạo bộ học. Vui lòng thử lại.");
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
      fetch("/api/study-sets/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, sectionsCompleted: 4 }),
      })
        .then((r) => r.ok ? r.json() : null)
        .then((d) => { if (d) setXpAwarded(d.xpAwarded); })
        .catch(() => {});
      onComplete(topicId);
    }
  };

  const speak = (text: string) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.85;
    speechSynthesis.speak(u);
  };

  // ── Render ──

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <LoadingOutlined style={{ fontSize: 36, color: "var(--accent)" }} />
        <p style={{ color: "var(--text-secondary)", marginTop: 12 }}>Đang tạo bộ học "{topicTitle}"...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20, borderRadius: 12, background: "#ff4d4f15", border: "1px solid #ff4d4f40", color: "#ff4d4f", textAlign: "center" }}>
        <p>{error}</p>
        <button onClick={generate} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#ff4d4f", color: "#fff", cursor: "pointer" }}>Thử lại</button>
      </div>
    );
  }

  if (!data) return null;

  if (allDone) {
    return (
      <div style={{ textAlign: "center", padding: 32, borderRadius: 16, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
        <CheckCircleOutlined style={{ fontSize: 48, color: "#52c41a", marginBottom: 16 }} />
        <h2 style={{ margin: "0 0 8px" }}>Bộ học hoàn thành!</h2>
        <p style={{ color: "var(--text-secondary)", margin: "0 0 4px" }}>{topicTitle} — 4/4 phần</p>
        {xpAwarded > 0 && <p style={{ color: "var(--accent)", fontSize: 16, fontWeight: 600, margin: "8px 0 20px" }}>+{xpAwarded} XP 🎉</p>}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={onBack} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", cursor: "pointer", fontWeight: 500 }}>
            <ArrowLeftOutlined /> Chủ đề khác
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Back */}
      <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 0", border: "none", background: "transparent", color: "var(--accent)", cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
        <ArrowLeftOutlined /> Danh sách chủ đề
      </button>

      {/* Section tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {SECTIONS.map((s) => {
          const done = completedSections.has(s.key);
          const active = activeSection === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              style={{
                padding: "8px 14px", borderRadius: 99, fontSize: 13, fontWeight: active ? 600 : 400,
                border: active ? "1.5px solid var(--accent)" : done ? "1.5px solid #52c41a" : "1px solid var(--border)",
                background: active ? "var(--accent-muted, #6366f115)" : done ? "#52c41a08" : "transparent",
                color: active ? "var(--accent)" : done ? "#52c41a" : "var(--text-secondary)",
                cursor: "pointer", transition: "all 0.2s",
              }}
            >
              {done ? "✅" : s.icon} {s.label}
            </button>
          );
        })}
      </div>

      {/* Progress */}
      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
        {completedSections.size}/4 phần hoàn thành
      </div>

      {/* ── VOCABULARY ── */}
      {activeSection === "vocabulary" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data.vocabulary.map((w, i) => (
            <div key={i} style={{ padding: 14, borderRadius: 10, background: "var(--card-bg)", border: "1px solid var(--border)", display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <strong style={{ fontSize: 15 }}>{w.word}</strong>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{w.ipa}</span>
                  <button onClick={() => speak(w.word)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--accent)", padding: 2 }}><SoundOutlined /></button>
                </div>
                <p style={{ margin: "4px 0 2px", fontSize: 13, color: "var(--accent)", fontWeight: 500 }}>{w.meaning}</p>
                <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", fontStyle: "italic" }}>{w.example}</p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>{w.exampleVi}</p>
              </div>
            </div>
          ))}
          {!completedSections.has("vocabulary") && (
            <button onClick={() => markDone("vocabulary")} style={{ padding: "12px 20px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              Hoàn thành <CheckCircleOutlined />
            </button>
          )}
        </div>
      )}

      {/* ── GRAMMAR ── */}
      {activeSection === "grammar" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ padding: 20, borderRadius: 12, textAlign: "center", background: "linear-gradient(135deg, var(--accent-muted, #6366f110), #8b5cf610)", border: "1px solid var(--border)" }}>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 6px", fontWeight: 600 }}>📐 {data.grammar.title}</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: "var(--accent)", margin: 0, fontFamily: "monospace" }}>{data.grammar.formula}</p>
          </div>
          <div style={{ padding: 16, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
            <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0 }}>{data.grammar.explanation}</p>
          </div>
          <div style={{ padding: 14, borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 500, flex: 1 }}>{data.grammar.topicExample}</p>
              <button onClick={() => speak(data.grammar.topicExample)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--accent)" }}><SoundOutlined /></button>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-secondary)", fontStyle: "italic" }}>{data.grammar.topicExampleVi}</p>
          </div>
          {!completedSections.has("grammar") && (
            <button onClick={() => markDone("grammar")} style={{ padding: "12px 20px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              Hoàn thành <CheckCircleOutlined />
            </button>
          )}
        </div>
      )}

      {/* ── READING ── */}
      {activeSection === "reading" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ padding: 20, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 600 }}>{data.reading.title}</h3>
            <p style={{ fontSize: 14, lineHeight: 1.8, margin: 0, whiteSpace: "pre-wrap" }}>{data.reading.passage}</p>
          </div>
          {data.reading.questions.map((q, qi) => {
            const answered = readingAnswers[qi] !== undefined;
            const isCorrect = readingAnswers[qi] === q.answer;
            return (
              <div key={qi} style={{ padding: 16, borderRadius: 10, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
                <p style={{ margin: "0 0 10px", fontWeight: 500, fontSize: 14 }}>{qi + 1}. {q.question}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {q.options.map((o, oi) => {
                    let bg = "var(--surface)";
                    let border = "1px solid var(--border)";
                    let color = "var(--text)";
                    if (readingRevealed) {
                      if (oi === q.answer) { bg = "#52c41a15"; border = "1px solid #52c41a"; color = "#52c41a"; }
                      else if (readingAnswers[qi] === oi) { bg = "#ff4d4f15"; border = "1px solid #ff4d4f"; color = "#ff4d4f"; }
                    }
                    return (
                      <button key={oi} onClick={() => { if (!readingRevealed) setReadingAnswers((p) => ({ ...p, [qi]: oi })); }} disabled={readingRevealed}
                        style={{ padding: "10px 14px", borderRadius: 8, border, background: bg, color, fontSize: 13, cursor: readingRevealed ? "default" : "pointer", textAlign: "left", fontWeight: readingAnswers[qi] === oi || (readingRevealed && oi === q.answer) ? 600 : 400 }}>
                        {o}
                      </button>
                    );
                  })}
                </div>
                {readingRevealed && (
                  <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--text-secondary)" }}>
                    <BulbOutlined style={{ marginRight: 4, color: "var(--accent)" }} />{q.explanation}
                  </p>
                )}
              </div>
            );
          })}
          {!readingRevealed && Object.keys(readingAnswers).length === data.reading.questions.length && (
            <button onClick={() => setReadingRevealed(true)} style={{ padding: "12px 20px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              Kiểm tra <RightOutlined />
            </button>
          )}
          {readingRevealed && !completedSections.has("reading") && (
            <button onClick={() => markDone("reading")} style={{ padding: "12px 20px", borderRadius: 10, border: "none", background: "#52c41a", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              Hoàn thành <CheckCircleOutlined />
            </button>
          )}
        </div>
      )}

      {/* ── EXERCISES ── */}
      {activeSection === "exercises" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Bài tập {exIdx + 1}/{data.exercises.length}</div>
          {(() => {
            const ex = data.exercises[exIdx];
            if (!ex) return null;
            return (
              <div style={{ padding: 20, borderRadius: 14, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.6, margin: "0 0 16px" }}>{ex.sentence}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {ex.options.map((o) => {
                    const isCorrect = o === ex.answer;
                    const isSel = o === exSelected;
                    let bg = "var(--surface)";
                    let border = "1px solid var(--border)";
                    let color = "var(--text)";
                    if (exRevealed) {
                      if (isCorrect) { bg = "#52c41a15"; border = "1px solid #52c41a"; color = "#52c41a"; }
                      else if (isSel) { bg = "#ff4d4f15"; border = "1px solid #ff4d4f"; color = "#ff4d4f"; }
                    }
                    return (
                      <button key={o} onClick={() => { if (!exRevealed) { setExSelected(o); setExRevealed(true); if (o === ex.answer) setExCorrect((c) => c + 1); } }} disabled={exRevealed}
                        style={{ padding: "12px 16px", borderRadius: 10, border, background: bg, color, fontSize: 14, cursor: exRevealed ? "default" : "pointer", textAlign: "left", fontWeight: isSel || (exRevealed && isCorrect) ? 600 : 400, transition: "all 0.2s" }}>
                        {exRevealed && isCorrect && <CheckCircleOutlined style={{ marginRight: 6 }} />}
                        {exRevealed && isSel && !isCorrect && <CloseCircleOutlined style={{ marginRight: 6 }} />}
                        {o}
                      </button>
                    );
                  })}
                </div>
                {exRevealed && (
                  <p style={{ margin: "12px 0 0", fontSize: 12, color: "var(--text-secondary)", padding: 10, borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <BulbOutlined style={{ marginRight: 4, color: "var(--accent)" }} />{ex.explanation}
                  </p>
                )}
              </div>
            );
          })()}
          {exRevealed && (
            <button onClick={() => {
              if (exIdx < data.exercises.length - 1) {
                setExIdx((i) => i + 1); setExSelected(null); setExRevealed(false);
              } else {
                markDone("exercises");
              }
            }} style={{ padding: "12px 20px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              {exIdx < data.exercises.length - 1 ? <>Câu tiếp <RightOutlined /></> : <>Hoàn thành <CheckCircleOutlined /></>}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
