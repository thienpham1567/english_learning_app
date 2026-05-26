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
      <div className="text-center" style={{padding: "60px 20px"}} >
        <Loader2 className="animate-spin text-accent" size={32} />
        <p className="text-text-secondary text-[13px] font-bold" >Đang khởi tạo bài học chủ đề {topicTitle}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="anim-fade-up p-6 rounded-(--radius-xl) text-destructive text-center" style={{background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)"}} >
        <p className="text-sm mb-4" style={{fontWeight: 650}} >{error}</p>
        <m.button
          onClick={generate}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }} className="border-none font-extrabold cursor-pointer" style={{padding: "10px 24px", borderRadius: 10, background: "var(--error)", color: "var(--text-on-accent)"}} >
          Thử lại
        </m.button>
      </div>
    );
  }

  if (!data) return null;

  if (allDone) {
    return (
      <div className="anim-fade-up text-center rounded-(--radius-xl) bg-(--surface)" style={{padding: "40px 24px", border: "1.5px solid var(--border)", boxShadow: "var(--shadow-md)"}} >
        <CheckCircle size={48} className="text-(--success)" />
        <h2 className="text-xl text-text-primary font-display" style={{fontWeight: 950, margin: "0 0 6px"}} >
          Chủ đề đã hoàn thành!
        </h2>
        <p className="text-text-secondary text-[13px] font-semibold" style={{margin: "0 0 4px"}} >
          {topicTitle} · 4/4 phần
        </p>
        
        {xpAwarded > 0 && (
          <div className="items-center gap-1.5 text-accent font-extrabold" style={{display: "inline-flex", padding: "6px 16px", borderRadius: 20, background: "var(--accent-light)", fontSize: 14.5, margin: "12px 0 24px", border: "1px solid var(--accent-muted)"}} >
            <Trophy size={13} />
            <span>+{xpAwarded} XP</span>
          </div>
        )}

        <div className="flex gap-3 justify-center" >
          <m.button
            onClick={onBack}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }} className="flex items-center gap-2 border-2 border-border bg-(--surface) text-text-primary cursor-pointer font-extrabold" style={{padding: "10px 20px", borderRadius: 10, fontSize: 13.5}} >
            <ArrowLeft /> Quay lại danh sách
          </m.button>
        </div>
      </div>
    );
  }

  return (
    <div className="anim-fade-up flex flex-col" style={{gap: 18}} >
      {/* Back Link Breadcrumb */}
      <button
        onClick={onBack} className="items-center gap-1.5 border-none bg-transparent text-accent cursor-pointer font-extrabold" style={{display: "inline-flex", padding: "6px 0", fontSize: 13.5, width: "fit-content"}} >
        <ArrowLeft size={12} />
        <span>Quay về danh sách</span>
      </button>

      {/* Styled Section pill selector */}
      <div className="flex gap-1.5 bg-surface-alt rounded-(--radius-xl) flex-wrap" style={{border: "1.5px solid var(--border)", padding: 5}} >
        {SECTIONS.map((s) => {
          const done = completedSections.has(s.key);
          const active = activeSection === s.key;
          return (
            <m.button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              whileTap={{ scale: 0.97 }} className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-(--radius-lg) text-[13px] font-extrabold border-none cursor-pointer" style={{flex: "1 1 auto", background: active
                  ? "var(--accent)"
                  : done
                  ? "rgba(16, 185, 129, 0.08)"
                  : "transparent", color: active
                  ? "var(--text-on-accent)"
                  : done
                  ? "var(--success)"
                  : "var(--text-secondary)", transition: "color 0.2s, background 0.2s"}} >
              {done ? <CheckCircle size={13} /> : s.icon}
              <span>{s.label}</span>
            </m.button>
          );
        })}
      </div>

      {/* Progress banner indicator */}
      <div className="flex justify-between items-center" style={{borderBottom: "1px dashed var(--border)", paddingBottom: 10}} >
        <span className="text-text-secondary font-bold" style={{fontSize: 12.5}} >
          Tiến trình chủ đề này:
        </span>
        <span className="text-[11px] font-extrabold rounded-lg bg-(--surface) border-2 border-border text-text-secondary" style={{padding: "2px 8px"}} >
          {completedSections.size} / 4 phần học xong
        </span>
      </div>

      {/* ── VOCABULARY SECTION ── */}
      {activeSection === "vocabulary" && (
        <div className="flex flex-col gap-3" >
          {data.vocabulary.map((w, i) => (
            <div
              key={i} className="rounded-(--radius-xl) bg-(--surface) flex items-start gap-3.5 relative" style={{padding: "16px 18px", border: "1.5px solid var(--border)", boxShadow: "var(--shadow-sm)"}} >
              <div className="flex-1" >
                <div className="flex items-center gap-2 mb-1" >
                  <strong className="text-base font-black text-text-primary font-display" >{w.word}</strong>
                  <span className="text-xs text-text-muted font-bold font-mono" >{w.ipa}</span>
                  <m.button
                    onClick={() => speakTts(w.word)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }} className="border-none rounded-full w-[24px] h-[24px] grid cursor-pointer text-accent" style={{background: "var(--accent-light)", placeItems: "center", padding: 0}} >
                    <Volume2 size={12} />
                  </m.button>
                </div>
                <p className="text-accent font-extrabold" style={{margin: "2px 0 6px", fontSize: 13.5}} >
                  {w.meaning}
                </p>
                <div className="mt-2" style={{borderLeft: "2.5px solid var(--border)", paddingLeft: 12}} >
                  <p className="m-0 text-[13px] text-text-secondary italic font-medium" >
                    {w.example}
                  </p>
                  <p className="text-xs text-text-muted font-medium" style={{margin: "2px 0 0"}} >
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
              whileTap={{ scale: 0.98 }} className="mt-3 rounded-(--radius-lg) border-none text-sm font-extrabold cursor-pointer flex items-center justify-center gap-2" style={{padding: "14px", background: "var(--accent)", color: "var(--text-on-accent)", boxShadow: "0 4px 12px var(--accent-muted)"}} >
              <span>Hoàn thành mục này</span>
              <CheckCircle />
            </m.button>
          )}
        </div>
      )}

      {/* ── GRAMMAR SECTION ── */}
      {activeSection === "grammar" && (
        <div className="flex flex-col gap-3.5" >
          {/* Formula Card */}
          <div className="rounded-(--radius-xl) text-center relative overflow-hidden" style={{padding: "24px 20px", background: "linear-gradient(135deg, var(--accent-light) 0%, var(--surface) 100%)", border: "1.5px solid var(--accent-muted)"}} >
            <p className="text-xs text-accent mb-2 font-extrabold uppercase tracking-widest" >
              <Calculator className="mr-1" /> {data.grammar.title}
            </p>
            <p className="text-xl text-text-primary m-0 font-mono" style={{fontWeight: 950, letterSpacing: "0.02em"}} >
              {data.grammar.formula}
            </p>
          </div>

          {/* Explanation panel */}
          <div className="rounded-(--radius-xl) bg-(--surface)" style={{padding: 18, border: "1.5px solid var(--border)", boxShadow: "var(--shadow-sm)"}} >
            <span className="uppercase tracking-wider text-text-muted block mb-2" style={{fontSize: 11.5, fontWeight: 850}} >
              Giải thích cấu trúc:
            </span>
            <p className="text-sm m-0 text-text-primary font-medium" style={{lineHeight: 1.7}} >
              {data.grammar.explanation}
            </p>
          </div>

          {/* Example card */}
          <div className="p-4 rounded-(--radius-xl) bg-surface-alt" style={{border: "1.5px solid var(--border)"}} >
            <span className="uppercase tracking-wider text-text-muted block mb-2" style={{fontSize: 11.5, fontWeight: 850}} >
              Ví dụ minh họa:
            </span>
            <div className="flex items-start gap-2.5" >
              <p className="m-0 font-bold flex-1 text-text-primary" style={{fontSize: 14.5}} >
                {data.grammar.topicExample}
              </p>
              <m.button
                onClick={() => speakTts(data.grammar.topicExample)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }} className="border-none bg-(--surface) rounded-full w-[24px] h-[24px] grid cursor-pointer text-accent" style={{placeItems: "center", boxShadow: "var(--shadow-sm)", padding: 0}} >
                <Volume2 size={12} />
              </m.button>
            </div>
            <p className="text-[13px] text-text-secondary italic font-medium" style={{margin: "4px 0 0"}} >
              {data.grammar.topicExampleVi}
            </p>
          </div>

          {!completedSections.has("grammar") && (
            <m.button
              onClick={() => markDone("grammar")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }} className="mt-3 rounded-(--radius-lg) border-none text-sm font-extrabold cursor-pointer flex items-center justify-center gap-2" style={{padding: "14px", background: "var(--accent)", color: "var(--text-on-accent)", boxShadow: "0 4px 12px var(--accent-muted)"}} >
              <span>Hoàn thành mục này</span>
              <CheckCircle />
            </m.button>
          )}
        </div>
      )}

      {/* ── READING SECTION ── */}
      {activeSection === "reading" && (
        <div className="flex flex-col gap-4" >
          {/* Reading passage card */}
          <div className="rounded-(--radius-xl) bg-(--surface)" style={{padding: 20, border: "1.5px solid var(--border)", boxShadow: "var(--shadow-sm)"}} >
            <h3 className="mb-3 text-base font-black text-text-primary font-display" >
              {data.reading.title}
            </h3>
            <p className="text-text-primary m-0 font-medium" style={{fontSize: 14.5, lineHeight: 1.8, whiteSpace: "pre-wrap"}} >
              {data.reading.passage}
            </p>
          </div>

          {/* Reading questions list */}
          {data.reading.questions.map((q, qi) => {
            const isQAnswered = readingAnswers[qi] !== undefined;
            return (
              <div
                key={qi} className="rounded-(--radius-xl) bg-(--surface)" style={{padding: 18, border: "1.5px solid var(--border)", boxShadow: "var(--shadow-sm)"}} >
                <p className="mb-3 font-extrabold text-text-primary" style={{fontSize: 14.5}} >
                  {qi + 1}. {q.question}
                </p>
                <div className="flex flex-col gap-2" >
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
                        iconElement = <Check className="text-emerald-500" style={{marginLeft: "auto"}} />;
                      } else if (readingAnswers[qi] === oi) {
                        bg = "rgba(239, 68, 68, 0.08)";
                        border = "1.5px solid var(--error)";
                        color = "var(--error)";
                        iconElement = <X className="text-destructive" style={{marginLeft: "auto"}} />;
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
                        whileTap={readingRevealed ? {} : { scale: 0.98 }} className="flex items-center rounded-(--radius-lg) text-left" style={{padding: "12px 14px", border, background: bg, color, fontSize: 13.5, cursor: readingRevealed ? "default" : "pointer", fontWeight, transition: "all 0.2s"}} >
                        <span className="mr-2" style={{opacity: 0.7}} >{String.fromCharCode(65 + oi)}.</span>
                        <span>{o}</span>
                        {iconElement}
                      </m.button>
                    );
                  })}
                </div>

                {readingRevealed && (
                  <div className="mt-3 bg-surface-alt text-text-secondary font-medium" style={{padding: "10px 14px", borderRadius: "var(--radius-md)", border: "1.5px solid var(--border)", fontSize: 12.5, lineHeight: 1.55}} >
                    <p className="m-0 font-bold flex items-center gap-1 mb-1" >
                      <Lightbulb className="text-[13px]" style={{color: "var(--warning)"}} />
                      <span>Giải thích đáp án:</span>
                    </p>
                    <p className="m-0" >{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}

          {!readingRevealed && Object.keys(readingAnswers).length === data.reading.questions.length && (
            <m.button
              onClick={() => setReadingRevealed(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }} className="rounded-(--radius-lg) border-none text-sm font-extrabold cursor-pointer flex items-center justify-center gap-2" style={{padding: "14px", background: "var(--accent)", color: "var(--text-on-accent)", boxShadow: "0 4px 12px var(--accent-muted)"}} >
              <span>Kiểm tra kết quả</span>
              <ChevronRight />
            </m.button>
          )}

          {readingRevealed && !completedSections.has("reading") && (
            <m.button
              onClick={() => markDone("reading")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }} className="rounded-(--radius-lg) border-none text-sm font-extrabold cursor-pointer flex items-center justify-center gap-2" style={{padding: "14px", background: "var(--success)", color: "var(--text-on-accent)", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)"}} >
              <span>Hoàn thành mục này</span>
              <CheckCircle />
            </m.button>
          )}
        </div>
      )}

      {/* ── EXERCISES SECTION ── */}
      {activeSection === "exercises" && (
        <div className="flex flex-col gap-3.5" >
          {/* Question card wrapper */}
          {(() => {
            const ex = data.exercises[exIdx];
            if (!ex) return null;
            return (
              <div className="p-6 rounded-(--radius-xl) bg-(--surface) relative" style={{border: "1.5px solid var(--border)", boxShadow: "var(--shadow-sm)"}} >
                <div className="text-xs font-extrabold text-text-muted uppercase tracking-widest mb-3" >
                  Câu hỏi luyện tập {exIdx + 1} / {data.exercises.length}
                </div>

                <p className="text-base font-bold leading-relaxed text-text-primary" style={{margin: "0 0 20px"}} >
                  {ex.sentence}
                </p>

                <div className="flex flex-col gap-2.5" >
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
                        iconElement = <CheckCircle className="text-emerald-500" style={{marginLeft: "auto"}} />;
                      } else if (isSel) {
                        bg = "rgba(239, 68, 68, 0.08)";
                        border = "1.5px solid var(--error)";
                        color = "var(--error)";
                        iconElement = <XCircle className="text-destructive" style={{marginLeft: "auto"}} />;
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
                        whileTap={exRevealed ? {} : { scale: 0.98 }} className="flex items-center rounded-(--radius-lg) text-left" style={{padding: "12px 14px", border, background: bg, color, fontSize: 13.5, cursor: exRevealed ? "default" : "pointer", fontWeight, transition: "all 0.2s"}} >
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
                      animate={{ opacity: 1, y: 0 }} className="mt-4 py-3 px-4 bg-surface-alt text-text-secondary font-medium" style={{borderRadius: "var(--radius-md)", border: "1.5px solid var(--border)", fontSize: 12.5, lineHeight: 1.55}} >
                      <p className="m-0 font-bold flex items-center gap-1 mb-1" >
                        <Lightbulb className="text-[13px]" style={{color: "var(--warning)"}} />
                        <span>Giải thích đáp án:</span>
                      </p>
                      <p className="m-0" >{ex.explanation}</p>
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
              whileTap={{ scale: 0.98 }} className="rounded-(--radius-lg) border-none text-sm font-extrabold cursor-pointer flex items-center justify-center gap-2" style={{padding: "14px", background: "var(--accent)", color: "var(--text-on-accent)", boxShadow: "0 4px 12px var(--accent-muted)"}} >
              <span>{exIdx < data.exercises.length - 1 ? "Câu hỏi tiếp theo" : "Hoàn thành và tính điểm"}</span>
              {exIdx < data.exercises.length - 1 ? <ArrowRight /> : <CheckCircle />}
            </m.button>
          )}
        </div>
      )}
    </div>
  );
}
