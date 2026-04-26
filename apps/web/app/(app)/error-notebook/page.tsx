"use client";
import { api } from "@/lib/api-client";
import { useState, useEffect, useCallback } from "react";
import {
  BookOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FilterOutlined,
  LoadingOutlined,
  ReloadOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { Tag, Tooltip, Select } from "antd";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { WritingPatternSection } from "./_components/WritingPatternSection";
import { DeepExplanation } from "./_components/DeepExplanation";
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

const MODULE_COLORS: Record<string, string> = {
  "grammar-quiz": "blue",
  "grammar-lessons": "purple",
  "mock-test": "magenta",
  "daily-challenge": "orange",
  listening: "green",
};

export default function ErrorNotebookPage() {
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModule, setFilterModule] = useState<string | null>(null);
  const [filterTopic, setFilterTopic] = useState<string | null>(null);
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

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        flex: 1,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div className="grain-overlay" style={{ opacity: 0.03, zIndex: 0 }} />
      {/* Header */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <ModuleHeader
          icon={<BookOutlined />}
          gradient="var(--gradient-error-notebook)"
          title="Sổ lỗi sai"
          subtitle="Tổng hợp lỗi sai từ tất cả bài tập"
          action={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {unresolvedCount > 0 ? (
                <Tag
                  color="error"
                  style={{ borderRadius: 99, fontWeight: 700, fontSize: 13, margin: 0, padding: "4px 16px", border: "none", background: "var(--error-bg)", color: "var(--error)" }}
                >
                  <ExclamationCircleOutlined style={{ marginRight: 6 }} />
                  {unresolvedCount} chưa nắm
                </Tag>
              ) : (
                <Tag
                  color="success"
                  style={{ borderRadius: 99, fontWeight: 700, fontSize: 13, margin: 0, padding: "4px 16px", border: "none", background: "var(--success-bg)", color: "var(--success)" }}
                >
                  <CheckCircleOutlined style={{ marginRight: 6 }} />
                  Đã nắm hết
                </Tag>
              )}
            </div>
          }
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "var(--space-8) var(--space-6)", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 800, margin: "0 auto", width: "100%" }}>
          {/* Stats strip */}
          <div style={{ display: "flex", gap: "var(--space-4)", marginBottom: "var(--space-6)" }} className="anim-fade-up">
            {[
              {
                icon: <CloseCircleOutlined style={{ color: "var(--error)" }} />,
                label: "Chưa nắm",
                value: String(unresolvedCount),
                accent: unresolvedCount > 0 ? "var(--error)" : "var(--text-muted)",
                bg: "var(--error-bg)"
              },
              {
                icon: <CheckCircleOutlined style={{ color: "var(--success)" }} />,
                label: "Đã hiểu",
                value: String(errors.filter((e) => e.isResolved).length),
                accent: "var(--success)",
                bg: "var(--success-bg)"
              },
              {
                icon: <BookOutlined style={{ color: "var(--accent)" }} />,
                label: "Tổng cộng",
                value: String(total),
                accent: "var(--accent)",
                bg: "var(--accent-muted)"
              },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={`anim-delay-${i + 1}`}
                style={{
                  flex: 1, display: "flex", alignItems: "center", gap: 16,
                  padding: "20px 24px", borderRadius: "var(--radius-2xl)",
                  background: "var(--surface)", border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-sm)", transition: "transform var(--duration-fast) ease, box-shadow var(--duration-fast) ease"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: "50%", background: stat.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24
                }}>
                  {stat.icon}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{stat.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: stat.accent, fontFamily: "var(--font-display)", lineHeight: 1 }}>{stat.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Error Pattern Summary (Story 23.2, AC: 1-4) */}
          {!loading && errors.length > 0 && (
            <div className="anim-fade-up anim-delay-2" style={{ marginBottom: "var(--space-6)" }}>
              <ErrorPatternSummary errors={errors} />
            </div>
          )}

          {/* Error Improvement Trend (Story 23.4, AC: 1-4) */}
          {!loading && errors.length > 0 && (
            <div className="anim-fade-up anim-delay-3" style={{ marginBottom: "var(--space-6)" }}>
              <ErrorTrendSection errors={errors} />
            </div>
          )}

          {/* Filters */}
          <div
            className="anim-fade-up anim-delay-4"
            style={{
              display: "flex", gap: 12, flexWrap: "wrap", marginBottom: "var(--space-6)",
              alignItems: "center", padding: "16px 20px", borderRadius: "var(--radius-xl)",
              background: "var(--surface)", border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <FilterOutlined style={{ color: "var(--text-muted)", fontSize: 16 }} />
            <Select
              placeholder="Module"
              allowClear
              value={filterModule}
              onChange={(v) => setFilterModule(v ?? null)}
              style={{ width: 140 }}
              options={[
                { value: "grammar-quiz", label: "Ngữ pháp" },
                { value: "grammar-lessons", label: "Bài học" },
                { value: "mock-test", label: "Thi thử" },
                { value: "daily-challenge", label: "Thử thách" },
                { value: "listening", label: "Nghe" },
              ]}
              size="large"
            />
            <Select
              placeholder="Chủ đề"
              allowClear
              value={filterTopic}
              onChange={(v) => setFilterTopic(v ?? null)}
              style={{ width: 180 }}
              options={topics.map((t) => ({ value: t, label: t }))}
              size="large"
            />
            <Select
              value={filterResolved}
              onChange={(v) => setFilterResolved(v)}
              style={{ width: 140 }}
              options={[
                { value: "false", label: "Chưa nắm" },
                { value: "true", label: "Đã hiểu" },
                { value: "", label: "Tất cả" },
              ]}
              size="large"
            />
            <span style={{ fontSize: 14, color: "var(--text-muted)", marginLeft: "auto", fontWeight: 600 }}>
              {total} kết quả
            </span>
          </div>

          {/* Resolve all button */}
          {unresolvedCount > 1 && (
            <div className="anim-fade-up anim-delay-5" style={{ marginBottom: "var(--space-4)", textAlign: "right" }}>
              <button
                onClick={resolveAll}
                className="btn-shimmer"
                style={{
                  padding: "10px 20px", borderRadius: "var(--radius-xl)",
                  border: "none",
                  background: "var(--success-bg)",
                  color: "var(--success)", cursor: "pointer", fontSize: 14, fontWeight: 600,
                  transition: "all var(--duration-fast) ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--success)";
                  e.currentTarget.style.color = "#fff";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--success-bg)";
                  e.currentTarget.style.color = "var(--success)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <CheckCircleOutlined style={{ marginRight: 8 }} /> Đánh dấu tất cả đã hiểu
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{
              textAlign: "center", padding: "80px 20px", borderRadius: "var(--radius-2xl)",
              background: "var(--surface)", border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)"
            }}>
              <LoadingOutlined style={{ fontSize: 48, color: "var(--accent)" }} />
              <p style={{ color: "var(--text-muted)", marginTop: 16, fontSize: 15, fontWeight: 500 }}>Đang tải dữ liệu...</p>
            </div>
          )}

          {/* Empty */}
          {!loading && errors.length === 0 && (
            <div className="anim-scale-in" style={{
              textAlign: "center", padding: "80px 24px", borderRadius: "var(--radius-2xl)",
              background: "var(--surface)", border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}>
              <div style={{
                width: 80, height: 80, borderRadius: "50%", background: "var(--bg-deep)",
                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px"
              }}>
                <InboxOutlined style={{ fontSize: 40, color: "var(--text-muted)" }} />
              </div>
              <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)" }}>
                {filterResolved === "false" ? "Tuyệt vời, không có lỗi chưa nắm!" : "Không tìm thấy kết quả"}
              </h3>
              <p style={{ margin: 0, fontSize: 15, color: "var(--text-secondary)" }}>
                {filterResolved === "false"
                  ? "Hãy tiếp tục làm bài tập để mở rộng kiến thức nhé!"
                  : "Thử thay đổi bộ lọc để xem thêm."}
              </p>
            </div>
          )}

          {/* Writing pattern section */}
          <div style={{ marginBottom: "var(--space-6)" }}>
            <WritingPatternSection />
          </div>

          {/* Error cards */}
          {!loading && errors.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }} className="anim-fade-up anim-delay-5">
              {errors.map((err) => (
                <div
                  key={err.id}
                  style={{
                    padding: "24px", borderRadius: "var(--radius-2xl)",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    position: "relative",
                    overflow: "hidden",
                    opacity: err.isResolved ? 0.75 : 1,
                    boxShadow: "var(--shadow-sm)",
                    transition: "all var(--duration-fast) ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.borderColor = err.isResolved ? "var(--success)" : "var(--accent)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                >
                  <div style={{
                    position: "absolute", left: 0, top: 0, bottom: 0, width: 4,
                    background: err.isResolved ? "var(--success)" : "var(--error)",
                  }} />
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap", paddingLeft: 8 }}>
                    {err.isResolved
                      ? <CheckCircleOutlined style={{ color: "var(--success)", fontSize: 18 }} />
                      : <WarningOutlined style={{ color: "var(--error)", fontSize: 18 }} />}
                    <Tag
                      color={MODULE_COLORS[err.sourceModule] ?? "default"}
                      style={{ fontSize: 12, borderRadius: "var(--radius)", margin: 0, fontWeight: 700, padding: "2px 10px", border: "none" }}
                    >
                      {MODULE_LABELS[err.sourceModule] ?? err.sourceModule}
                    </Tag>
                    {err.grammarTopic && (
                      <Tag color="default" style={{ fontSize: 12, borderRadius: "var(--radius)", margin: 0, fontWeight: 600, padding: "2px 10px", background: "var(--bg-secondary)", border: "none" }}>
                        {err.grammarTopic}
                      </Tag>
                    )}
                    <span style={{ marginLeft: "auto", fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>
                      {new Date(err.createdAt).toLocaleDateString("vi-VN", { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Question */}
                  <p style={{ fontSize: 16, margin: "0 0 16px", paddingLeft: 8, lineHeight: 1.6, color: "var(--text-primary)", fontWeight: 500 }}>
                    {err.questionStem}
                  </p>

                  {/* Answers */}
                  <div style={{ display: "flex", gap: 16, fontSize: 14, marginBottom: 16, paddingLeft: 8, flexWrap: "wrap" }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 16px", borderRadius: "var(--radius-xl)",
                      background: "var(--error-bg)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                    }}>
                      <CloseCircleOutlined style={{ color: "var(--error)", fontSize: 14 }} />
                      <span style={{ color: "var(--error)", fontWeight: 600 }}>{err.userAnswer}</span>
                    </div>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 16px", borderRadius: "var(--radius-xl)",
                      background: "var(--success-bg)",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                    }}>
                      <CheckCircleOutlined style={{ color: "var(--success)", fontSize: 14 }} />
                      <span style={{ color: "var(--success)", fontWeight: 600 }}>{err.correctAnswer}</span>
                    </div>
                  </div>

                  {/* Deep Explanation */}
                  <div style={{ paddingLeft: 8 }}>
                    <DeepExplanation
                      errorId={err.id}
                      cached={err.deepExplanation}
                      fallbackEn={err.explanationEn}
                      fallbackVi={err.explanationVi}
                    />
                  </div>

                  {/* Actions */}
                  {!err.isResolved && (
                    <div style={{ marginTop: 16, textAlign: "right" }}>
                      <Tooltip title="Đánh dấu đã hiểu">
                        <button
                          onClick={() => resolveError(err.id)}
                          style={{
                            padding: "8px 16px", borderRadius: "var(--radius-xl)",
                            border: "none",
                            background: "var(--success-bg)",
                            color: "var(--success)", cursor: "pointer", fontSize: 14, fontWeight: 600,
                            transition: "all var(--duration-fast) ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--success)";
                            e.currentTarget.style.color = "#fff";
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.2)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "var(--success-bg)";
                            e.currentTarget.style.color = "var(--success)";
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          <CheckCircleOutlined style={{ marginRight: 6 }} /> Đã hiểu
                        </button>
                      </Tooltip>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Refresh */}
          {!loading && (
            <div style={{ textAlign: "center", marginTop: 32, marginBottom: 32 }}>
              <button
                onClick={fetchErrors}
                style={{
                  padding: "12px 24px", borderRadius: "var(--radius-xl)",
                  border: "1px solid var(--border)",
                  background: "var(--surface)", color: "var(--text-secondary)",
                  cursor: "pointer", fontSize: 14, fontWeight: 600,
                  boxShadow: "var(--shadow-sm)",
                  transition: "all var(--duration-fast) ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "var(--shadow-md)";
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.color = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                <ReloadOutlined style={{ marginRight: 8 }} /> Tải lại dữ liệu
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
