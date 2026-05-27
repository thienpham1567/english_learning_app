"use client";

import { getSkillLabel, type ToeicSkill } from "@repo/contracts";
import { AlertTriangle, Calendar, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

type SkillRow = { skill: string; proficiency: number; pool: number };

export function GrammarHub({ skills, mistakeCount }: { skills: SkillRow[]; mistakeCount: number }) {
  const router = useRouter();

  const sorted = [...skills].sort((a, b) => a.proficiency - b.proficiency);
  const weakest3 = sorted.slice(0, 3);

  const startDrill = (skill: string) => {
    router.push(`/toeic/grammar/drill?skill=${encodeURIComponent(skill)}&count=20`);
  };
  const startMistake = () => {
    router.push("/toeic/grammar/drill?mode=mistake&count=20");
  };
  const startDaily = () => {
    const weakest = weakest3[0]?.skill;
    if (weakest) router.push(`/toeic/grammar/drill?skill=${encodeURIComponent(weakest)}&count=15`);
  };

  const profColor = (p: number) =>
    p < 0.3 ? "var(--error)" : p < 0.7 ? "var(--warning)" : "var(--success)";

  return (
    <div className="grid gap-4">
      {/* 3 quick-start cards */}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}
      >
        <div className="border-2 border-border rounded-xl bg-surface shadow-sm p-4" onClick={startDaily}>
          <div className="flex items-center gap-2">
            <Calendar className="text-xl" style={{ color: "var(--info)" }} />
            <strong>Daily 15 Questions</strong>
          </div>
          <div className="text-text-muted text-[13px] mt-1.5">Focus on your weakest skill</div>
          {weakest3[0] && (
            <span className="mt-2 bg-accent/10 text-accent py-0.5 px-2 inline-block">{getSkillLabel(weakest3[0].skill as ToeicSkill)}</span>
          )}
        </div>
        <div className={`border-2 border-border rounded-xl bg-surface shadow-sm p-4 ${mistakeCount > 0 ? "cursor-pointer hover:shadow-md" : ""}`}
          onClick={mistakeCount > 0 ? startMistake : undefined}
          style={mistakeCount === 0 ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-xl text-destructive" />
            <strong>Incorrect questions to review</strong>
          </div>
          <div className="text-[28px] font-bold mt-1.5">{mistakeCount}</div>
          <div className="text-text-muted text-[13px]">Spaced repetition for incorrect answers</div>
        </div>
        <div className="border-2 border-border rounded-xl bg-surface shadow-sm p-4">
          <div className="flex items-center gap-2">
            <Zap className="text-xl" style={{ color: "var(--warning)" }} />
            <strong>Top 3 weakest skills</strong>
          </div>
          <div className="mt-2 flex flex-col gap-1">
            {weakest3.map((s) => (
              <button
                type="button"
                key={s.skill}
                onClick={() => startDrill(s.skill)}
                className="py-1 px-2 rounded-md bg-transparent text-left text-[13px] cursor-pointer"
                style={{
                  border: "1px solid var(--border-color, #1f2937)",
                  color: "var(--text-primary, #fff)",
                }}
              >
                {getSkillLabel(s.skill as ToeicSkill)} · {Math.round(s.proficiency * 100)}/100
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Skill matrix */}
      <div className="border-2 border-border rounded-xl bg-surface shadow-sm p-4">
        <div className="grid gap-2.5">
          {skills.map((s) => (
            <div
              key={s.skill}
              className="grid gap-3 items-center"
              style={{ gridTemplateColumns: "1fr auto auto" }}
            >
              <div>
                <div className="font-medium">{getSkillLabel(s.skill as ToeicSkill)}</div>
                <div className="h-2 rounded-full bg-border overflow-hidden"><div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${Math.round(s.proficiency * 100)}%` }} /></div>
              </div>
              <div className="text-xs text-text-muted">{s.pool} questions</div>
              <button className="py-2 px-4 rounded-lg border-2 border-border bg-accent text-[var(--text-on-accent)] font-bold text-sm cursor-pointer shadow-sm" onClick={() => startDrill(s.skill)}>
                Drill
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
