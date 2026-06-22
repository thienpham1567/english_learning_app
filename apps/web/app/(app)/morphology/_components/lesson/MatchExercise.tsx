"use client";

import { CircleCheckBig, XCircle } from "lucide-react";
import * as m from "motion/react-client";
import { useMemo, useState } from "react";
import type { MorphemeExercise } from "@/lib/morphology/schema";

type MatchData = Extract<MorphemeExercise, { type: "match" }>;

interface MatchExerciseProps {
  exercise: MatchData;
  revealed: boolean;
  onAnswer: (correct: boolean) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Connect each left item to its correct meaning on the right. */
export function MatchExercise({ exercise, revealed, onAnswer }: MatchExerciseProps) {
  const correctMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of exercise.pairs) map[p.left] = p.right;
    return map;
  }, [exercise.pairs]);

  const rights = useMemo(() => shuffle(exercise.pairs.map((p) => p.right)), [exercise.pairs]);

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [connections, setConnections] = useState<Record<string, string>>({});

  const usedRights = new Set(Object.values(connections));

  const pickLeft = (left: string) => {
    if (revealed) return;
    // Tapping a connected left clears it (lets the learner correct a mistake).
    if (connections[left]) {
      setConnections((prev) => {
        const next = { ...prev };
        delete next[left];
        return next;
      });
      setSelectedLeft(null);
      return;
    }
    setSelectedLeft((cur) => (cur === left ? null : left));
  };

  const pickRight = (right: string) => {
    if (revealed || !selectedLeft || usedRights.has(right)) return;
    const next = { ...connections, [selectedLeft]: right };
    setSelectedLeft(null);
    setConnections(next);

    if (Object.keys(next).length === exercise.pairs.length) {
      const allCorrect = exercise.pairs.every((p) => next[p.left] === p.right);
      onAnswer(allCorrect);
    }
  };

  const leftState = (left: string) => {
    const chosen = connections[left];
    if (revealed && chosen) {
      return chosen === correctMap[left]
        ? "border-success bg-success/10 text-success"
        : "border-error bg-error/10 text-error";
    }
    if (selectedLeft === left) return "border-accent bg-accent-light text-accent-active";
    if (chosen) return "border-accent/40 bg-surface text-text-primary";
    return "border-border bg-surface text-text-primary hover:border-border-strong";
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="font-bold text-text-primary text-[15px]">{exercise.prompt}</p>

      <div className="grid grid-cols-2 gap-3">
        {/* Left column */}
        <div className="flex flex-col gap-2">
          {exercise.pairs.map((p) => {
            const chosen = connections[p.left];
            return (
              <button
                key={p.left}
                type="button"
                onClick={() => pickLeft(p.left)}
                disabled={revealed}
                className={`text-left rounded-xl border py-2.5 px-3 text-[13px] font-bold transition-colors ${
                  revealed ? "cursor-default" : "cursor-pointer"
                } ${leftState(p.left)}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>{p.left}</span>
                  {revealed && chosen ? (
                    chosen === correctMap[p.left] ? (
                      <CircleCheckBig size={14} className="text-success shrink-0" />
                    ) : (
                      <XCircle size={14} className="text-error shrink-0" />
                    )
                  ) : null}
                </div>
                {chosen && (
                  <div className="mt-1 text-[11.5px] font-medium text-text-muted truncate">
                    → {chosen}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-2">
          {rights.map((right) => {
            const used = usedRights.has(right);
            return (
              <m.button
                key={right}
                type="button"
                onClick={() => pickRight(right)}
                disabled={revealed || used || !selectedLeft}
                whileTap={revealed || used ? undefined : { scale: 0.98 }}
                className={`text-left rounded-xl border py-2.5 px-3 text-[13px] font-medium transition-colors ${
                  used
                    ? "border-border bg-surface-alt text-text-muted opacity-50 cursor-default"
                    : selectedLeft
                      ? "border-accent/40 bg-surface text-text-primary cursor-pointer hover:border-accent"
                      : "border-border bg-surface text-text-secondary cursor-default"
                }`}
              >
                {right}
              </m.button>
            );
          })}
        </div>
      </div>

      {!revealed && (
        <p className="text-[12px] text-text-muted text-center">
          Tap an item on the left, then its meaning on the right. Tap a matched item to undo.
        </p>
      )}
    </div>
  );
}
