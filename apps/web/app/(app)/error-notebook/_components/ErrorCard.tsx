"use client";

import { AlertTriangle, Brain, CheckCircle, FileText, XCircle } from "lucide-react";
import * as m from "motion/react-client";
import { Card } from "@/components/ui/card";
import type { ErrorEntry } from "../_types/types";
import { MODULE_ICONS, MODULE_LABELS } from "../_types/types";

interface ErrorCardProps {
  error: ErrorEntry;
  onClick: () => void;
  index?: number;
}

export function ErrorCard({ error, onClick, index = 0 }: ErrorCardProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
    >
      <Card
        interactive
        shadowSize="sm"
        accentColor={error.isResolved ? "success" : "error"}
        accentPosition="left"
        className="p-4 px-4.5 cursor-pointer bg-surface relative overflow-hidden"
        onClick={onClick}
      >
        {/* Top row: status + module + date */}
        <div className="flex items-center gap-2 mb-2.5">
          {error.isResolved ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-success-bg text-success">
              <CheckCircle className="h-2.5 w-2.5" /> Resolved
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-error-bg text-error">
              <AlertTriangle className="h-2.5 w-2.5" /> Unresolved
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-accent-light text-accent-hover border border-accent/15">
            {(() => {
              const Icon = MODULE_ICONS[error.sourceModule] || FileText;
              return <Icon className="h-3 w-3" />;
            })()} {MODULE_LABELS[error.sourceModule] ?? error.sourceModule}
          </span>
          {error.grammarTopic && (
            <span className="text-[11px] font-semibold text-text-muted px-1.5 py-px rounded bg-surface-alt">
              {error.grammarTopic}
            </span>
          )}
          <span className="ml-auto text-[11px] text-text-muted font-medium shrink-0">
            {new Date(error.createdAt).toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>

        {/* Question */}
        <div className="text-sm font-semibold leading-relaxed text-text-primary line-clamp-2 mb-2.5">
          {error.questionStem}
        </div>

        {/* Answer comparison */}
        <div className="flex gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[color-mix(in_srgb,var(--error)_6%,var(--surface))] border border-[color-mix(in_srgb,var(--error)_15%,transparent)] text-xs font-bold text-error">
            <XCircle className="h-2.5 w-2.5" /> {error.userAnswer || "(Empty)"}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[color-mix(in_srgb,var(--success)_6%,var(--surface))] border border-[color-mix(in_srgb,var(--success)_15%,transparent)] text-xs font-bold text-success">
            <CheckCircle className="h-2.5 w-2.5" /> {error.correctAnswer}
          </span>
        </div>

        {/* Review info */}
        {error.reviewCount > 0 && (
          <div className="mt-2 text-[10px] text-text-muted font-semibold flex items-center gap-1">
            <Brain className="h-3 w-3" />
            <span>
              Reviewed {error.reviewCount} {error.reviewCount === 1 ? "time" : "times"}
              {error.nextReviewAt &&
                ` · Next: ${new Date(error.nextReviewAt).toLocaleDateString("en-US", { day: "numeric", month: "short" })}`}
            </span>
          </div>
        )}
      </Card>
    </m.div>
  );
}
