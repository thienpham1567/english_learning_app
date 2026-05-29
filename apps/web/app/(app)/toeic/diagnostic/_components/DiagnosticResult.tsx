"use client";

import { getSkillLabel, type ToeicSkill } from "@repo/contracts";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";

export function DiagnosticResult({
  snapshot,
  score,
}: {
  snapshot: Record<string, number>;
  score: { correct: number; total: number } | null;
}) {
  const router = useRouter();
  const entries = Object.entries(snapshot).sort((a, b) => a[1] - b[1]);
  const weakest = entries.slice(0, 3);
  const strongest = entries.slice(-3).reverse();

  return (
    <div className="grid gap-3 max-w-[720px]">
      <Card shadowSize="sm" className="p-4">
        <h3 className="font-bold text-ink mb-2">
          Score: {score?.correct ?? 0} / {score?.total ?? 30}
        </h3>
        <p className="text-sm text-text-muted font-medium">
          Your study path will focus on your weakest skills.
        </p>
      </Card>
      <Card shadowSize="sm" className="p-4">
        <h4 className="text-xs uppercase font-extrabold text-text-secondary tracking-wider mb-2.5">
          Weakest Areas
        </h4>
        <div className="flex gap-2 flex-wrap">
          {weakest.map(([skill, val]) => (
            <span
              key={skill}
              className="bg-error/10 border-2 border-error/20 text-destructive text-xs font-extrabold py-1 px-2.5 rounded-lg"
            >
              {getSkillLabel(skill as ToeicSkill)} · {val}/100
            </span>
          ))}
        </div>
      </Card>
      <Card shadowSize="sm" className="p-4">
        <h4 className="text-xs uppercase font-extrabold text-text-secondary tracking-wider mb-2.5">
          Strongest Areas
        </h4>
        <div className="flex gap-2 flex-wrap">
          {strongest.map(([skill, val]) => (
            <span
              key={skill}
              className="bg-success/10 border-2 border-success/20 text-success text-xs font-extrabold py-1 px-2.5 rounded-lg"
            >
              {getSkillLabel(skill as ToeicSkill)} · {val}/100
            </span>
          ))}
        </div>
      </Card>
      <button
        className="py-2.5 px-6 rounded-xl border-2 border-border bg-accent text-[var(--text-on-accent)] font-extrabold text-sm cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-accent-hover active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-150 w-fit"
        onClick={() => router.push("/toeic")}
      >
        Start Learning Path
      </button>
    </div>
  );
}
