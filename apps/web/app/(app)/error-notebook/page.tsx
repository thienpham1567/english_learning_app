"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Clock } from "lucide-react";
import * as m from "motion/react-client";
import { api } from "@/lib/api-client";
import type { ErrorNotebookTab, ErrorEntry } from "./_types/types";
import { OverviewTab } from "./_components/OverviewTab";
import { ReviewTab } from "./_components/ReviewTab";
import { ListTab } from "./_components/ListTab";
import { AnalysisTab } from "./_components/AnalysisTab";

const TABS: { key: ErrorNotebookTab; label: string; icon: string }[] = [
  { key: "overview", label: "Tổng quan", icon: "📊" },
  { key: "review", label: "Ôn tập", icon: "🧠" },
  { key: "list", label: "Danh sách", icon: "📋" },
  { key: "analysis", label: "Phân tích", icon: "🔬" },
];

export default function ErrorNotebookPage() {
  const [tab, setTab] = useState<ErrorNotebookTab>("overview");
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dueCount, setDueCount] = useState(0);

  // Fetch overview data
  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const [errData, reviewData] = await Promise.all([
        api.get<{ errors: ErrorEntry[]; total: number }>("/errors?limit=50"),
        api.get<{ dueCount: number }>("/errors/review"),
      ]);
      if (errData) {
        setErrors(errData.errors);
        setTotal(errData.total);
      }
      if (reviewData) {
        setDueCount(reviewData.dueCount);
      }
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const unresolvedCount = errors.filter((e) => !e.isResolved).length;
  const resolvedCount = errors.filter((e) => e.isResolved).length;

  return (
    <div className="flex flex-col h-full min-h-0 flex-1 overflow-hidden relative">
      <div className="grain-overlay opacity-[0.03] z-0" />

      {/* Header */}
      <div className="relative z-[1]">
      </div>

      {/* Tabs */}
      <div className="relative z-[1] flex gap-1 px-5 pt-3 border-b border-border bg-(--bg)">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-t-xl border-none border-b-2 text-[13px] cursor-pointer transition-all duration-150 font-body ${
              tab === t.key
                ? "border-b-accent bg-surface text-accent font-extrabold"
                : "border-b-transparent bg-transparent text-text-secondary font-semibold hover:text-ink"
            }`}
          >
            <span className="text-[15px]">{t.icon}</span>
            {t.label}
            {/* Due badge on Review tab */}
            {t.key === "review" && dueCount > 0 && (
              <span className="text-[10px] font-black px-1.5 rounded-full bg-(--error) text-white min-w-[18px] text-center leading-4">
                {dueCount > 99 ? "99+" : dueCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-5 relative z-[1]">
        <div className="max-w-[900px] mx-auto w-full">
          {tab === "overview" && (
            <OverviewTab
              errors={errors}
              total={total}
              unresolvedCount={unresolvedCount}
              resolvedCount={resolvedCount}
              dueCount={dueCount}
              loading={loading}
              onGoToReview={() => setTab("review")}
            />
          )}
          {tab === "review" && <ReviewTab />}
          {tab === "list" && <ListTab />}
          {tab === "analysis" && <AnalysisTab />}
        </div>
      </div>
    </div>
  );
}
