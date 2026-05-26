"use client";

import type { ErrorPatternInput } from "@repo/modules/learning";
import { summarizeErrorPatterns } from "@repo/modules/learning";
import { Check, ChevronRight, X as XIcon } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

type Props = {
  errors: ErrorPatternInput[];
};

export function ErrorPatternSummary({ errors }: Props) {
  const patterns = useMemo(() => summarizeErrorPatterns(errors), [errors]);
  if (patterns.length === 0) return null;

  const topPatterns = patterns.slice(0, 5);

  return (
    <div>
      {/* Section label */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-[3px] h-3.5 rounded-sm bg-(--warning) shrink-0" />
        <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-(--warning)">
          Mẫu lỗi thường gặp
        </span>
        <span className="text-[11px] font-bold px-2 py-px rounded-full bg-[color-mix(in_srgb,var(--warning)_12%,var(--surface))] text-(--warning) border border-[color-mix(in_srgb,var(--warning)_25%,transparent)]">
          {patterns.length} mẫu
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="flex flex-col gap-2">
        {topPatterns.map((pattern) => (
          <div
            key={pattern.category.key}
            className="rounded-[14px] bg-surface border-2 border-border overflow-hidden transition-all duration-150 hover:border-[color-mix(in_srgb,var(--warning)_35%,var(--border))] hover:shadow-sm"
          >
            {/* Pattern header */}
            <div
              className={`flex items-center gap-3 px-4 py-3 bg-[color-mix(in_srgb,var(--warning)_5%,var(--bg))] ${pattern.examples.length > 0 ? "border-b-2 border-border" : ""}`}
            >
              <span className="text-lg leading-none shrink-0">{pattern.category.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-ink leading-tight">
                  {pattern.category.labelVi}
                </div>
                <div className="text-[11px] text-text-muted mt-0.5">
                  {pattern.totalCount} lỗi · {pattern.unresolvedCount} chưa nắm
                  {pattern.recentCount > 0 && ` · ${pattern.recentCount} gần đây`}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {pattern.unresolvedCount > 0 && (
                  <span className="text-xs font-extrabold min-w-[22px] text-center px-2 py-0.5 rounded-full bg-(--error-bg) text-(--error)">
                    {pattern.unresolvedCount}
                  </span>
                )}
                <Link
                  href={pattern.nextAction.href}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-accent no-underline px-2.5 py-1 rounded-full border-[1.5px] border-accent/25 bg-accent/8 transition-all duration-150 hover:bg-accent/15"
                >
                  {pattern.nextAction.label} <ChevronRight className="h-2.5 w-2.5" />
                </Link>
              </div>
            </div>

            {/* Examples */}
            {pattern.examples.length > 0 && (
              <div className="px-4 py-2.5 flex flex-col gap-1.5">
                {pattern.examples.slice(0, 2).map((ex) => (
                  <div
                    key={ex.id}
                    className="text-xs leading-relaxed px-3 py-2 rounded-[9px] bg-bg-deep border-l-3 border-border"
                  >
                    <span className="text-text-secondary">{ex.questionStem.slice(0, 80)}</span>
                    <span className="text-(--error) font-semibold ml-2">
                      <XIcon className="h-2.5 w-2.5 inline" /> {ex.userAnswer}
                    </span>
                    <span className="text-(--success) font-semibold ml-1.5">
                      <Check className="h-2.5 w-2.5 inline" /> {ex.correctAnswer}
                    </span>
                  </div>
                ))}
                <div className="text-[11px] text-text-muted mt-0.5">
                  Kỹ năng: {pattern.affectedSkillIds.join(", ")}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
