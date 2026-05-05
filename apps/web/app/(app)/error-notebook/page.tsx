"use client";
import { api } from "@/lib/api-client";
import { useState, useEffect, useCallback } from "react";
import {
  ExceptionOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FilterOutlined,
  LoadingOutlined,
  ReloadOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { Tooltip, Skeleton, Empty } from "antd";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { WritingPatternSection } from "./_components/WritingPatternSection";
import { DeepExplanation } from "./_components/DeepExplanation";
import { InlinePractice } from "./_components/InlinePractice";
import { ErrorPatternSummary } from "./_components/ErrorPatternSummary";
import { ErrorTrendSection } from "./_components/ErrorTrendSection";

type DeepExplanationData = {
  whyWrong: string;
  whyCorrect: string;
  grammarRule: string;
  examples: string[];
  tip: string;
};

type ErrorEntry = {
  id: string;
  sourceModule: string;
  questionStem: string;
  options: string[] | null;
  userAnswer: string;
  correctAnswer: string;
  explanationEn: string | null;
  explanationVi: string | null;
  grammarTopic: string | null;
  isResolved: boolean;
  deepExplanation: DeepExplanationData | null;
  createdAt: string;
};

const MODULE_LABELS: Record<string, string> = {
  "grammar-quiz": "Ngữ pháp",
  "grammar-lessons": "Bài học",
  "mock-test": "Thi thử",
  "daily-challenge": "Thử thách",
  listening: "Nghe",
};

const FILTER_RESOLVED_OPTIONS = [
  { value: "false", label: "Chưa nắm" },
  { value: "true", label: "Đã hiểu" },
  { value: "", label: "Tất cả" },
];

const MODULE_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "grammar-quiz", label: "Ngữ pháp" },
  { value: "grammar-lessons", label: "Bài học" },
  { value: "mock-test", label: "Thi thử" },
  { value: "daily-challenge", label: "Thử thách" },
  { value: "listening", label: "Nghe" },
];

export default function ErrorNotebookPage() {
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModule, setFilterModule] = useState<string>("");
  const [filterTopic, setFilterTopic] = useState<string>("");
  const [filterResolved, setFilterResolved] = useState<string>("false");

  const fetchErrors = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterModule) params.set("module", filterModule);
    if (filterTopic) params.set("topic", filterTopic);
    if (filterResolved) params.set("resolved", filterResolved);
    params.set("limit", "50");

    try {
      const data = await api.get<{ errors: ErrorEntry[]; total: number; topics: string[] }>(`/errors?${params}`);
      if (data) {
        setErrors(data.errors);
        setTotal(data.total);
        setTopics(data.topics);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [filterModule, filterTopic, filterResolved]);

  useEffect(() => {
    fetchErrors();
  }, [fetchErrors]);

  const resolveError = useCallback(async (id: string) => {
    try {
      await api.patch("/errors", { ids: [id] });
      setErrors((prev) =>
        prev.map((e) => (e.id === id ? { ...e, isResolved: true, resolvedAt: new Date().toISOString() } : e)),
      );
    } catch {
      // Ignore
    }
  }, []);

  const resolveAll = useCallback(async () => {
    const unresolvedIds = errors.filter((e) => !e.isResolved).map((e) => e.id);
    if (unresolvedIds.length === 0) return;
    try {
      await api.patch("/errors", { ids: unresolvedIds });
      setErrors((prev) => prev.map((e) => ({ ...e, isResolved: true })));
    } catch {
      // Ignore
    }
  }, [errors]);

  const unresolvedCount = errors.filter((e) => !e.isResolved).length;
  const resolvedCount = errors.filter((e) => e.isResolved).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, flex: 1, overflow: "hidden", position: "relative" }}>
      <div className="grain-overlay" style={{ opacity: 0.03, zIndex: 0 }} />

      {/* Header */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <ModuleHeader
          icon={<ExceptionOutlined />}
          gradient="var(--gradient-error-notebook)"
          title="Sổ lỗi sai"
          subtitle="Tổng hợp lỗi sai từ tất cả bài tập"
          action={
            unresolvedCount > 0 ? (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)",
                borderRadius: 99, padding: "5px 14px",
                fontSize: 13, fontWeight: 700, color: "#fff",
                border: "1px solid rgba(255,255,255,0.2)",
              }}>
                <ExclamationCircleOutlined style={{ fontSize: 12 }} />
                {unresolvedCount} chưa nắm
              </span>
            ) : (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)",
                borderRadius: 99, padding: "5px 14px",
                fontSize: 13, fontWeight: 700, color: "#fff",
                border: "1px solid rgba(255,255,255,0.2)",
              }}>
                <CheckCircleOutlined style={{ fontSize: 12 }} />
                Đã nắm hết
              </span>
            )
          }
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "24px 20px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 820, margin: "0 auto", width: "100%" }}>

          {/* ── Stats row ── */}
          <div
            className="anim-fade-up"
            style={{
              display: "flex", gap: 1, marginBottom: 24,
              background: "var(--border)", borderRadius: 16,
              overflow: "hidden", border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {[
              { label: "Chưa nắm", value: unresolvedCount, color: unresolvedCount > 0 ? "var(--error)" : "var(--text-muted)", icon: "✗" },
              { label: "Đã hiểu", value: resolvedCount, color: "var(--success)", icon: "✓" },
              { label: "Tổng cộng", value: total, color: "var(--accent)", icon: "#" },
            ].map((s, i) => (
              <div key={s.label} style={{
                flex: 1, display: "flex", alignItems: "center", gap: 14,
                padding: "18px 22px",
                background: "var(--surface)",
                transition: "background 0.15s",
              }}>
                <span style={{
                  fontSize: 11, fontWeight: 900, color: s.color,
                  opacity: 0.6, fontFamily: "monospace",
                  lineHeight: 1,
                }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1, fontFamily: "var(--font-display)" }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500, marginTop: 2 }}>
                    {s.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Error Pattern Summary ── */}
          {!loading && errors.length > 0 && (
            <div className="anim-fade-up anim-delay-1" style={{ marginBottom: 20 }}>
              <ErrorPatternSummary errors={errors} />
            </div>
          )}

          {/* ── Error Trend ── */}
          {!loading && errors.length > 0 && (
            <div className="anim-fade-up anim-delay-2" style={{ marginBottom: 20 }}>
              <ErrorTrendSection errors={errors} />
            </div>
          )}

          {/* ── Writing pattern ── */}
          <div style={{ marginBottom: 20 }}>
            <WritingPatternSection />
          </div>

          {/* ── Filters ── */}
          <div
            className="anim-fade-up anim-delay-3"
            style={{
              display: "flex", gap: 8, flexWrap: "wrap",
              alignItems: "center", marginBottom: 16,
            }}
          >
            <FilterOutlined style={{ color: "var(--text-muted)", fontSize: 13, flexShrink: 0 }} />

            {/* Status pills */}
            <div style={{ display: "flex", gap: 4 }}>
              {FILTER_RESOLVED_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilterResolved(opt.value)}
                  style={{
                    padding: "5px 13px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                    border: "1.5px solid",
                    cursor: "pointer", transition: "all 0.15s",
                    borderColor: filterResolved === opt.value ? "var(--accent)" : "var(--border)",
                    background: filterResolved === opt.value ? "var(--accent)" : "var(--surface)",
                    color: filterResolved === opt.value ? "#fff" : "var(--text-secondary)",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Module pills */}
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {MODULE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilterModule(opt.value)}
                  style={{
                    padding: "5px 13px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                    border: "1.5px solid",
                    cursor: "pointer", transition: "all 0.15s",
                    borderColor: filterModule === opt.value ? "var(--accent)" : "var(--border)",
                    background: filterModule === opt.value ? "color-mix(in srgb, var(--accent) 12%, var(--surface))" : "var(--surface)",
                    color: filterModule === opt.value ? "var(--accent)" : "var(--text-secondary)",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Topic select (only if topics exist) */}
            {topics.length > 0 && (
              <select
                value={filterTopic}
                onChange={(e) => setFilterTopic(e.target.value)}
                style={{
                  padding: "5px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                  border: "1.5px solid var(--border)",
                  background: filterTopic ? "color-mix(in srgb, var(--accent) 12%, var(--surface))" : "var(--surface)",
                  color: filterTopic ? "var(--accent)" : "var(--text-secondary)",
                  cursor: "pointer", outline: "none",
                }}
              >
                <option value="">Chủ đề</option>
                {topics.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            )}

            <span style={{
              marginLeft: "auto", fontSize: 12, fontWeight: 700,
              color: "var(--text-muted)", fontVariantNumeric: "tabular-nums",
            }}>
              {total} kết quả
            </span>
          </div>

          {/* ── Resolve all ── */}
          {unresolvedCount > 1 && (
            <div className="anim-fade-up" style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={resolveAll}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "8px 18px", borderRadius: 99,
                  border: "1.5px solid color-mix(in srgb, var(--success) 35%, transparent)",
                  background: "var(--success-bg)",
                  color: "var(--success)", cursor: "pointer",
                  fontSize: 13, fontWeight: 600, transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--success)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--success-bg)"; e.currentTarget.style.color = "var(--success)"; }}
              >
                <CheckCircleOutlined style={{ fontSize: 13 }} />
                Đánh dấu tất cả đã hiểu
              </button>
            </div>
          )}

          {/* ── Loading ── */}
          {loading && (
            <div style={{ padding: 24, borderRadius: 16, background: "var(--surface)", border: "1px solid var(--border)" }}>
              <Skeleton active paragraph={{ rows: 4 }} />
            </div>
          )}

          {/* ── Empty ── */}
          {!loading && errors.length === 0 && (
            <div className="anim-scale-in" style={{
              padding: "72px 24px", borderRadius: 20,
              background: "var(--surface)", border: "1px solid var(--border)",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>
                {filterResolved === "false" ? "🎉" : "📭"}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)", marginBottom: 6 }}>
                {filterResolved === "false" ? "Tuyệt vời, không có lỗi chưa nắm!" : "Không tìm thấy kết quả"}
              </div>
              <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
                {filterResolved === "false"
                  ? "Hãy tiếp tục làm bài tập để mở rộng kiến thức nhé!"
                  : "Thử thay đổi bộ lọc để xem thêm."}
              </div>
            </div>
          )}

          {/* ── Section label ── */}
          {!loading && errors.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 3, height: 14, borderRadius: 2, background: "var(--accent)", flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--accent)" }}>
                Danh sách lỗi sai
              </span>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>
          )}

          {/* ── Error cards ── */}
          {!loading && errors.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }} className="anim-fade-up anim-delay-4">
              {errors.map((err) => (
                <ErrorCard
                  key={err.id}
                  err={err}
                  onResolve={() => resolveError(err.id)}
                />
              ))}
            </div>
          )}

          {/* ── Refresh ── */}
          {!loading && (
            <div style={{ textAlign: "center", marginTop: 32, marginBottom: 32 }}>
              <button
                onClick={fetchErrors}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "8px 20px", borderRadius: 99,
                  border: "1.5px solid var(--border)",
                  background: "var(--surface)", color: "var(--text-secondary)",
                  cursor: "pointer", fontSize: 13, fontWeight: 600,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
              >
                <ReloadOutlined style={{ fontSize: 12 }} />
                Tải lại
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ErrorCard({ err, onResolve }: { err: any; onResolve: () => void }) {
  const date = new Date(err.createdAt).toLocaleDateString("vi-VN", { day: "numeric", month: "short" });

  return (
    <div
      style={{
        borderRadius: 16,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        overflow: "hidden",
        opacity: err.isResolved ? 0.72 : 1,
        boxShadow: "var(--shadow-sm)",
        transition: "box-shadow 0.18s, border-color 0.18s, transform 0.18s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
        e.currentTarget.style.borderColor = err.isResolved ? "color-mix(in srgb, var(--success) 40%, var(--border))" : "color-mix(in srgb, var(--accent) 40%, var(--border))";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Top accent stripe + header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 16px",
        background: err.isResolved
          ? "color-mix(in srgb, var(--success) 6%, var(--bg))"
          : "color-mix(in srgb, var(--error) 5%, var(--bg))",
        borderBottom: "1px solid var(--border)",
      }}>
        {err.isResolved
          ? <CheckCircleOutlined style={{ color: "var(--success)", fontSize: 14, flexShrink: 0 }} />
          : <WarningOutlined style={{ color: "var(--error)", fontSize: 14, flexShrink: 0 }} />}

        <div style={{ display: "flex", gap: 6, flex: 1, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 99,
            background: err.isResolved ? "var(--success-bg)" : "var(--error-bg)",
            color: err.isResolved ? "var(--success)" : "var(--error)",
          }}>
            {MODULE_LABELS[err.sourceModule] ?? err.sourceModule}
          </span>
          {err.grammarTopic && (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 99,
              background: "var(--bg-deep)", color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}>
              {err.grammarTopic}
            </span>
          )}
        </div>

        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500, flexShrink: 0 }}>
          {date}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: "16px 18px" }}>
        {/* Question */}
        <p style={{ fontSize: 15, margin: "0 0 14px", lineHeight: 1.65, color: "var(--text-primary)", fontWeight: 500 }}>
          {err.questionStem}
        </p>

        {/* Answer comparison */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "7px 14px", borderRadius: 10, flex: "0 0 auto",
            background: "var(--error-bg)",
            border: "1px solid color-mix(in srgb, var(--error) 18%, transparent)",
          }}>
            <CloseCircleOutlined style={{ color: "var(--error)", fontSize: 12 }} />
            <span style={{ color: "var(--error)", fontWeight: 700, fontSize: 13 }}>{err.userAnswer}</span>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "7px 14px", borderRadius: 10, flex: "0 0 auto",
            background: "var(--success-bg)",
            border: "1px solid color-mix(in srgb, var(--success) 18%, transparent)",
          }}>
            <CheckCircleOutlined style={{ color: "var(--success)", fontSize: 12 }} />
            <span style={{ color: "var(--success)", fontWeight: 700, fontSize: 13 }}>{err.correctAnswer}</span>
          </div>
        </div>

        {/* Deep explanation */}
        <DeepExplanation
          errorId={err.id}
          cached={err.deepExplanation}
          fallbackEn={err.explanationEn}
          fallbackVi={err.explanationVi}
        />

        {/* Inline practice */}
        <InlinePractice errorId={err.id} onResolved={onResolve} />

        {/* Resolve button */}
        {!err.isResolved && (
          <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={onResolve}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "6px 16px", borderRadius: 99,
                border: "1.5px solid color-mix(in srgb, var(--success) 35%, transparent)",
                background: "var(--success-bg)", color: "var(--success)",
                cursor: "pointer", fontSize: 12, fontWeight: 700, transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--success)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--success-bg)"; e.currentTarget.style.color = "var(--success)"; }}
            >
              <CheckCircleOutlined style={{ fontSize: 11 }} /> Đã hiểu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
