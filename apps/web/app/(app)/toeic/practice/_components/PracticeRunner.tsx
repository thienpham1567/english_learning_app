"use client";

import { useToeicSession } from "@/hooks/useToeicSession";
import { PracticeSetup, type PracticeStartParams } from "./PracticeSetup";
import { QuestionRunner } from "./QuestionRunner";
import { ResultSummary } from "./ResultSummary";

export function PracticeRunner() {
  const session = useToeicSession();

  const handleStart = (params: PracticeStartParams) => {
    void session.start({
      mode: "practice",
      examCode: params.examCode,
      part: params.part,
      count: params.count,
    });
  };

  if (session.state === "idle" || session.state === "loading") {
    return (
      <div key="setup">
        <PracticeSetup onStart={handleStart} />
        {session.error && (
          <div style={{ color: "var(--error)", marginTop: 8 }}>{session.error}</div>
        )}
      </div>
    );
  }

  if (session.state === "completed") {
    return (
      <ResultSummary
        key="result"
        score={session.score}
        answers={session.answers}
        questions={session.questions}
        onReset={session.reset}
      />
    );
  }

  return (
    <QuestionRunner
      key="runner"
      question={session.currentQuestion}
      currentIndex={session.currentIndex}
      total={session.questions.length}
      startedAt={session.startedAt}
      attemptId={session.attemptId ?? undefined}
      onAnswer={session.answer}
      onNext={session.next}
      onComplete={session.complete}
    />
  );
}
