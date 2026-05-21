"use client";

import { api } from "@/lib/api-client";
import { useState, useCallback, useEffect, useRef } from "react";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  LoadingOutlined,
  ReloadOutlined,
  BulbOutlined,
  TrophyOutlined,
  InfoCircleOutlined,
  BookOutlined,
  SmileOutlined,
  CheckOutlined,
  CloseOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { Progress, Tag } from "antd";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import * as m from "motion/react-client";
import { AnimatePresence } from "motion/react";

// ─── Error Review Types
type ErrorEntry = {
  id: string;
  sourceModule: string;
  questionStem: string;
  options: string[] | null;
  userAnswer: string;
  correctAnswer: string;
  explanationEn: string | null;
  explanationVi: string | null;
  grammarTopic: string | null;
  reviewCount: number;
};

// ─── Vocabulary Review Types
type VocabWord = {
  query: string;
  headword: string;
  overviewVi: string;
  overviewEn: string;
  partOfSpeech: string | null;
  level: string | null;
  easeFactor: number;
  interval: number;
  reviewCount: number;
  masteryLevel: string;
};

type DistractorWord = {
  query: string;
  headword: string;
  overviewVi: string;
  level: string | null;
};

type QuizQuestion = {
  word: VocabWord;
  mode: "vi-to-en" | "en-to-vi";
  options: string[];
  correctIndex: number;
};

type ReviewState = "loading" | "quiz" | "results" | "empty";
type TabKey = "errors" | "vocab";

function MasteryBadge({ level }: { level: string }) {
  const config: Record<string, { bg: string; color: string; label: string }> = {
    new: { bg: "var(--surface-alt)", color: "var(--text-secondary)", label: "Mới" },
    learning: { bg: "rgba(245, 158, 11, 0.08)", color: "var(--warning)", label: "Đang học" },
    reviewing: { bg: "var(--accent-light)", color: "var(--accent)", label: "Ôn tập" },
    mastered: { bg: "rgba(16, 185, 129, 0.08)", color: "var(--success)", label: "Thành thạo" },
  };
  const c = config[level] ?? config.new;
  return (
    <span
      style={{
        fontSize: 10.5,
        fontWeight: 800,
        padding: "2px 8px",
        borderRadius: 12,
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.bg === "var(--surface-alt)" ? "var(--border)" : c.color}22`,
      }}
    >
      {c.label}
    </span>
  );
}

// ─── Accordion Component (Custom Explanation Collapse)
function ExplanationAccordion({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ marginTop: 10, borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden", background: "var(--surface-alt)" }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "transparent",
          border: "none",
          textAlign: "left",
          cursor: "pointer",
          fontSize: 12.5,
          fontWeight: 700,
          color: "var(--text-secondary)",
        }}
      >
        <span>{title}</span>
        <m.span animate={{ rotate: isOpen ? 180 : 0 }} style={{ fontSize: 10 }}>
          ▼
        </m.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <m.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "12px 14px", borderTop: "1px solid var(--border)", background: "var(--surface)", fontSize: 13, lineHeight: 1.6 }}>
              {children}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Quiz Question Generator
function generateQuizQuestions(words: VocabWord[], distractors: DistractorWord[]): QuizQuestion[] {
  return words.map((word, idx) => {
    const mode: "vi-to-en" | "en-to-vi" = idx % 2 === 0 ? "vi-to-en" : "en-to-vi";

    const sameLevelDistractors = distractors.filter(
      (d) => d.query !== word.query && d.level === word.level,
    );
    const otherDistractors = distractors.filter(
      (d) => d.query !== word.query && d.level !== word.level,
    );
    const pool = [...sameLevelDistractors, ...otherDistractors];

    const chosen: DistractorWord[] = [];
    const used = new Set<string>([word.query]);
    for (const d of pool) {
      if (chosen.length >= 3) break;
      if (used.has(d.query)) continue;
      used.add(d.query);
      chosen.push(d);
    }

    while (chosen.length < 3) {
      const placeholder = `---`;
      chosen.push({ query: `_pad_${chosen.length}`, headword: placeholder, overviewVi: placeholder, level: null });
    }

    let options: string[];
    let correctIndex: number;

    if (mode === "vi-to-en") {
      const allOptions = [word.headword, ...chosen.map((d) => d.headword)];
      const shuffled = allOptions.sort(() => Math.random() - 0.5);
      correctIndex = shuffled.indexOf(word.headword);
      options = shuffled;
    } else {
      const allOptions = [word.overviewVi, ...chosen.map((d) => d.overviewVi)];
      const shuffled = allOptions.sort(() => Math.random() - 0.5);
      correctIndex = shuffled.indexOf(word.overviewVi);
      options = shuffled;
    }

    return { word, mode, options, correctIndex };
  });
}

// ─── Vocab Review Tab
function VocabReviewTab() {
  const [state, setState] = useState<ReviewState>("loading");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [results, setResults] = useState<Array<{ query: string; quality: number }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    accuracy: number;
    xpEarned: number;
    words: Array<{ query: string; correct: boolean; masteryLevel: string; nextReview: string; interval: number }>;
  } | null>(null);
  const questionStartRef = useRef<number>(0);

  const currentQ = questions[currentIdx] ?? null;

  const fetchDue = useCallback(async () => {
    setState("loading");
    try {
      const data = await api.get<{ dueCount: number; words: VocabWord[]; distractors: DistractorWord[] }>("/vocabulary/due");
      if (data.dueCount === 0) {
        setState("empty");
      } else {
        const qs = generateQuizQuestions(data.words, data.distractors);
        setQuestions(qs);
        setCurrentIdx(0);
        setAnswers({});
        setResults([]);
        setSubmitResult(null);
        setState("quiz");
      }
    } catch {
      setState("empty");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const data = await api.get<{
          dueCount: number;
          words: VocabWord[];
          distractors: DistractorWord[];
        }>("/vocabulary/due");
        if (cancelled) return;

        if (data.dueCount === 0) {
          setState("empty");
          return;
        }

        const qs = generateQuizQuestions(data.words, data.distractors);
        setQuestions(qs);
        setCurrentIdx(0);
        setAnswers({});
        setResults([]);
        setSubmitResult(null);
        setState("quiz");
      } catch {
        if (!cancelled) setState("empty");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    questionStartRef.current = Date.now();
  }, [currentIdx]);

  const selectAnswer = useCallback((optionIdx: number) => {
    setAnswers((prev) => {
      if (prev[currentIdx] !== undefined) return prev;
      return { ...prev, [currentIdx]: optionIdx };
    });
  }, [currentIdx]);

  const getQuality = useCallback((correct: boolean, elapsedMs: number): number => {
    if (!correct) return 2;
    if (elapsedMs < 3000) return 5;
    if (elapsedMs < 8000) return 4;
    return 3;
  }, []);

  const submitReview = useCallback(async (finalResults: Array<{ query: string; quality: number }>) => {
    setSubmitting(true);
    try {
      const data = await api.post<{
        accuracy: number;
        xpEarned: number;
        words: Array<{ query: string; correct: boolean; masteryLevel: string; nextReview: string; interval: number }>;
      }>("/vocabulary/review", { results: finalResults });
      setSubmitResult(data);
    } catch { /* ignore */ }

    setSubmitting(false);
    setState("results");
  }, []);

  const handleNext = useCallback(() => {
    const q = questions[currentIdx];
    const selected = answers[currentIdx];
    let updatedResults = results;
    if (q && selected !== undefined) {
      const correct = selected === q.correctIndex;
      const elapsed = Date.now() - questionStartRef.current;
      const quality = getQuality(correct, elapsed);
      updatedResults = [...results, { query: q.word.query, quality }];
      setResults(updatedResults);
    }

    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      submitReview(updatedResults);
    }
  }, [answers, currentIdx, getQuality, questions, results, submitReview]);

  if (state === "loading") {
    return (
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 14 }}>
        <LoadingOutlined style={{ fontSize: 28, color: "var(--accent)" }} />
        <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 700 }}>Đang chuẩn bị thẻ ôn tập từ vựng...</span>
      </div>
    );
  }

  if (state === "empty") {
    return (
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: "60px 20px" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", padding: "48px 32px", textAlign: "center", maxWidth: 460, boxShadow: "var(--shadow-sm)" }}>
          <SmileOutlined style={{ fontSize: 36, color: "var(--success)", marginBottom: 12 }} />
          <h4 style={{ fontSize: 16, fontWeight: 900, color: "var(--text-primary)", margin: "0 0 6px" }}>Tuyệt vời! Không còn từ vựng đến hạn</h4>
          <p style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
            Bạn đã hoàn thành tất cả các mục từ vựng ôn tập trong hôm nay. Hãy tiếp tục tra từ điển hoặc học flashcard mới để phát triển kho từ vựng.
          </p>
        </div>
      </div>
    );
  }

  if (state === "results" && submitResult) {
    const correctCount = submitResult.words.filter((w) => w.correct).length;
    const percentage = submitResult.accuracy;
    const scoreColor = percentage >= 80 ? "var(--success)" : percentage >= 50 ? "var(--warning)" : "var(--error)";

    return (
      <div style={{ flex: 1, padding: "20px 16px 80px", maxWidth: 560, margin: "0 auto", width: "100%", overflowY: "auto" }} className="anim-fade-up">
        {/* Score Summary Banner */}
        <div style={{
          textAlign: "center", padding: "32px 20px", borderRadius: "var(--radius-xl)",
          background: "linear-gradient(135deg, var(--surface) 0%, var(--surface-alt) 100%)",
          border: "1.5px solid var(--border)", boxShadow: "var(--shadow-sm)", marginBottom: 24,
          position: "relative", overflow: "hidden"
        }}>
          <div style={{ position: "absolute", left: "50%", top: "0%", transform: "translateX(-50%)", width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle, var(--accent) 5%, transparent 70%)", opacity: 0.15, pointerEvents: "none" }} />
          
          <Progress
            type="circle"
            percent={percentage}
            size={120}
            strokeWidth={8}
            strokeColor={scoreColor}
            trailColor="var(--border)"
            format={() => (
              <div>
                <div style={{ fontSize: 24, fontWeight: 950, color: "var(--text-primary)" }}>{correctCount}/{submitResult.words.length}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 800 }}>Chính xác</div>
              </div>
            )}
          />
          
          <h3 style={{ margin: "16px 0 6px", fontSize: 18, fontWeight: 900, color: "var(--text-primary)" }}>
            {percentage >= 80 ? "Thật xuất sắc!" : percentage >= 50 ? "Làm khá tốt!" : "Hãy nỗ lực hơn nhé!"}
          </h3>

          {submitResult.xpEarned > 0 && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 16px", borderRadius: 20,
              background: "var(--accent-light)",
              color: "var(--accent)", fontSize: 14, fontWeight: 800, margin: "6px 0 16px",
              border: "1px solid var(--accent-muted)"
            }}>
              <TrophyOutlined style={{ fontSize: 13 }} />
              <span>+{submitResult.xpEarned} XP</span>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "center" }}>
            <m.button
              onClick={fetchDue}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 24px", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                color: "var(--text-on-accent)", fontSize: 13.5, fontWeight: 800, cursor: "pointer",
                boxShadow: "0 4px 12px var(--accent-muted)"
              }}
            >
              <ReloadOutlined /> Ôn tập thêm
            </m.button>
          </div>
        </div>

        {/* Word Detail Section */}
        <h4 style={{ fontSize: 12, fontWeight: 850, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <InfoCircleOutlined />
          <span>Danh sách từ đã ôn tập ({submitResult.words.length})</span>
        </h4>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {submitResult.words.map((w) => {
            const question = questions.find((q) => q.word.query === w.query);
            return (
              <div
                key={w.query}
                style={{
                  padding: "14px 16px", borderRadius: "var(--radius-lg)",
                  border: "1.5px solid var(--border)",
                  borderLeft: `4px solid ${w.correct ? "var(--success)" : "var(--error)"}`,
                  background: "var(--surface)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  {w.correct ? (
                    <CheckCircleFilled style={{ color: "var(--success)", fontSize: 15 }} />
                  ) : (
                    <CloseCircleFilled style={{ color: "var(--error)", fontSize: 15 }} />
                  )}
                  <span style={{ fontWeight: 800, fontSize: 14.5, color: "var(--text-primary)" }}>
                    {question?.word.headword ?? w.query}
                  </span>
                  {question?.word.partOfSpeech && (
                    <span style={{ fontSize: 11, fontStyle: "italic", color: "var(--text-muted)" }}>
                      ({question.word.partOfSpeech})
                    </span>
                  )}
                  <MasteryBadge level={w.masteryLevel} />
                </div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 6px", fontWeight: 500 }}>
                  {question?.word.overviewVi}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px dashed var(--border)", paddingTop: 8, marginTop: 4 }}>
                  <span style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 600 }}>
                    Chu kỳ ôn tiếp theo
                  </span>
                  <span style={{ fontSize: 11.5, color: "var(--text-secondary)", fontWeight: 800 }}>
                    Sau {w.interval} ngày
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (!currentQ) return null;
  const answered = answers[currentIdx] !== undefined;
  const isCorrect = answered && answers[currentIdx] === currentQ.correctIndex;

  return (
    <div style={{ flex: 1, padding: "20px 16px 80px", maxWidth: 520, margin: "0 auto", width: "100%" }} className="anim-fade-up">
      {/* Dynamic Progress indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, height: 6, background: "var(--border)", borderRadius: 3, position: "relative", overflow: "hidden" }}>
          <m.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
            style={{ height: "100%", background: "linear-gradient(to right, var(--accent), var(--secondary))", borderRadius: 3 }}
          />
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            padding: "2px 8px",
            borderRadius: 8,
            background: "var(--surface-alt)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          {currentIdx + 1} / {questions.length}
        </span>
      </div>

      {/* Main Quiz Sheet */}
      <div
        style={{
          padding: 24,
          borderRadius: "var(--radius-xl)",
          background: "var(--surface)",
          border: "1.5px solid var(--border)",
          boxShadow: "var(--shadow-md)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        {/* Decorative dynamic card glow */}
        <div style={{ position: "absolute", right: "-10%", top: "-10%", width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle, var(--accent) 5%, transparent 70%)", opacity: 0.05, pointerEvents: "none" }} />

        {/* Word Info Tags */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {currentQ.word.level && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 900,
                background: "rgba(59, 130, 246, 0.08)",
                color: "#2563eb",
                padding: "2px 6px",
                borderRadius: 6,
                border: "1px solid rgba(59, 130, 246, 0.15)",
              }}
            >
              {currentQ.word.level}
            </span>
          )}
          {currentQ.word.partOfSpeech && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                background: "var(--surface-alt)",
                color: "var(--text-muted)",
                padding: "2px 6px",
                borderRadius: 6,
                border: "1px solid var(--border)",
              }}
            >
              {currentQ.word.partOfSpeech}
            </span>
          )}
          <MasteryBadge level={currentQ.word.masteryLevel} />
          
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              marginLeft: "auto",
              padding: "2px 6px",
              borderRadius: 6,
              background: currentQ.mode === "vi-to-en" ? "rgba(139, 92, 246, 0.08)" : "rgba(6, 182, 212, 0.08)",
              color: currentQ.mode === "vi-to-en" ? "var(--xp)" : "var(--info)",
            }}
          >
            {currentQ.mode === "vi-to-en" ? "Việt → Anh" : "Anh → Việt"}
          </span>
        </div>

        {/* Question Topic Text */}
        <div style={{ marginBottom: 24 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
            {currentQ.mode === "vi-to-en" ? "Chọn từ tiếng Anh khớp với định nghĩa:" : "Chọn định nghĩa tiếng Việt tương ứng với từ:"}
          </span>
          <h2 style={{ fontSize: 20, fontWeight: 950, fontFamily: "var(--font-display)", color: "var(--text-primary)", margin: 0, lineHeight: 1.4 }}>
            {currentQ.mode === "vi-to-en" ? currentQ.word.overviewVi : currentQ.word.headword}
          </h2>
        </div>

        {/* Options Stack */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {currentQ.options.map((opt, oi) => {
            let borderColor = "var(--border)";
            let bgColor = "var(--surface)";
            let textColor = "var(--text-primary)";
            let fontWeight = 700;
            let iconElement = null;

            if (answered) {
              if (oi === currentQ.correctIndex) {
                borderColor = "var(--success)";
                bgColor = "rgba(16, 185, 129, 0.08)";
                textColor = "var(--success)";
                iconElement = <CheckOutlined style={{ marginLeft: "auto", color: "var(--success)" }} />;
              } else if (oi === answers[currentIdx] && oi !== currentQ.correctIndex) {
                borderColor = "var(--error)";
                bgColor = "rgba(239, 68, 68, 0.08)";
                textColor = "var(--error)";
                iconElement = <CloseOutlined style={{ marginLeft: "auto", color: "var(--error)" }} />;
              } else {
                bgColor = "var(--surface-alt)";
                textColor = "var(--text-muted)";
                borderColor = "var(--border)";
              }
            } else if (answers[currentIdx] === oi) {
              borderColor = "var(--accent)";
              bgColor = "var(--accent-light)";
              textColor = "var(--accent)";
            }

            return (
              <m.button
                key={oi}
                onClick={() => selectAnswer(oi)}
                disabled={answered}
                whileHover={answered ? {} : { x: 4, borderColor: "var(--accent)" }}
                whileTap={answered ? {} : { scale: 0.98 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "14px 16px",
                  borderRadius: "var(--radius-lg)",
                  border: "1.5px solid var(--border)",
                  borderColor,
                  background: bgColor,
                  color: textColor,
                  textAlign: "left",
                  cursor: answered ? "default" : "pointer",
                  fontSize: 14,
                  fontWeight,
                  fontFamily: "var(--font-body)",
                  transition: "border-color 0.2s, background-color 0.2s",
                }}
              >
                <span style={{ marginRight: 10, opacity: 0.7 }}>
                  {String.fromCharCode(65 + oi)}.
                </span>
                <span style={{ flex: 1 }}>{opt}</span>
                {iconElement}
              </m.button>
            );
          })}
        </div>

        {/* Answer results inline card */}
        <AnimatePresence>
          {answered && (
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: 16,
                padding: "12px 16px",
                borderRadius: "var(--radius-md)",
                background: isCorrect ? "rgba(16, 185, 129, 0.06)" : "rgba(239, 68, 68, 0.06)",
                border: `1px solid ${isCorrect ? "var(--success)" : "var(--error)"}22`,
                fontSize: 13,
                fontWeight: 650,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {isCorrect ? (
                <>
                  <CheckCircleFilled style={{ color: "var(--success)", fontSize: 16 }} />
                  <span style={{ color: "var(--success)" }}>Tuyệt vời! Bạn trả lời rất chuẩn xác.</span>
                </>
              ) : (
                <>
                  <CloseCircleFilled style={{ color: "var(--error)", fontSize: 16 }} />
                  <span style={{ color: "var(--error)" }}>
                    Rất tiếc! Đáp án đúng: <strong style={{ textDecoration: "underline" }}>{currentQ.options[currentQ.correctIndex]}</strong>
                  </span>
                </>
              )}
            </m.div>
          )}
        </AnimatePresence>

        {/* Controller panel */}
        <div style={{ marginTop: 20 }}>
          <m.button
            onClick={handleNext}
            disabled={!answered || submitting}
            whileHover={answered && !submitting ? { scale: 1.02 } : {}}
            whileTap={answered && !submitting ? { scale: 0.98 } : {}}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "var(--radius-lg)",
              border: "none",
              background: answered ? "var(--accent)" : "var(--border)",
              color: answered ? "var(--text-on-accent)" : "var(--text-secondary)",
              fontSize: 14,
              fontWeight: 800,
              cursor: answered ? "pointer" : "not-allowed",
              transition: "background 0.25s, color 0.25s",
              boxShadow: answered ? "0 4px 12px var(--accent-muted)" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {submitting ? (
              <LoadingOutlined spin />
            ) : (
              <>
                <span>{currentIdx < questions.length - 1 ? "Câu tiếp theo" : "Hoàn thành và tính điểm"}</span>
                <ArrowRightOutlined />
              </>
            )}
          </m.button>
        </div>
      </div>
    </div>
  );
}

// ─── Error Review Tab
function ErrorReviewTab() {
  const [state, setState] = useState<ReviewState>("loading");
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [results, setResults] = useState<Array<{ errorId: string; correct: boolean }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ resolved: number; rescheduled: number } | null>(null);

  const currentError = errors[currentIdx] ?? null;

  const fetchDue = useCallback(async () => {
    setState("loading");
    try {
      const data = await api.get<{ dueCount: number; errors: ErrorEntry[] }>("/review-quiz/due");
      if (data.dueCount === 0) {
        setState("empty");
      } else {
        setErrors(data.errors);
        setCurrentIdx(0);
        setAnswers({});
        setResults([]);
        setSubmitResult(null);
        setState("quiz");
      }
    } catch {
      setState("empty");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const data = await api.get<{ dueCount: number; errors: ErrorEntry[] }>("/review-quiz/due");
        if (cancelled) return;

        if (data.dueCount === 0) {
          setState("empty");
          return;
        }

        setErrors(data.errors);
        setCurrentIdx(0);
        setAnswers({});
        setResults([]);
        setSubmitResult(null);
        setState("quiz");
      } catch {
        if (!cancelled) setState("empty");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectAnswer = useCallback((optionIdx: number) => {
    setAnswers((prev) => ({ ...prev, [currentIdx]: optionIdx }));
  }, [currentIdx]);

  const submitReview = useCallback(async () => {
    setSubmitting(true);

    const reviewResults = errors.map((err, i) => {
      const selectedIdx = answers[i];
      if (!err.options || err.options.length === 0) {
        return { errorId: err.id, correct: selectedIdx === 0 };
      }
      const correctIdx = err.options.indexOf(err.correctAnswer);
      return { errorId: err.id, correct: selectedIdx !== null && selectedIdx !== undefined && selectedIdx === correctIdx };
    });

    setResults(reviewResults);

    try {
      const data = await api.post<{ resolved: number; rescheduled: number }>("/review-quiz/submit", { results: reviewResults });
      setSubmitResult(data);
    } catch { /* ignore */ }

    setSubmitting(false);
    setState("results");
  }, [errors, answers]);

  const handleNext = useCallback(() => {
    if (currentIdx < errors.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      submitReview();
    }
  }, [currentIdx, errors.length, submitReview]);

  if (state === "loading") {
    return (
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 14 }}>
        <LoadingOutlined style={{ fontSize: 28, color: "var(--accent)" }} />
        <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 700 }}>Đang chuẩn bị danh sách câu hỏi ôn lỗi sai...</span>
      </div>
    );
  }

  if (state === "empty") {
    return (
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: "60px 20px" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", padding: "48px 32px", textAlign: "center", maxWidth: 460, boxShadow: "var(--shadow-sm)" }}>
          <SmileOutlined style={{ fontSize: 36, color: "var(--success)", marginBottom: 12 }} />
          <h4 style={{ fontSize: 16, fontWeight: 900, color: "var(--text-primary)", margin: "0 0 6px" }}>Tuyệt vời! Không còn lỗi sai đến hạn</h4>
          <p style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
            Bạn đã ôn tập hoàn chỉnh các câu trả lời sai từ trước đến nay. Hãy tiếp tục làm các bài thi thử hoặc trắc nghiệm ngữ pháp để tích lũy dữ liệu.
          </p>
        </div>
      </div>
    );
  }

  if (state === "results") {
    const correctCount = results.filter((r) => r.correct).length;
    const percentage = Math.round((correctCount / results.length) * 100);
    const scoreColor = percentage >= 80 ? "var(--success)" : percentage >= 50 ? "var(--warning)" : "var(--error)";

    return (
      <div style={{ flex: 1, padding: "20px 16px 80px", maxWidth: 560, margin: "0 auto", width: "100%", overflowY: "auto" }} className="anim-fade-up">
        {/* Score summary panel */}
        <div style={{
          textAlign: "center", padding: "32px 20px", borderRadius: "var(--radius-xl)",
          background: "linear-gradient(135deg, var(--surface) 0%, var(--surface-alt) 100%)",
          border: "1.5px solid var(--border)", boxShadow: "var(--shadow-sm)", marginBottom: 24,
          position: "relative", overflow: "hidden"
        }}>
          <div style={{ position: "absolute", left: "50%", top: "0%", transform: "translateX(-50%)", width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle, var(--accent) 5%, transparent 70%)", opacity: 0.15, pointerEvents: "none" }} />
          
          <Progress
            type="circle"
            percent={percentage}
            size={120}
            strokeWidth={8}
            strokeColor={scoreColor}
            trailColor="var(--border)"
            format={() => (
              <div>
                <div style={{ fontSize: 24, fontWeight: 950, color: "var(--text-primary)" }}>{correctCount}/{results.length}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 800 }}>Vượt qua</div>
              </div>
            )}
          />
          
          <h3 style={{ margin: "16px 0 6px", fontSize: 18, fontWeight: 900, color: "var(--text-primary)" }}>
            {percentage >= 80 ? "Nắm vững kiến thức!" : percentage >= 50 ? "Kết quả khá tốt!" : "Cần rèn luyện thêm!"}
          </h3>

          {submitResult && (
            <div style={{ display: "flex", justifyContent: "center", gap: 10, margin: "6px 0 16px", fontSize: 12.5, flexWrap: "wrap" }}>
              {submitResult.resolved > 0 && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 12px",
                  borderRadius: 12, background: "rgba(16, 185, 129, 0.08)",
                  color: "var(--success)", fontWeight: 800, border: "1px solid rgba(16, 185, 129, 0.15)"
                }}>
                  <CheckCircleFilled style={{ fontSize: 12 }} /> Đã giải quyết: {submitResult.resolved}
                </span>
              )}
              {submitResult.rescheduled > 0 && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 12px",
                  borderRadius: 12, background: "rgba(245, 158, 11, 0.08)",
                  color: "var(--warning)", fontWeight: 800, border: "1px solid rgba(245, 158, 11, 0.15)"
                }}>
                  <ReloadOutlined style={{ fontSize: 11 }} /> Cần ôn lại: {submitResult.rescheduled}
                </span>
              )}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "center" }}>
            <m.button
              onClick={fetchDue}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 24px", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                color: "var(--text-on-accent)", fontSize: 13.5, fontWeight: 800, cursor: "pointer",
                boxShadow: "0 4px 12px var(--accent-muted)"
              }}
            >
              <ReloadOutlined /> Tiếp tục ôn lỗi
            </m.button>
          </div>
        </div>

        {/* Detailed result cards */}
        <h4 style={{ fontSize: 12, fontWeight: 850, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <InfoCircleOutlined />
          <span>Chi tiết các câu hỏi đã ôn tập</span>
        </h4>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {errors.map((err, i) => {
            const correct = results[i]?.correct ?? false;
            return (
              <div
                key={err.id}
                style={{
                  padding: "14px 16px", borderRadius: "var(--radius-lg)",
                  border: "1.5px solid var(--border)",
                  borderLeft: `4px solid ${correct ? "var(--success)" : "var(--error)"}`,
                  background: "var(--surface)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  {correct ? (
                    <CheckCircleFilled style={{ color: "var(--success)", fontSize: 15 }} />
                  ) : (
                    <CloseCircleFilled style={{ color: "var(--error)", fontSize: 15 }} />
                  )}
                  <span style={{ fontSize: 13.5, fontWeight: 900, color: correct ? "var(--success)" : "var(--error)" }}>
                    Câu {i + 1}: {correct ? "Chính xác" : "Chưa chính xác"}
                  </span>
                  
                  {err.grammarTopic && (
                    <span style={{ fontSize: 10.5, fontWeight: 800, background: "rgba(59, 130, 246, 0.08)", color: "#2563eb", padding: "1px 6px", borderRadius: 6, border: "1px solid rgba(59, 130, 246, 0.15)" }}>
                      {err.grammarTopic}
                    </span>
                  )}
                  
                  <span style={{ fontSize: 10.5, fontWeight: 700, background: "var(--surface-alt)", color: "var(--text-muted)", padding: "1px 6px", borderRadius: 6, border: "1px solid var(--border)", marginLeft: "auto" }}>
                    Lần ôn: {err.reviewCount + 1}
                  </span>
                </div>

                <p style={{ fontSize: 14, margin: "0 0 8px", lineHeight: 1.55, color: "var(--text-primary)", fontWeight: 500 }}>
                  {err.questionStem}
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: "var(--text-secondary)" }}>
                  <span>Đáp án chuẩn:</span>
                  <strong style={{ color: "var(--success)" }}>{err.correctAnswer}</strong>
                </div>

                {(err.explanationEn || err.explanationVi) && (
                  <ExplanationAccordion
                    title={
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <BulbOutlined style={{ color: "var(--warning)" }} />
                        <span>Xem phần giải thích chi tiết</span>
                      </span>
                    }
                  >
                    {err.explanationEn && (
                      <p style={{ margin: "0 0 6px", fontWeight: 700, color: "var(--text-primary)" }}>
                        {err.explanationEn}
                      </p>
                    )}
                    {err.explanationVi && (
                      <p style={{ margin: 0, color: "var(--text-secondary)", fontStyle: "italic", fontWeight: 500 }}>
                        {err.explanationVi}
                      </p>
                    )}
                  </ExplanationAccordion>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, padding: "20px 16px 80px", maxWidth: 520, margin: "0 auto", width: "100%" }} className="anim-fade-up">
      {/* Progress indicators */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, height: 6, background: "var(--border)", borderRadius: 3, position: "relative", overflow: "hidden" }}>
          <m.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentIdx + 1) / errors.length) * 100}%` }}
            style={{ height: "100%", background: "linear-gradient(to right, var(--accent), var(--secondary))", borderRadius: 3 }}
          />
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            padding: "2px 8px",
            borderRadius: 8,
            background: "var(--surface-alt)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          {currentIdx + 1} / {errors.length}
        </span>
      </div>

      {currentError && (
        <div style={{
          padding: 24,
          borderRadius: "var(--radius-xl)",
          background: "var(--surface)",
          border: "1.5px solid var(--border)",
          boxShadow: "var(--shadow-md)",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Decorative dynamic card glow */}
          <div style={{ position: "absolute", right: "-10%", top: "-10%", width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle, var(--accent) 5%, transparent 70%)", opacity: 0.05, pointerEvents: "none" }} />

          {/* Error tags row */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, fontWeight: 900, background: "var(--surface-alt)", color: "var(--text-secondary)", padding: "2px 6px", borderRadius: 6, border: "1px solid var(--border)" }}>
              Câu số {currentIdx + 1}
            </span>
            {currentError.grammarTopic && (
              <span style={{ fontSize: 10, fontWeight: 900, background: "rgba(59, 130, 246, 0.08)", color: "#2563eb", padding: "2px 6px", borderRadius: 6, border: "1px solid rgba(59, 130, 246, 0.15)" }}>
                {currentError.grammarTopic}
              </span>
            )}
            <span style={{ fontSize: 10, fontWeight: 800, background: "rgba(245, 158, 11, 0.08)", color: "var(--warning)", padding: "2px 6px", borderRadius: 6, border: "1px solid rgba(245, 158, 11, 0.15)" }}>
              Lần ôn: {currentError.reviewCount + 1}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginLeft: "auto", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Nguồn: {currentError.sourceModule}
            </span>
          </div>

          {/* Question stem */}
          <p style={{ fontSize: 15.5, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 20px", lineHeight: 1.55 }}>
            {currentError.questionStem}
          </p>

          {/* Multiple options layout */}
          {currentError.options && currentError.options.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {currentError.options.map((opt, oi) => {
                const isSelected = answers[currentIdx] === oi;
                return (
                  <m.button
                    key={oi}
                    onClick={() => selectAnswer(oi)}
                    disabled={submitting}
                    whileHover={{ x: 3, borderColor: "var(--accent)" }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "12px 14px",
                      borderRadius: "var(--radius-lg)",
                      border: "1.5px solid var(--border)",
                      borderColor: isSelected ? "var(--accent)" : "var(--border)",
                      background: isSelected ? "var(--accent-light)" : "var(--surface)",
                      color: isSelected ? "var(--accent)" : "var(--text-primary)",
                      textAlign: "left",
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: isSelected ? 800 : 600,
                      fontFamily: "var(--font-body)",
                      transition: "border-color 0.2s, background-color 0.2s",
                    }}
                  >
                    <span style={{ marginRight: 8, opacity: 0.6 }}>
                      {String.fromCharCode(65 + oi)}.
                    </span>
                    <span>{opt}</span>
                  </m.button>
                );
              })}
            </div>
          ) : (
            /* True/False flashcard style question when no options are seeded */
            <div style={{ padding: 16, background: "var(--surface-alt)", borderRadius: "var(--radius-lg)", border: "1px dashed var(--border)" }}>
              <span style={{ fontSize: 11.5, color: "var(--text-muted)", display: "block", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Đáp án chuẩn xác là:
              </span>
              <div style={{ fontSize: 15, fontWeight: 800, color: "var(--success)", marginBottom: 12 }}>
                {currentError.correctAnswer}
              </div>
              <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600, display: "block", marginBottom: 12 }}>
                Bạn đã ghi nhớ cấu trúc ngữ pháp này chưa?
              </span>
              <div style={{ display: "flex", gap: 10 }}>
                <m.button
                  onClick={() => setAnswers((prev) => ({ ...prev, [currentIdx]: 0 }))}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    flex: 1, padding: "8px 14px", borderRadius: 8,
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                    background: answers[currentIdx] === 0 ? "rgba(16, 185, 129, 0.12)" : "var(--surface)",
                    color: "var(--success)", fontWeight: 800, cursor: "pointer", fontSize: 13,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    fontFamily: "var(--font-body)",
                  }}
                >
                  <CheckCircleFilled style={{ fontSize: 14 }} /> Đã nhớ bài
                </m.button>
                <m.button
                  onClick={() => setAnswers((prev) => ({ ...prev, [currentIdx]: 1 }))}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    flex: 1, padding: "8px 14px", borderRadius: 8,
                    border: "1px solid rgba(239, 68, 68, 0.25)",
                    background: answers[currentIdx] === 1 ? "rgba(239, 68, 68, 0.12)" : "var(--surface)",
                    color: "var(--error)", fontWeight: 800, cursor: "pointer", fontSize: 13,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    fontFamily: "var(--font-body)",
                  }}
                >
                  <CloseCircleFilled style={{ fontSize: 14 }} /> Chưa thuộc
                </m.button>
              </div>
            </div>
          )}

          {/* Action button */}
          <div style={{ marginTop: 20 }}>
            <m.button
              onClick={handleNext}
              disabled={answers[currentIdx] === null || answers[currentIdx] === undefined || submitting}
              whileHover={answers[currentIdx] !== null && answers[currentIdx] !== undefined && !submitting ? { scale: 1.02 } : {}}
              whileTap={answers[currentIdx] !== null && answers[currentIdx] !== undefined && !submitting ? { scale: 0.98 } : {}}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "var(--radius-lg)",
                border: "none",
                background: (answers[currentIdx] !== null && answers[currentIdx] !== undefined) ? "var(--accent)" : "var(--border)",
                color: (answers[currentIdx] !== null && answers[currentIdx] !== undefined) ? "var(--text-on-accent)" : "var(--text-secondary)",
                fontSize: 14,
                fontWeight: 800,
                cursor: (answers[currentIdx] !== null && answers[currentIdx] !== undefined) ? "pointer" : "not-allowed",
                transition: "background 0.25s, color 0.25s",
                boxShadow: (answers[currentIdx] !== null && answers[currentIdx] !== undefined) ? "0 4px 12px var(--accent-muted)" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {submitting ? (
                <LoadingOutlined spin />
              ) : (
                <>
                  <span>{currentIdx < errors.length - 1 ? "Câu tiếp theo" : "Hoàn thành ôn tập"}</span>
                  <ArrowRightOutlined />
                </>
              )}
            </m.button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page with Tabs
export default function ReviewQuizPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("vocab");
  const [errorDue, setErrorDue] = useState(0);
  const [vocabDue, setVocabDue] = useState(0);

  useEffect(() => {
    api.get<{ dueCount?: number }>("/review-quiz/due").then((d) => { if (d) setErrorDue(d.dueCount ?? 0); }).catch(() => {});
    api.get<{ dueCount?: number }>("/vocabulary/due").then((d) => { if (d) setVocabDue(d.dueCount ?? 0); }).catch(() => {});
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div className="grain-overlay" style={{ opacity: 0.03, zIndex: 0 }} />

      {/* Main header banner */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <ModuleHeader
          icon={<BulbOutlined />}
          gradient="var(--gradient-review)"
          title="Luyện tập lặp lại cách quãng"
          subtitle="Hệ thống SRS tự động giúp tối ưu hóa khả năng ghi nhớ từ vựng và khắc phục các lỗi sai ngữ pháp"
        />
      </div>

      {/* Styled custom glass tab list */}
      <div style={{ padding: "8px 20px 0", position: "relative", zIndex: 1 }}>
        <div style={{
          display: "flex",
          gap: 6,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl)",
          padding: "4px",
          boxShadow: "var(--shadow-sm)",
          maxWidth: 320,
          margin: "0 auto 16px"
        }}>
          {([
            { key: "vocab", label: "Từ vựng", icon: <BookOutlined />, due: vocabDue },
            { key: "errors", label: "Lỗi sai", icon: <BulbOutlined />, due: errorDue }
          ] as const).map((tabItem) => {
            const isTabActive = activeTab === tabItem.key;
            return (
              <m.button
                key={tabItem.key}
                onClick={() => setActiveTab(tabItem.key)}
                whileTap={{ scale: 0.97 }}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: "var(--radius-lg)",
                  border: "none",
                  background: isTabActive ? "var(--accent)" : "transparent",
                  color: isTabActive ? "var(--text-on-accent)" : "var(--text-secondary)",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  transition: "color 0.2s, background 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                {tabItem.icon}
                <span>{tabItem.label}</span>
                {tabItem.due > 0 && (
                  <span style={{
                    fontSize: 10.5,
                    fontWeight: 900,
                    padding: "1px 5px",
                    borderRadius: 8,
                    background: isTabActive ? "rgba(255,255,255,0.25)" : "var(--accent)",
                    color: isTabActive ? "var(--text-on-accent)" : "var(--text-on-accent)",
                  }}>
                    {tabItem.due}
                  </span>
                )}
              </m.button>
            );
          })}
        </div>
      </div>

      {/* Tab content area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", zIndex: 1 }}>
        {activeTab === "vocab" ? <VocabReviewTab /> : <ErrorReviewTab />}
      </div>
    </div>
  );
}
