"use client";

import { api } from "@/lib/api-client";
import { useState, useCallback, useRef, useEffect } from "react";
import {
  FileSearchOutlined,
  TrophyOutlined,
  BarChartOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { Tag } from "antd";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { useExamMode } from "@/components/shared/ExamModeProvider";

import type { MockQuestion, TestState } from "./_components/types";
import { isFillBlank } from "./_components/types";
import { MockTestIdle, MockTestLoading } from "./_components/MockTestIdle";
import { MockTestActive } from "./_components/MockTestActive";
import { MockTestReview } from "./_components/MockTestReview";

export default function MockTestPage() {
  const { examMode, label: modeLabel } = useExamMode();
  const [state, setState] = useState<TestState>("idle");
  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const [passage, setPassage] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<(number | string | null)[]>([]);
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeLimit, setTimeLimit] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(15);
  const [fillBlankInputs, setFillBlankInputs] = useState<Record<number, string>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Timer ───
  useEffect(() => {
    if (state !== "active") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setState("review");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [state]);

  // ─── Generate test ───
  const startTest = useCallback(async () => {
    setState("loading");
    setError(null);

    try {
      const data = await api.post<{ questions: MockQuestion[]; passage?: string; timeLimit: number }>("/mock-test/generate", {
        examMode, questionCount,
      });
      setQuestions(data.questions);
      setPassage(data.passage ?? null);
      setAnswers(new Array(data.questions.length).fill(null));
      setFillBlankInputs({});
      setFlagged(new Set());
      setCurrentIdx(0);
      setTimeLimit(data.timeLimit);
      setTimeLeft(data.timeLimit);
      setState("active");
    } catch {
      setError("Không thể tạo đề thi. Vui lòng thử lại.");
      setState("idle");
    }
  }, [examMode, questionCount]);

  // ─── Answer ───
  const selectAnswer = useCallback((idx: number, value: number | string) => {
    setAnswers((prev) => { const next = [...prev]; next[idx] = value; return next; });
  }, []);

  const toggleFlag = useCallback((idx: number) => {
    setFlagged((prev) => { const next = new Set(prev); if (next.has(idx)) next.delete(idx); else next.add(idx); return next; });
  }, []);

  const handleFillBlank = useCallback((idx: number, value: string) => {
    setFillBlankInputs((prev) => ({ ...prev, [idx]: value }));
  }, []);

  // ─── Submit ───
  const submitTest = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setState("review");

    const wrongAnswers = questions
      .map((q, i) => {
        const fb = isFillBlank(q.type);
        const userAns = fb ? (fillBlankInputs[i] ?? "").trim() : (q.options?.[answers[i] as number] ?? "(không trả lời)");
        const correctAns = fb ? (q.correctAnswer ?? "") : (q.options?.[q.correctIndex ?? -1] ?? "");
        const correct = fb ? userAns.toLowerCase() === correctAns.toLowerCase() : answers[i] === q.correctIndex;
        if (correct) return null;
        return { sourceModule: "mock-test", questionStem: q.stem, options: q.options, userAnswer: userAns || "(không trả lời)", correctAnswer: correctAns, explanationEn: q.explanationEn, explanationVi: q.explanationVi, grammarTopic: q.topic };
      })
      .filter(Boolean);

    if (wrongAnswers.length > 0) {
      api.post("/errors", { errors: wrongAnswers }).catch(() => {});
    }
  }, [questions, answers, fillBlankInputs]);

  // ─── Scoring ───
  const getScore = () => {
    let correct = 0;
    questions.forEach((q, i) => {
      if (isFillBlank(q.type)) {
        if ((fillBlankInputs[i] ?? "").trim().toLowerCase() === (q.correctAnswer ?? "").trim().toLowerCase()) correct++;
      } else {
        if (answers[i] === q.correctIndex) correct++;
      }
    });
    return correct;
  };

  const score = state === "review" ? getScore() : 0;
  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  const handleRetry = useCallback(() => {
    setState("idle");
    setQuestions([]);
    setPassage(null);
    setAnswers([]);
    setFillBlankInputs({});
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, flex: 1, overflow: "auto" }}>
      {/* Header */}
      <ModuleHeader
        icon={<FileSearchOutlined />}
        gradient="var(--gradient-mock-test)"
        title="Mini Mock Test"
        subtitle={`Thi thử ${modeLabel} — luyện tập dưới áp lực thời gian`}
        action={
          <Tag color={examMode === "toeic" ? "blue" : "purple"} style={{ borderRadius: 99, margin: 0 }}>
            {examMode === "toeic" ? <BarChartOutlined /> : <TrophyOutlined />} {modeLabel}
          </Tag>
        }
      />

      <div style={{ flex: 1, padding: "24px 16px 40px", maxWidth: 720, margin: "0 auto", width: "100%" }}>
        {/* Error banner */}
        {error && (
          <div className="anim-fade-in" style={{
            borderRadius: 16, border: "1px solid color-mix(in srgb, var(--error) 30%, transparent)",
            background: "color-mix(in srgb, var(--error) 6%, var(--surface))",
            padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, marginBottom: 16,
          }}>
            <ExclamationCircleOutlined style={{ fontSize: 16, color: "var(--error)", flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "var(--error)", fontWeight: 500 }}>{error}</span>
          </div>
        )}

        {state === "idle" && (
          <MockTestIdle
            examMode={examMode}
            modeLabel={modeLabel}
            questionCount={questionCount}
            setQuestionCount={setQuestionCount}
            onStart={startTest}
          />
        )}

        {state === "loading" && <MockTestLoading modeLabel={modeLabel} />}

        {state === "active" && (
          <MockTestActive
            questions={questions}
            passage={passage}
            currentIdx={currentIdx}
            setCurrentIdx={setCurrentIdx}
            answers={answers}
            fillBlankInputs={fillBlankInputs}
            flagged={flagged}
            timeLeft={timeLeft}
            onSelectAnswer={selectAnswer}
            onToggleFlag={toggleFlag}
            onSetFillBlankInput={handleFillBlank}
            onSubmit={submitTest}
          />
        )}

        {state === "review" && (
          <MockTestReview
            questions={questions}
            passage={passage}
            answers={answers}
            fillBlankInputs={fillBlankInputs}
            flagged={flagged}
            score={score}
            percentage={percentage}
            timeLimit={timeLimit}
            timeLeft={timeLeft}
            onRetry={handleRetry}
          />
        )}
      </div>
    </div>
  );
}
