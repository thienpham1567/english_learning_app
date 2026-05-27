"use client";

import { AlertCircle, BarChart2, Brain, CheckCircle, Clock, Database, FileText } from "lucide-react";
import * as m from "motion/react-client";
import { useMemo } from "react";
import type { ErrorEntry } from "../_types/types";
import { MODULE_ICONS, MODULE_LABELS } from "../_types/types";
import { ErrorPatternSummary } from "./ErrorPatternSummary";
import { ErrorTrendSection } from "./ErrorTrendSection";

interface OverviewTabProps {
  errors: ErrorEntry[];
  total: number;
  unresolvedCount: number;
  resolvedCount: number;
  dueCount: number;
  loading: boolean;
  onGoToReview: () => void;
}

export function OverviewTab({
  errors,
  total,
  unresolvedCount,
  resolvedCount,
  dueCount,
  loading,
  onGoToReview,
}: OverviewTabProps) {
  /* ── Module distribution ── */
  const moduleStats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of errors) {
      const mod = e.sourceModule;
      counts[mod] = (counts[mod] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [errors]);

  if (loading) {
    return (
      <div className="py-10 text-center">
        <m.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-sm text-text-muted font-semibold"
        >
          Loading data...
        </m.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Stats Cards */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
        {[
          {
            label: "Unresolved",
            value: unresolvedCount,
            colorClass: unresolvedCount > 0 ? "text-error" : "text-text-muted",
            icon: <AlertCircle className="h-4 w-4" />,
            bgClass: "bg-red-500/5",
            borderClass: "border-red-500/15",
          },
          {
            label: "Resolved",
            value: resolvedCount,
            colorClass: "text-success",
            icon: <CheckCircle className="h-4 w-4" />,
            bgClass: "bg-emerald-500/5",
            borderClass: "border-emerald-500/15",
          },
          {
            label: "Needs Review",
            value: dueCount,
            colorClass: dueCount > 0 ? "text-warning" : "text-text-muted",
            icon: <Clock className="h-4 w-4" />,
            bgClass: "bg-amber-500/5",
            borderClass: "border-amber-500/15",
          },
          {
            label: "Total Errors",
            value: total,
            colorClass: "text-ink",
            icon: <Database className="h-4 w-4" />,
            bgClass: "bg-accent-light",
            borderClass: "border-accent/15",
            iconColorClass: "text-accent-hover",
          },
        ].map((stat: any) => (
          <m.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2, boxShadow: "var(--shadow-md)" }}
            className={`flex items-center gap-3.5 p-4.5 bg-surface rounded-xl border-[1.5px] ${stat.borderClass} shadow-sm cursor-default transition-all duration-200`}
          >
            <span
              className={`w-9 h-9 rounded-[10px] ${stat.bgClass} ${stat.iconColorClass ?? stat.colorClass} grid place-items-center`}
            >
              {stat.icon}
            </span>
            <div>
              <div
                className={`text-[28px] font-black ${stat.colorClass} leading-none font-display`}
              >
                {stat.value}
              </div>
              <div className="text-[11px] text-text-muted font-bold mt-0.5">{stat.label}</div>
            </div>
          </m.div>
        ))}
      </div>

      {/* SRS Review CTA */}
      {dueCount > 0 && (
        <m.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.01, y: -2 }}
          whileTap={{ scale: 0.99 }}
          onClick={onGoToReview}
          className="flex items-center justify-center gap-3 p-4.5 rounded-xl border-2 border-accent bg-gradient-to-br from-accent/8 to-amber-500/5 cursor-pointer shadow-[0_4px_14px_var(--accent-muted)] font-body"
        >
          <Brain className="h-7 w-7 text-accent-hover shrink-0" />
          <div className="text-left">
            <div className="text-base font-black text-ink">
              Review Now — {dueCount} errors to recall
            </div>
            <div className="text-xs text-text-muted font-medium">
              Flashcards + AI explanations help you retain information longer
            </div>
          </div>
        </m.button>
      )}

      {/* Module Distribution */}
      {moduleStats.length > 0 && (
        <div className="bg-surface rounded-xl border-2 border-border p-5">
          <span className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5 mb-3.5">
            <BarChart2 className="h-4 w-4" /> Distribution by Source
          </span>
          <div className="flex flex-col gap-2">
            {moduleStats.map(([mod, count], i) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <m.div
                  key={mod}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-2.5"
                >
                  <span className="text-base w-7 text-center flex items-center justify-center">
                    {(() => {
                      const Icon = MODULE_ICONS[mod] || FileText;
                      return <Icon className="h-4 w-4 text-accent" />;
                    })()}
                  </span>
                  <span className="text-[13px] font-semibold text-text-primary w-[90px] shrink-0">
                    {MODULE_LABELS[mod] ?? mod}
                  </span>
                  <div className="flex-1 h-2 rounded bg-border overflow-hidden">
                    <m.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className="h-full rounded bg-accent min-w-1"
                    />
                  </div>
                  <span className="text-xs font-extrabold text-ink w-10 text-right">
                    {count}
                  </span>
                </m.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error Patterns */}
      {errors.length > 0 && <ErrorPatternSummary errors={errors} />}

      {/* Error Trends */}
      {errors.length > 0 && <ErrorTrendSection errors={errors} />}
    </div>
  );
}
