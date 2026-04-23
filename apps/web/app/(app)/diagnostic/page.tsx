"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Flex, Typography, Spin } from "antd";

import { api } from "@/lib/api-client";
import type { DiagnosticStatus, Phase, Question, TestResult } from "./_components/types";
import { WelcomeScreen } from "./_components/WelcomeScreen";
import { TestScreen } from "./_components/TestScreen";
import { ResultsScreen } from "./_components/ResultsScreen";

const { Text } = Typography;

export default function DiagnosticPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [status, setStatus] = useState<DiagnosticStatus | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<{ questionId: string; selectedIndex: number; timeMs: number }>>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [result, setResult] = useState<TestResult | null>(null);

  // Load diagnostic status
  useEffect(() => {
    api.get<DiagnosticStatus>("/diagnostic")
      .then((d) => {
        if (d) {
          setStatus(d);
          setPhase("welcome");
        }
      })
      .catch(() => setPhase("welcome"));
  }, []);

  // Start test
  const startTest = useCallback(async () => {
    setPhase("loading");
    try {
      const data = await api.post<{ questions: Question[] }>("/diagnostic", { action: "generate" });
      setQuestions(data.questions);
      setCurrentIndex(0);
      setAnswers([]);
      setSelectedOption(null);
      setQuestionStartTime(Date.now());
      setPhase("test");
    } catch {
      setPhase("welcome");
    }
  }, []);

  // Submit answer and move to next
  const submitAnswer = useCallback(() => {
    if (selectedOption === null) return;
    const q = questions[currentIndex];
    const timeMs = Date.now() - questionStartTime;

    const newAnswers = [...answers, { questionId: q.id, selectedIndex: selectedOption, timeMs }];
    setAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setQuestionStartTime(Date.now());
    } else {
      // Submit all answers
      setPhase("submitting");
      api.post<TestResult>("/diagnostic", { action: "submit", answers: newAnswers })
        .then((data) => {
          if (data) {
            setResult(data);
            setPhase("results");
          } else {
            setPhase("welcome");
          }
        })
        .catch(() => setPhase("welcome"));
    }
  }, [selectedOption, questions, currentIndex, questionStartTime, answers]);

  // Skip question (submit with selectedIndex -1)
  const skipQuestion = useCallback(() => {
    const q = questions[currentIndex];
    const timeMs = Date.now() - questionStartTime;

    const newAnswers = [...answers, { questionId: q.id, selectedIndex: -1, timeMs }];
    setAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setQuestionStartTime(Date.now());
    } else {
      setPhase("submitting");
      api.post<TestResult>("/diagnostic", { action: "submit", answers: newAnswers })
        .then((data) => {
          if (data) {
            setResult(data);
            setPhase("results");
          } else {
            setPhase("welcome");
          }
        })
        .catch(() => setPhase("welcome"));
    }
  }, [questions, currentIndex, questionStartTime, answers]);

  // ── Loading ──
  if (phase === "loading") {
    return (
      <Flex align="center" justify="center" style={{ height: "100%", flexDirection: "column", gap: 16 }}>
        <Spin size="large" />
        <Text type="secondary">Đang chuẩn bị bài test...</Text>
      </Flex>
    );
  }

  // ── Welcome ──
  if (phase === "welcome") {
    return <WelcomeScreen status={status} onStart={startTest} />;
  }

  // ── Test ──
  if (phase === "test" && questions.length > 0) {
    return (
      <TestScreen
        question={questions[currentIndex]}
        currentIndex={currentIndex}
        total={questions.length}
        selectedOption={selectedOption}
        onSelectOption={setSelectedOption}
        onSubmit={submitAnswer}
        onSkip={skipQuestion}
      />
    );
  }

  // ── Submitting ──
  if (phase === "submitting") {
    return (
      <Flex align="center" justify="center" style={{ height: "100%", flexDirection: "column", gap: 16 }}>
        <Spin size="large" />
        <Text type="secondary">Đang phân tích kết quả...</Text>
      </Flex>
    );
  }

  // ── Results ──
  if (phase === "results" && result) {
    return (
      <ResultsScreen
        result={result}
        onGoHome={() => router.push("/home")}
        onViewProgress={() => router.push("/progress")}
      />
    );
  }

  return null;
}
