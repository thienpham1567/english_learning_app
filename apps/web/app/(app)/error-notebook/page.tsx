"use client";

import { BarChart2, Brain, ClipboardList, FlaskConical } from "lucide-react";
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
      {/* ─── Roadmap Context ─── */}

      {/* ─── Tab switcher ─── */}
      <div className="relative z-[1] shrink-0 px-5 pt-3 pb-2 max-w-6xl mx-auto w-full">
        <div className="flex gap-1 bg-surface-alt rounded-2xl p-1 border border-border shadow-sm max-w-5xl overflow-x-auto scrollbar-none">
          {TABS.map((t) => (
            <m.button
              key={t.key}
              onClick={() => setTab(t.key)}
              whileTap={{ scale: 0.97 }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] cursor-pointer transition-all duration-150 min-w-0 ${
                tab === t.key
                  ? "bg-accent text-text-on-accent font-bold border-none shadow-sm"
                  : "bg-transparent text-text-secondary font-bold hover:text-text-primary"
              }`}
            >
              <t.icon size={15} />
              <span className="truncate">{t.label}</span>
              {/* Due badge on Review tab */}
              {t.key === "review" && dueCount > 0 && (
                <span className="text-[9px] font-bold px-1.5 rounded-lg bg-error text-error-foreground min-w-[16px] text-center leading-4">
                  {dueCount > 99 ? "99+" : dueCount}
                </span>
              )}
            </m.button>
          ))}
        </div>
      </div>

      {/* ─── Content ─── */}
      <div className="flex-1 overflow-auto p-5 relative z-[1]">
        <div className="max-w-6xl mx-auto w-full">
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
