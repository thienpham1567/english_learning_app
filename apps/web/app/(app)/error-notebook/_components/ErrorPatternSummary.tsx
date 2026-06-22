"use client";

import type { ErrorPatternInput } from "@repo/modules/learning";
import { summarizeErrorPatterns } from "@repo/modules/learning";
import {
  Book,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  Construction,
  Ear,
  GraduationCap,
  Headphones,
  HelpCircle,
  Link2,
  MapPin,
  PenTool,
  Pin,
  Puzzle,
  Target,
  TrendingUp,
  Type,
  Volume2,
  X as XIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { getToeicImpact } from "@/lib/toeic-impact-map";

type Props = {
  errors: ErrorPatternInput[];
};

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  tense: Clock,
  article: Pin,
  preposition: MapPin,
  "word-form": Type,
  "subject-verb": Link2,
  clause: Construction,
  vocabulary: Book,
  coherence: Puzzle,
  "task-response": Target,
  spelling: PenTool,
  pronunciation: Volume2,
  "listening-detail": Headphones,
  "listening-comprehension": Ear,
  "reading-comprehension": BookOpen,
  "exam-strategy": GraduationCap,
  other: HelpCircle,
};

export function ErrorPatternSummary({ errors }: Props) {
  const patterns = useMemo(() => summarizeErrorPatterns(errors), [errors]);
  if (patterns.length === 0) return null;

  const topPatterns = patterns.slice(0, 5);

  return (
    <div>
      {/* Section label */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-1 h-5 rounded-full bg-warning shrink-0" />
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-warning font-display">
          Common Error Patterns
        </span>
        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg bg-warning/10 text-warning border border-warning/20">
          {patterns.length} patterns
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="flex flex-col gap-2">
        {topPatterns.map((pattern) => {
          const actionLabel = pattern.nextAction.label.replace("Luyện sửa lỗi:", "Practice:");
          return (
            <Card
              key={pattern.category.key}
              shadowSize="sm"
              className="p-0 gap-0 overflow-hidden bg-surface"
            >
              {/* Pattern header */}
              <div
                className={`flex items-center gap-3 px-4 py-3 bg-[color-mix(in_srgb,var(--warning)_5%,var(--bg))] ${pattern.examples.length > 0 ? "border-b-2 border-border" : ""}`}
              >
                <span className="shrink-0 w-8 h-8 rounded-xl bg-accent/8 border border-accent/15 grid place-items-center text-accent">
                  {(() => {
                    const IconComponent = CATEGORY_ICONS[pattern.category.key] || HelpCircle;
                    return <IconComponent className="h-4 w-4" />;
                  })()}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-ink leading-tight">
                    {pattern.category.label}
                  </div>
                  <div className="text-[11px] text-text-muted mt-0.5">
                    {pattern.totalCount} errors · {pattern.unresolvedCount} unresolved
                    {pattern.recentCount > 0 && ` · ${pattern.recentCount} recent`}
                  </div>
                  {/* TOEIC Impact Badge */}
                  {(() => {
                    const impact = getToeicImpact(pattern.category.key);
                    if (!impact) return null;
                    return (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-lg bg-accent/8 text-accent border border-accent/15 inline-flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-success" /> ~{impact.estimatedPoints}{" "}
                          pts
                        </span>
                        <span className="text-[9px] text-text-muted font-medium">
                          {impact.parts.join(", ")}
                        </span>
                      </div>
                    );
                  })()}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {pattern.unresolvedCount > 0 && (
                    <span className="text-xs font-extrabold min-w-[22px] text-center px-2 py-0.5 rounded-lg bg-error-bg text-error">
                      {pattern.unresolvedCount}
                    </span>
                  )}
                  <Link
                    href={pattern.nextAction.href}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-accent no-underline px-2.5 py-1 rounded-lg border border-accent/25 bg-accent/8 transition-all duration-150 hover:bg-accent/15"
                  >
                    {actionLabel} <ChevronRight className="h-2.5 w-2.5" />
                  </Link>
                </div>
              </div>

              {/* Examples */}
              {pattern.examples.length > 0 && (
                <div className="px-4 py-2.5 flex flex-col gap-1.5">
                  {pattern.examples.slice(0, 2).map((ex) => (
                    <div
                      key={ex.id}
                      className="text-xs leading-relaxed px-3 py-2.5 rounded-xl bg-bg-deep border-l-[3px] border-border"
                    >
                      <span className="text-text-secondary">{ex.questionStem.slice(0, 80)}</span>
                      <span className="text-error font-semibold ml-2">
                        <XIcon className="h-2.5 w-2.5 inline" /> {ex.userAnswer}
                      </span>
                      <span className="text-success font-semibold ml-1.5">
                        <Check className="h-2.5 w-2.5 inline" /> {ex.correctAnswer}
                      </span>
                    </div>
                  ))}
                  <div className="text-[11px] text-text-muted mt-0.5">
                    Skills: {pattern.affectedSkillIds.join(", ")}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
