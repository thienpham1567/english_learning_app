"use client";

import { getSkillLabel, type ToeicSkill } from "@repo/contracts";
import { Button, Card, Progress, Tag } from "antd";
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
        <Card size="small" hoverable onClick={startDaily}>
          <div className="flex items-center gap-2">
            <Calendar className="text-xl" style={{ color: "var(--info)" }} />
            <strong>Daily 15 câu</strong>
          </div>
          <div className="text-text-muted text-[13px] mt-1.5">Tập trung vào kỹ năng yếu nhất</div>
          {weakest3[0] && (
            <Tag className="mt-2">{getSkillLabel(weakest3[0].skill as ToeicSkill)}</Tag>
          )}
        </Card>
        <Card
          size="small"
          hoverable={mistakeCount > 0}
          onClick={mistakeCount > 0 ? startMistake : undefined}
          style={mistakeCount === 0 ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-xl text-destructive" />
            <strong>Câu sai cần ôn</strong>
          </div>
          <div className="text-[28px] font-bold mt-1.5">{mistakeCount}</div>
          <div className="text-text-muted text-[13px]">Spaced repetition cho câu sai</div>
        </Card>
        <Card size="small">
          <div className="flex items-center gap-2">
            <Zap className="text-xl" style={{ color: "var(--warning)" }} />
            <strong>Top 3 yếu nhất</strong>
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
        </Card>
      </div>

      {/* Skill matrix */}
      <Card title="Tất cả kỹ năng Part 5 & 6" size="small">
        <div className="grid gap-2.5">
          {skills.map((s) => (
            <div
              key={s.skill}
              className="grid gap-3 items-center"
              style={{ gridTemplateColumns: "1fr auto auto" }}
            >
              <div>
                <div className="font-medium">{getSkillLabel(s.skill as ToeicSkill)}</div>
                <Progress
                  percent={Math.round(s.proficiency * 100)}
                  showInfo={false}
                  strokeColor={profColor(s.proficiency)}
                  size="small"
                />
              </div>
              <div className="text-xs text-text-muted">{s.pool} câu</div>
              <Button size="small" onClick={() => startDrill(s.skill)}>
                Drill
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
