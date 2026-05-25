"use client";

import {
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import * as m from "motion/react-client";
import type { ErrorEntry } from "../_types/types";
import { MODULE_LABELS, MODULE_ICONS } from "../_types/types";

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
      whileHover={{ y: -2, boxShadow: "var(--shadow-md)" }}
      onClick={onClick}
      className="bg-surface rounded-xl border border-border p-4 px-4.5 cursor-pointer transition-all duration-150 relative overflow-hidden"
    >
      {/* Accent bar */}
      <div className={`absolute top-0 left-0 w-[3px] h-full rounded-l ${error.isResolved ? "bg-(--success)" : "bg-(--error)"}`} />

      {/* Top row: status + module + date */}
      <div className="flex items-center gap-2 mb-2.5">
        {error.isResolved ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-(--success-bg) text-(--success)">
            <CheckCircle className="h-2.5 w-2.5" /> Đã hiểu
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-(--error-bg) text-(--error)">
            <AlertTriangle className="h-2.5 w-2.5" /> Chưa nắm
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-accent/8 text-accent">
          {MODULE_ICONS[error.sourceModule] ?? "📄"} {MODULE_LABELS[error.sourceModule] ?? error.sourceModule}
        </span>
        {error.grammarTopic && (
          <span className="text-[11px] font-semibold text-text-muted px-1.5 py-px rounded bg-surface-alt">
            {error.grammarTopic}
          </span>
        )}
        <span className="ml-auto text-[11px] text-text-muted font-medium shrink-0">
          {new Date(error.createdAt).toLocaleDateString("vi-VN", { day: "numeric", month: "short" })}
        </span>
      </div>

      {/* Question */}
      <div className="text-sm font-semibold leading-relaxed text-text-primary line-clamp-2 mb-2.5">
        {error.questionStem}
      </div>

      {/* Answer comparison */}
      <div className="flex gap-2">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[color-mix(in_srgb,var(--error)_6%,var(--surface))] border border-[color-mix(in_srgb,var(--error)_15%,transparent)] text-xs font-bold text-(--error)">
          <XCircle className="h-2.5 w-2.5" /> {error.userAnswer || "(Trống)"}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[color-mix(in_srgb,var(--success)_6%,var(--surface))] border border-[color-mix(in_srgb,var(--success)_15%,transparent)] text-xs font-bold text-(--success)">
          <CheckCircle className="h-2.5 w-2.5" /> {error.correctAnswer}
        </span>
      </div>

      {/* Review info */}
      {error.reviewCount > 0 && (
        <div className="mt-2 text-[10px] text-text-muted font-semibold">
          🧠 Đã ôn {error.reviewCount} lần
          {error.nextReviewAt && ` · Ôn lại: ${new Date(error.nextReviewAt).toLocaleDateString("vi-VN", { day: "numeric", month: "short" })}`}
        </div>
      )}
    </m.div>
  );
}
