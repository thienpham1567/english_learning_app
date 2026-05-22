"use client";

import { useState, useEffect, useCallback } from "react";
import { ExceptionOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
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
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100%", minHeight: 0, flex: 1,
      overflow: "hidden", position: "relative",
    }}>
      <div className="grain-overlay" style={{ opacity: 0.03, zIndex: 0 }} />

      {/* Header */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <ModuleHeader
          icon={<ExceptionOutlined />}
          gradient="var(--gradient-error-notebook)"
          title="Sổ lỗi sai"
          subtitle="Tổng hợp & ôn tập lỗi sai thông minh"
          action={
            dueCount > 0 ? (
              <m.span
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)",
                  borderRadius: 99, padding: "5px 14px",
                  fontSize: 13, fontWeight: 700, color: "#fff",
                  border: "1px solid rgba(255,255,255,0.25)",
                  cursor: "pointer",
                }}
                onClick={() => setTab("review")}
              >
                <ClockCircleOutlined style={{ fontSize: 12 }} />
                {dueCount} cần ôn tập
              </m.span>
            ) : unresolvedCount > 0 ? (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)",
                borderRadius: 99, padding: "5px 14px",
                fontSize: 13, fontWeight: 700, color: "#fff",
                border: "1px solid rgba(255,255,255,0.2)",
              }}>
                ⚠️ {unresolvedCount} chưa nắm
              </span>
            ) : null
          }
        />
      </div>

      {/* Tabs */}
      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", gap: 4,
        padding: "12px 20px 0",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg)",
      }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "10px 18px", borderRadius: "10px 10px 0 0",
              border: "none", borderBottom: tab === t.key ? "2px solid var(--accent)" : "2px solid transparent",
              background: tab === t.key ? "var(--surface)" : "transparent",
              color: tab === t.key ? "var(--accent)" : "var(--text-secondary)",
              fontSize: 13, fontWeight: tab === t.key ? 800 : 600,
              cursor: "pointer", transition: "all 0.15s",
              position: "relative",
              fontFamily: "var(--font-body)",
            }}
          >
            <span style={{ fontSize: 15 }}>{t.icon}</span>
            {t.label}
            {/* Due badge on Review tab */}
            {t.key === "review" && dueCount > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 900,
                padding: "1px 6px", borderRadius: 99,
                background: "var(--error)", color: "#fff",
                minWidth: 18, textAlign: "center",
                lineHeight: "16px",
              }}>
                {dueCount > 99 ? "99+" : dueCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{
        flex: 1, overflow: "auto",
        padding: "20px",
        position: "relative", zIndex: 1,
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto", width: "100%" }}>
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
