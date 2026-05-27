"use client";

import { AlertTriangle, BarChart2, Brain, ClipboardList, Clock, FlaskConical } from "lucide-react";
import * as m from "motion/react-client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { AnalysisTab } from "./_components/AnalysisTab";
import { ListTab } from "./_components/ListTab";
import { OverviewTab } from "./_components/OverviewTab";
import { ReviewTab } from "./_components/ReviewTab";
import type { ErrorEntry, ErrorNotebookTab } from "./_types/types";

const TABS: {
  key: ErrorNotebookTab;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  { key: "overview", label: "Overview", icon: BarChart2 },
  { key: "review", label: "Review", icon: Brain },
  { key: "list", label: "Error List", icon: ClipboardList },
  { key: "analysis", label: "AI Analysis", icon: FlaskConical },
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


      {/* Tabs */}
      <div className="relative z-[1] flex gap-1 px-5 pt-3 border-b-2 border-border bg-bg">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-t-xl border-none border-b-2 text-[13px] cursor-pointer transition-all duration-150 font-body ${
              tab === t.key
                ? "border-b-accent bg-surface text-ink font-black"
                : "border-b-transparent bg-transparent text-text-secondary font-semibold hover:text-ink"
            }`}
          >
            <m.span
              className="text-[15px] flex items-center justify-center"
              animate={tab === t.key ? { scale: 1.1, rotate: [0, -5, 5, 0] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <t.icon size={16} />
            </m.span>
            {t.label}
            {/* Due badge on Review tab */}
            {t.key === "review" && dueCount > 0 && (
              <span className="text-[10px] font-black px-1.5 rounded-full bg-error text-white min-w-[18px] text-center leading-4">
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
