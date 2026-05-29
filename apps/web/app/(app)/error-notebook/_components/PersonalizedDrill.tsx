"use client";

import { CheckCircle, Lightbulb, Loader2, RefreshCw, Trophy, XCircle, Zap } from "lucide-react";
import * as m from "motion/react-client";
import { useCallback, useState } from "react";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/card";

type DrillExercise = {
  type: string;
  instruction: string;
  data: Record<string, unknown>;
  targetWeakness: string;
  tip: string;
};

type DrillData = {
  exercises: DrillExercise[];
  summary: string;
  errorCount: number;
  topTopics: string[];
};

export function PersonalizedDrill() {
  const [drill, setDrill] = useState<DrillData | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { selected: number; correct: boolean }>>(
    {},
  );
  const [showResults, setShowResults] = useState(false);

  const generateDrill = useCallback(async () => {
    setLoading(true);
    setDrill(null);
    setCurrentIndex(0);
    setAnswers({});
    setShowResults(false);
    try {
      const data = await api.post<DrillData>("/errors/drill", {});
      setDrill(data);
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  const handleAnswer = useCallback(
    (exerciseIdx: number, selectedIdx: number) => {
      if (!drill) return;
      const ex = drill.exercises[exerciseIdx];
      const correctIdx = (ex.data as { correctIndex?: number }).correctIndex ?? 0;
      setAnswers((prev) => ({
        ...prev,
        [exerciseIdx]: { selected: selectedIdx, correct: selectedIdx === correctIdx },
      }));
    },
    [drill],
  );

  const handleNext = useCallback(() => {
    if (!drill) return;
    if (currentIndex < drill.exercises.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setShowResults(true);
    }
  }, [drill, currentIndex]);

  const correctCount = Object.values(answers).filter((a) => a.correct).length;

  // Not started yet — show CTA
  if (!drill && !loading) {
    return (
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card accentColor="accent" accentPosition="left" bgType="alt" className="gap-3.5">
          <div className="flex items-center gap-2.5">
            <Zap className="h-4 w-4 text-accent" />
            <span className="text-[15px] font-bold text-ink font-display">
              AI Drill — Target Weaknesses
            </span>
          </div>
          <p className="text-[13px] text-text-secondary m-0 leading-relaxed">
            AI will analyze your errors and generate exercises focusing on your weakest areas.
          </p>
          <div>
            <button
              type="button"
              onClick={generateDrill}
              className="inline-flex items-center gap-2 px-5.5 py-2.5 rounded-xl border-none bg-accent text-text-on-accent cursor-pointer text-sm font-bold transition-opacity duration-200 hover:opacity-90"
            >
              <Zap className="h-4 w-4" /> Generate Practice Session
            </button>
          </div>
        </Card>
      </m.div>
    );
  }

  // Loading
  if (loading) {
    return (
      <Card className="py-8 text-center" shadowSize="default">
        <Loader2 className="h-7 w-7 text-accent animate-spin mx-auto" />
        <div className="text-sm font-semibold text-text-primary">Analyzing errors...</div>
        <div className="text-xs text-text-muted">
          AI is generating a personalized practice session for you
        </div>
      </Card>
    );
  }

  if (!drill) return null;

  // Results view
  if (showResults) {
    const pct =
      drill.exercises.length > 0 ? Math.round((correctCount / drill.exercises.length) * 100) : 0;
    return (
      <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="py-6 px-5 text-center gap-3" shadowSize="default">
          <Trophy className={`h-9 w-9 mx-auto ${pct >= 80 ? "text-success" : "text-accent"}`} />
          <div className="text-4xl font-black text-ink font-display">
            {correctCount}/{drill.exercises.length}
          </div>
          <div>
            <div className="text-sm text-text-secondary">
              {pct >= 80
                ? "Excellent! You have made significant progress!"
                : pct >= 50
                  ? "Good job! Keep reviewing to improve."
                  : "Keep practicing. Don't give up!"}
            </div>
            <div className="text-xs text-text-muted font-bold mt-1">Accuracy: {pct}%</div>
          </div>
          <div>
            <button
              type="button"
              onClick={generateDrill}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg border-2 border-accent bg-accent text-text-on-accent cursor-pointer text-[13px] font-bold"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Generate New Drill
            </button>
          </div>
        </Card>
      </m.div>
    );
  }

  // Active exercise
  const exercise = drill.exercises[currentIndex];
  if (!exercise) return null;

  const data = exercise.data as { sentence?: string; options?: string[]; correctIndex?: number };
  const answered = answers[currentIndex];

  return (
    <m.div
      key={currentIndex}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="p-0 gap-0 overflow-hidden" shadowSize="default">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-accent/5 border-b-2 border-border">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-accent" />
            <span className="text-[13px] font-bold text-ink">
              Question {currentIndex + 1}/{drill.exercises.length}
            </span>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-accent-light text-accent-hover border-2 border-accent/15">
            {exercise.targetWeakness}
          </span>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col gap-4">
          <div>
            <p className="text-xs text-text-muted font-semibold mb-2">{exercise.instruction}</p>
            {data.sentence && (
              <p className="text-[15px] font-medium text-text-primary leading-relaxed">
                {data.sentence}
              </p>
            )}
          </div>

          {/* Options */}
          {data.options && (
            <div className="flex flex-col gap-2">
              {data.options.map((opt, i) => {
                const isSelected = answered?.selected === i;
                const isCorrect = data.correctIndex === i;

                let bg = "var(--surface)";
                let borderColor = "var(--border)";
                let color = "var(--text-primary)";

                if (answered) {
                  if (isCorrect) {
                    bg = "var(--success-bg)";
                    borderColor = "var(--success)";
                    color = "var(--success)";
                  } else if (isSelected && !answered.correct) {
                    bg = "var(--error-bg)";
                    borderColor = "var(--error)";
                    color = "var(--error)";
                  }
                }

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => !answered && handleAnswer(currentIndex, i)}
                    disabled={!!answered}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm text-left transition-all duration-200"
                    style={{
                      border: `1.5px solid ${borderColor}`,
                      background: bg,
                      color,
                      cursor: answered ? "default" : "pointer",
                      fontWeight: isSelected || isCorrect ? 700 : 500,
                    }}
                  >
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0"
                      style={{
                        background: answered
                          ? isCorrect
                            ? "var(--success)"
                            : isSelected
                              ? "var(--error)"
                              : "var(--border)"
                          : "var(--border)",
                        color: answered && (isCorrect || isSelected) ? "var(--text-on-accent)" : "var(--text-muted)",
                      }}
                    >
                      {answered ? (
                        isCorrect ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : isSelected ? (
                          <XCircle className="h-3 w-3" />
                        ) : (
                          String.fromCharCode(65 + i)
                        )
                      ) : (
                        String.fromCharCode(65 + i)
                      )}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {/* Tip (shown after answer) */}
          {answered && exercise.tip && (
            <m.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3.5 px-3.5 py-2.5 rounded-xl bg-accent/5 border-2 border-accent/12 flex gap-2 items-start"
            >
              <Lightbulb className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />
              <p className="text-xs leading-relaxed text-text-secondary m-0">{exercise.tip}</p>
            </m.div>
          )}

          {/* Next button */}
          {answered && (
            <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3.5 text-right">
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg border-none bg-accent text-text-on-accent cursor-pointer text-[13px] font-bold"
              >
                {currentIndex < drill.exercises.length - 1 ? "Next Question →" : "See Results"}
              </button>
            </m.div>
          )}
        </div>
      </Card>
    </m.div>
  );
}
