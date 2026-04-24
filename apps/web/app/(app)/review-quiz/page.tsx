"use client";
import { api } from "@/lib/api-client";
import { useState, useCallback, useEffect, useRef } from "react";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  ReloadOutlined,
  BulbOutlined,
  TrophyOutlined,
  InfoCircleOutlined,
  BookOutlined,
  SmileOutlined,
} from "@ant-design/icons";
import { Tag, Progress, Collapse, Empty, Badge } from "antd";
import { ModuleHeader } from "@/components/shared/ModuleHeader";

// ─── Error Review Types (existing) ────────────────────────────────
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

// ─── Vocabulary Review Types (new) ────────────────────────────────
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

// (PageHeader removed — using shared ModuleHeader)


function MasteryBadge({ level }: { level: string }) {
  const config: Record<string, { color: string; label: string }> = {
    new: { color: "var(--text-disabled)", label: "Mới" },
    learning: { color: "var(--warning)", label: "Đang học" },
    reviewing: { color: "var(--info)", label: "Ôn tập" },
    mastered: { color: "var(--success)", label: "Thuần thục" },
  };
  const c = config[level] ?? config.new;
  return <Tag color={c.color} style={{ fontSize: 10, borderRadius: 99 }}>{c.label}</Tag>;
}

// ─── Quiz Question Generator ─────────────────────────────────────
function generateQuizQuestions(words: VocabWord[], distractors: DistractorWord[]): QuizQuestion[] {
  return words.map((word, idx) => {
    // Alternate between vi→en and en→vi
    const mode: "vi-to-en" | "en-to-vi" = idx % 2 === 0 ? "vi-to-en" : "en-to-vi";

    // Build options
    const sameLevelDistractors = distractors.filter(
      (d) => d.query !== word.query && d.level === word.level,
    );
    const otherDistractors = distractors.filter(
      (d) => d.query !== word.query && d.level !== word.level,
    );
    const pool = [...sameLevelDistractors, ...otherDistractors];

    // Pick 3 unique distractors
    const chosen: DistractorWord[] = [];
    const used = new Set<string>([word.query]);
    for (const d of pool) {
      if (chosen.length >= 3) break;
      if (used.has(d.query)) continue;
      used.add(d.query);
      chosen.push(d);
    }

    // F3 fix: Pad to always have 4 options even with few distractors
    while (chosen.length < 3) {
      const placeholder = `---`;
      chosen.push({ query: `_pad_${chosen.length}`, headword: placeholder, overviewVi: placeholder, level: null });
    }

    let options: string[];
    let correctIndex: number;

    if (mode === "vi-to-en") {
      // Show Vietnamese definition → pick English word
      const allOptions = [word.headword, ...chosen.map((d) => d.headword)];
      // Shuffle
      const shuffled = allOptions.sort(() => Math.random() - 0.5);
      correctIndex = shuffled.indexOf(word.headword);
      options = shuffled;
    } else {
      // Show English word → pick Vietnamese definition
      const allOptions = [word.overviewVi, ...chosen.map((d) => d.overviewVi)];
      const shuffled = allOptions.sort(() => Math.random() - 0.5);
      correctIndex = shuffled.indexOf(word.overviewVi);
      options = shuffled;
    }

    return { word, mode, options, correctIndex };
  });
}

// ─── Vocab Review Tab ────────────────────────────────────────────
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

  // Fetch due vocabulary
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

  // Record answer timing
  useEffect(() => {
    questionStartRef.current = Date.now();
  }, [currentIdx]);

  // Select answer
  const selectAnswer = useCallback((optionIdx: number) => {
    setAnswers((prev) => {
      if (prev[currentIdx] !== undefined) return prev; // Already answered
      return { ...prev, [currentIdx]: optionIdx };
    });
  }, [currentIdx]);

  // Derive quality from correctness + timing
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

  // Next or submit — F4 fix: build final result inline, pass to submitReview
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

  // Loading
  if (state === "loading") {
    return (
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 12 }}>
        <LoadingOutlined style={{ fontSize: 32, color: "var(--accent)" }} />
        <p style={{ color: "var(--text-secondary)" }}>Đang tải từ vựng cần ôn...</p>
      </div>
    );
  }

  // Empty
  if (state === "empty") {
    return (
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: 32 }}>
        <Empty
          description={
            <div>
              <p style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}><SmileOutlined /> Không có từ nào cần ôn!</p>
              <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: 13 }}>
                Tra từ điển và lưu từ vựng để hệ thống SRS tự động nhắc bạn ôn tập.
              </p>
            </div>
          }
        />
      </div>
    );
  }

  // Results
  if (state === "results" && submitResult) {
    const correctCount = submitResult.words.filter((w) => w.correct).length;
    const percentage = submitResult.accuracy;
    const scoreColor = percentage >= 80 ? "var(--success)" : percentage >= 50 ? "var(--warning)" : "var(--error)";

    return (
      <div style={{ flex: 1, padding: 24, maxWidth: 640, margin: "0 auto", width: "100%", overflow: "auto" }}>
        {/* Score hero card */}
        <div style={{
          textAlign: "center", padding: "36px 28px 32px", borderRadius: 20,
          background: "linear-gradient(180deg, var(--card-bg) 0%, color-mix(in srgb, var(--accent) 4%, var(--surface)) 100%)",
          border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)", marginBottom: 20,
        }}>
          <Progress
            type="circle"
            percent={percentage}
            size={140}
            strokeWidth={8}
            strokeColor={scoreColor}
            trailColor="var(--border)"
            format={() => (
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, color: "var(--ink)" }}>{correctCount}/{submitResult.words.length}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>{percentage}%</div>
              </div>
            )}
          />
          <h2 style={{ margin: "20px 0 6px", fontSize: 22, fontWeight: 800, color: "var(--ink)" }}>
            {percentage >= 80 ? "Xuất sắc!" : percentage >= 50 ? "Khá tốt!" : "Cần ôn thêm!"}
          </h2>
          {submitResult.xpEarned > 0 && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 18px", borderRadius: 99,
              background: "color-mix(in srgb, var(--accent) 12%, var(--surface))",
              color: "var(--accent)", fontSize: 16, fontWeight: 800, margin: "12px 0 20px",
            }}>
              <TrophyOutlined style={{ fontSize: 14 }} /> +{submitResult.xpEarned} XP
            </div>
          )}
          <div>
            <button
              onClick={fetchDue}
              style={{
                padding: "12px 28px", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, var(--accent), var(--secondary))",
                color: "var(--text-on-accent, #fff)", fontSize: 14, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 12px color-mix(in srgb, var(--accent) 25%, transparent)",
              }}
            >
              <ReloadOutlined style={{ marginRight: 6 }} /> Ôn tiếp
            </button>
          </div>
        </div>

        {/* Per-word detail */}
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 10, paddingLeft: 4 }}>
          Chi tiết từ vựng
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {submitResult.words.map((w) => {
            const question = questions.find((q) => q.word.query === w.query);
            return (
              <div
                key={w.query}
                style={{
                  padding: "14px 16px", borderRadius: 14,
                  border: "1px solid var(--border)",
                  borderLeft: `4px solid ${w.correct ? "var(--success)" : "var(--error)"}`,
                  background: "var(--card-bg)", boxShadow: "var(--shadow-sm)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  {w.correct ? <CheckCircleOutlined style={{ color: "var(--success)", fontSize: 16 }} /> : <CloseCircleOutlined style={{ color: "var(--error)", fontSize: 16 }} />}
                  <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{question?.word.headword ?? w.query}</span>
                  <MasteryBadge level={w.masteryLevel} />
                </div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
                  {question?.word.overviewVi}
                </p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0" }}>
                  Ôn lại sau {w.interval} ngày
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Quiz mode
  if (!currentQ) return null;
  const answered = answers[currentIdx] !== undefined;
  const isCorrect = answered && answers[currentIdx] === currentQ.correctIndex;

  return (
    <div style={{ flex: 1, padding: 24, maxWidth: 640, margin: "0 auto", width: "100%" }}>
      {/* Progress bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <Progress
          percent={((currentIdx + 1) / questions.length) * 100}
          size="small"
          showInfo={false}
          style={{ flex: 1 }}
        />
        <Tag color="orange" style={{ borderRadius: 99 }}>
          {currentIdx + 1}/{questions.length}
        </Tag>
      </div>

      {/* Quiz card */}
      <div style={{ padding: 24, borderRadius: 16, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
        {/* Word info tags */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {currentQ.word.level && <Tag color="blue" style={{ fontSize: 11 }}>{currentQ.word.level}</Tag>}
          {currentQ.word.partOfSpeech && <Tag color="default" style={{ fontSize: 11 }}>{currentQ.word.partOfSpeech}</Tag>}
          <MasteryBadge level={currentQ.word.masteryLevel} />
          <Tag color={currentQ.mode === "vi-to-en" ? "purple" : "cyan"} style={{ fontSize: 10 }}>
            {currentQ.mode === "vi-to-en" ? "🇻🇳 → 🇬🇧" : "🇬🇧 → 🇻🇳"}
          </Tag>
        </div>

        {/* Question stem */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 4px" }}>
            {currentQ.mode === "vi-to-en" ? "Chọn từ tiếng Anh đúng:" : "Chọn nghĩa tiếng Việt đúng:"}
          </p>
          <p style={{ fontSize: 18, fontWeight: 600, margin: 0, lineHeight: 1.4 }}>
            {currentQ.mode === "vi-to-en" ? currentQ.word.overviewVi : currentQ.word.headword}
          </p>
        </div>

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {currentQ.options.map((opt, oi) => {
            let borderColor = "var(--border)";
            let bgColor = "transparent";
            let textColor = "var(--text)";
            let fontWeight = 400;

            if (answered) {
              if (oi === currentQ.correctIndex) {
                borderColor = "var(--success)";
                bgColor = "color-mix(in srgb, var(--success) 8%, transparent)";
                textColor = "var(--success)";
                fontWeight = 600;
              } else if (oi === answers[currentIdx] && oi !== currentQ.correctIndex) {
                borderColor = "var(--error)";
                bgColor = "color-mix(in srgb, var(--error) 8%, transparent)";
                textColor = "var(--error)";
                fontWeight = 600;
              }
            } else if (answers[currentIdx] === oi) {
              borderColor = "var(--accent)";
              bgColor = "var(--accent-muted)";
              textColor = "var(--accent)";
              fontWeight = 600;
            }

            return (
              <button
                key={oi}
                onClick={() => selectAnswer(oi)}
                disabled={answered}
                style={{
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: `2px solid ${borderColor}`,
                  background: bgColor,
                  color: textColor,
                  textAlign: "left",
                  cursor: answered ? "default" : "pointer",
                  fontSize: 14,
                  fontWeight,
                  transition: "all 0.2s",
                }}
              >
                {String.fromCharCode(65 + oi)}. {opt}
              </button>
            );
          })}
        </div>

        {/* Feedback after answering */}
        {answered && (
          <div
            style={{
              marginTop: 12,
              padding: "10px 14px",
              borderRadius: 8,
              background: isCorrect ? "color-mix(in srgb, var(--success) 7%, transparent)" : "color-mix(in srgb, var(--error) 7%, transparent)",
              border: `1px solid ${isCorrect ? "color-mix(in srgb, var(--success) 20%, transparent)" : "color-mix(in srgb, var(--error) 20%, transparent)"}`,
              fontSize: 13,
            }}
          >
            {isCorrect ? (
              <span style={{ color: "var(--success)" }}><CheckCircleOutlined /> Chính xác!</span>
            ) : (
              <span style={{ color: "var(--error)" }}>
                <CloseCircleOutlined /> Sai — Đáp án đúng: <strong>{currentQ.options[currentQ.correctIndex]}</strong>
              </span>
            )}
          </div>
        )}

        {/* Next button */}
        <div style={{ marginTop: 16 }}>
          <button
            onClick={handleNext}
            disabled={!answered || submitting}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 10,
              border: "none",
              background: answered ? "var(--accent)" : "var(--border)",
              color: answered ? "var(--text-on-accent, #fff)" : "var(--text-secondary)",
              fontSize: 15,
              fontWeight: 600,
              cursor: answered ? "pointer" : "not-allowed",
            }}
          >
            {submitting ? <LoadingOutlined /> : currentIdx < questions.length - 1 ? "Câu tiếp →" : "Hoàn thành ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Error Review Tab (existing, extracted) ──────────────────────
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
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 12 }}>
        <LoadingOutlined style={{ fontSize: 32, color: "var(--accent)" }} />
        <p style={{ color: "var(--text-secondary)" }}>Đang tải lỗi sai cần ôn...</p>
      </div>
    );
  }

  if (state === "empty") {
    return (
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: 32 }}>
        <Empty
          description={
            <div>
              <p style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}><SmileOutlined /> Không có lỗi nào cần ôn!</p>
              <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: 13 }}>
                Hãy luyện tập Grammar Quiz hoặc Mock Test để hệ thống ghi nhận lỗi sai.
              </p>
            </div>
          }
        />
      </div>
    );
  }

  if (state === "results") {
    const correctCount = results.filter((r) => r.correct).length;
    const percentage = Math.round((correctCount / results.length) * 100);
    const scoreColor = percentage >= 80 ? "var(--success)" : percentage >= 50 ? "var(--warning)" : "var(--error)";

    return (
      <div style={{ flex: 1, padding: 24, maxWidth: 640, margin: "0 auto", width: "100%", overflow: "auto" }}>
        {/* Score hero card */}
        <div style={{
          textAlign: "center", padding: "36px 28px 32px", borderRadius: 20,
          background: "linear-gradient(180deg, var(--card-bg) 0%, color-mix(in srgb, var(--accent) 4%, var(--surface)) 100%)",
          border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)", marginBottom: 20,
        }}>
          <Progress
            type="circle"
            percent={percentage}
            size={140}
            strokeWidth={8}
            strokeColor={scoreColor}
            trailColor="var(--border)"
            format={() => (
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, color: "var(--ink)" }}>{correctCount}/{results.length}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>{percentage}%</div>
              </div>
            )}
          />
          <h2 style={{ margin: "20px 0 6px", fontSize: 22, fontWeight: 800, color: "var(--ink)" }}>
            {percentage >= 80 ? "Xuất sắc!" : percentage >= 50 ? "Khá tốt!" : "Cần ôn thêm!"}
          </h2>
          {submitResult && (
            <div style={{ display: "flex", justifyContent: "center", gap: 16, margin: "12px 0 20px", fontSize: 13 }}>
              {submitResult.resolved > 0 && (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 14px",
                  borderRadius: 99, background: "color-mix(in srgb, var(--success) 10%, var(--surface))",
                  color: "var(--success)", fontWeight: 700,
                }}>
                  <CheckCircleOutlined /> {submitResult.resolved} đã nắm vững
                </div>
              )}
              {submitResult.rescheduled > 0 && (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 14px",
                  borderRadius: 99, background: "color-mix(in srgb, var(--warning) 10%, var(--surface))",
                  color: "var(--warning)", fontWeight: 700,
                }}>
                  <ReloadOutlined /> {submitResult.rescheduled} sẽ ôn lại
                </div>
              )}
            </div>
          )}
          <button
            onClick={fetchDue}
            style={{
              padding: "12px 28px", borderRadius: 12, border: "none",
              background: "linear-gradient(135deg, var(--accent), var(--secondary))",
              color: "var(--text-on-accent, #fff)", fontSize: 14, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 4px 12px color-mix(in srgb, var(--accent) 25%, transparent)",
            }}
          >
            <ReloadOutlined style={{ marginRight: 6 }} /> Ôn tiếp
          </button>
        </div>

        {/* Section label */}
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 10, paddingLeft: 4 }}>
          <InfoCircleOutlined style={{ marginRight: 5 }} /> Chi tiết kết quả
        </div>

        {/* Result detail cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {errors.map((err, i) => {
            const correct = results[i]?.correct ?? false;
            return (
              <div
                key={err.id}
                style={{
                  padding: "14px 16px", borderRadius: 14,
                  border: "1px solid var(--border)",
                  borderLeft: `4px solid ${correct ? "var(--success)" : "var(--error)"}`,
                  background: "var(--card-bg)", boxShadow: "var(--shadow-sm)",
                  transition: "box-shadow 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  {correct
                    ? <CheckCircleOutlined style={{ color: "var(--success)", fontSize: 16 }} />
                    : <CloseCircleOutlined style={{ color: "var(--error)", fontSize: 16 }} />}
                  <span style={{ fontSize: 13, fontWeight: 700, color: correct ? "var(--success)" : "var(--error)" }}>
                    Câu {i + 1}: {correct ? "Đúng" : "Sai"}
                  </span>
                  {err.grammarTopic && <Tag color="blue" style={{ fontSize: 10, borderRadius: 6, margin: 0 }}>{err.grammarTopic}</Tag>}
                  <Tag style={{ fontSize: 10, borderRadius: 6, margin: 0, marginLeft: "auto" }} color="default">Ôn lần {err.reviewCount + 1}</Tag>
                </div>
                <p style={{ fontSize: 13, margin: "0 0 8px", lineHeight: 1.5, color: "var(--text)" }}>{err.questionStem}</p>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  Đáp án đúng: <strong style={{ color: "var(--success)" }}>{err.correctAnswer}</strong>
                </div>
                {(err.explanationEn || err.explanationVi) && (
                  <Collapse
                    size="small"
                    style={{ marginTop: 8, borderRadius: 8 }}
                    items={[{
                      key: `exp-${i}`,
                      label: <span style={{ fontSize: 12, fontWeight: 600 }}><BulbOutlined style={{ marginRight: 4 }} /> Giải thích</span>,
                      children: (
                        <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                          {err.explanationEn && <p style={{ margin: "0 0 4px" }}>{err.explanationEn}</p>}
                          {err.explanationVi && <p style={{ margin: 0, color: "var(--text-secondary)", fontStyle: "italic" }}>{err.explanationVi}</p>}
                        </div>
                      ),
                    }]}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Quiz mode
  return (
    <div style={{ flex: 1, padding: 24, maxWidth: 640, margin: "0 auto", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <Progress
          percent={((currentIdx + 1) / errors.length) * 100}
          size="small"
          showInfo={false}
          style={{ flex: 1 }}
        />
        <Tag color="orange" style={{ borderRadius: 99 }}>
          {currentIdx + 1}/{errors.length}
        </Tag>
      </div>

      {currentError && (
        <div style={{ padding: 20, borderRadius: 14, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <Tag color="default" style={{ fontSize: 12 }}>Câu {currentIdx + 1}</Tag>
            {currentError.grammarTopic && <Tag color="blue" style={{ fontSize: 11 }}>{currentError.grammarTopic}</Tag>}
            <Tag color="orange" style={{ fontSize: 10 }}>Ôn lần {currentError.reviewCount + 1}</Tag>
            <Tag color="default" style={{ fontSize: 10 }}>{currentError.sourceModule}</Tag>
          </div>

          <p style={{ fontSize: 15, fontWeight: 500, margin: "0 0 16px", lineHeight: 1.5 }}>
            {currentError.questionStem}
          </p>

          {currentError.options && currentError.options.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {currentError.options.map((opt, oi) => (
                <button
                  key={oi}
                  onClick={() => selectAnswer(oi)}
                  style={{
                    padding: "10px 14px", borderRadius: 8,
                    border: answers[currentIdx] === oi ? "2px solid var(--accent)" : "1px solid var(--border)",
                    background: answers[currentIdx] === oi ? "var(--accent-muted)" : "transparent",
                    color: answers[currentIdx] === oi ? "var(--accent)" : "var(--text)",
                    textAlign: "left", cursor: "pointer", fontSize: 14,
                    fontWeight: answers[currentIdx] === oi ? 600 : 400,
                  }}
                >
                  {String.fromCharCode(65 + oi)}. {opt}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ padding: 12, background: "var(--surface-alt)", borderRadius: 8, fontSize: 13 }}>
              Đáp án đúng là: <strong>{currentError.correctAnswer}</strong>
              <br />
              <span style={{ color: "var(--text-secondary)" }}>Bạn đã nhớ chưa?</span>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  onClick={() => { setAnswers((prev) => ({ ...prev, [currentIdx]: 0 })); }}
                  style={{ padding: "6px 16px", borderRadius: 6, border: "1px solid var(--success)44", background: answers[currentIdx] === 0 ? "color-mix(in srgb, var(--success) 13%, transparent)" : "transparent", cursor: "pointer", fontSize: 13, color: "var(--success)" }}
                >
                  <CheckCircleOutlined /> Đã nhớ
                </button>
                <button
                  onClick={() => { setAnswers((prev) => ({ ...prev, [currentIdx]: 1 })); }}
                  style={{ padding: "6px 16px", borderRadius: 6, border: "1px solid var(--error)44", background: answers[currentIdx] === 1 ? "color-mix(in srgb, var(--error) 13%, transparent)" : "transparent", cursor: "pointer", fontSize: 13, color: "var(--error)" }}
                >
                  <CloseCircleOutlined /> Chưa nhớ
                </button>
              </div>
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <button
              onClick={handleNext}
              disabled={answers[currentIdx] === null || answers[currentIdx] === undefined || submitting}
              style={{
                width: "100%", padding: "12px", borderRadius: 10, border: "none",
                background: (answers[currentIdx] !== null && answers[currentIdx] !== undefined) ? "var(--accent)" : "var(--border)",
                color: (answers[currentIdx] !== null && answers[currentIdx] !== undefined) ? "var(--text-on-accent, #fff)" : "var(--text-secondary)",
                fontSize: 15, fontWeight: 600,
                cursor: (answers[currentIdx] !== null && answers[currentIdx] !== undefined) ? "pointer" : "not-allowed",
              }}
            >
              {submitting ? <LoadingOutlined /> : currentIdx < errors.length - 1 ? "Câu tiếp →" : "Hoàn thành ✓"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page with Tabs ─────────────────────────────────────────
export default function ReviewQuizPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("vocab");
  const [errorDue, setErrorDue] = useState(0);
  const [vocabDue, setVocabDue] = useState(0);

  // Fetch badge counts
  useEffect(() => {
    api.get<{ dueCount?: number }>("/review-quiz/due").then((d) => { if(d) setErrorDue(d.dueCount ?? 0) }).catch(() => {});
    api.get<{ dueCount?: number }>("/vocabulary/due").then((d) => { if(d) setVocabDue(d.dueCount ?? 0) }).catch(() => {});
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <ModuleHeader
        icon={<BulbOutlined />}
        gradient="var(--gradient-review)"
        title="Ôn tập thông minh 🧠"
        subtitle="SRS — Hệ thống ôn tập lặp lại cách quãng"
      />

      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", padding: "0 24px" }}>
        <button
          onClick={() => setActiveTab("vocab")}
          style={{
            padding: "12px 20px",
            border: "none",
            background: "none",
            borderBottom: activeTab === "vocab" ? "2px solid var(--accent)" : "2px solid transparent",
            color: activeTab === "vocab" ? "var(--accent)" : "var(--text-secondary)",
            fontWeight: activeTab === "vocab" ? 600 : 400,
            fontSize: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <BookOutlined />
          Từ vựng
          {vocabDue > 0 && (
            <Badge count={vocabDue} size="small" style={{ backgroundColor: "var(--accent)" }} />
          )}
        </button>
        <button
          onClick={() => setActiveTab("errors")}
          style={{
            padding: "12px 20px",
            border: "none",
            background: "none",
            borderBottom: activeTab === "errors" ? "2px solid var(--accent)" : "2px solid transparent",
            color: activeTab === "errors" ? "var(--accent)" : "var(--text-secondary)",
            fontWeight: activeTab === "errors" ? 600 : 400,
            fontSize: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <BulbOutlined />
          Lỗi sai
          {errorDue > 0 && (
            <Badge count={errorDue} size="small" style={{ backgroundColor: "var(--accent)" }} />
          )}
        </button>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
        {activeTab === "vocab" ? <VocabReviewTab /> : <ErrorReviewTab />}
      </div>
    </div>
  );
}
