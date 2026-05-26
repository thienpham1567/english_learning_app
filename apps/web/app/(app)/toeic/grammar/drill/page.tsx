"use client";

import { Button } from "antd";
import { BookOpen } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useToeicSession } from "@/hooks/useToeicSession";
import { QuestionRunner } from "../../practice/_components/QuestionRunner";
import { ResultSummary } from "../../practice/_components/ResultSummary";

function DrillRunner() {
  const router = useRouter();
  const params = useSearchParams();
  const skill = params.get("skill") ?? undefined;
  const mode = (params.get("mode") ?? "skill") as "skill" | "mistake";
  const count = Number.parseInt(params.get("count") ?? "20", 10);
  const session = useToeicSession();

  useEffect(() => {
    void session.start({
      mode: "drill",
      count,
      ...(skill ? { skill } : {}),
      ...(mode === "mistake" ? { drillSource: "mistake" } : { drillSource: "skill" }),
    } as never);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (session.state === "loading" || session.state === "idle") {
    return <div className="p-6">Đang tải đề drill…</div>;
  }
  if (session.error) {
    return (
      <div className="p-6">
        <div className="text-destructive mb-3">{session.error}</div>
        <Button onClick={() => router.push("/toeic/grammar")}>Về Grammar Hub</Button>
      </div>
    );
  }
  if (session.state === "completed") {
    return (
      <ResultSummary
        score={session.score}
        answers={session.answers}
        questions={session.questions}
        onReset={() => router.push("/toeic/grammar")}
      />
    );
  }
  return (
    <QuestionRunner
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

export default function GrammarDrillPage() {
  return (
    <div className="flex flex-col h-full h-[0px] flex-1 overflow-auto">
      <div className="p-4 flex-1">
        <Suspense fallback={<div>Loading…</div>}>
          <DrillRunner />
        </Suspense>
      </div>
    </div>
  );
}
