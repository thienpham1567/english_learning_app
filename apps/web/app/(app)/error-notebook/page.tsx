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
import { Tag, Tooltip, Select, Empty } from "antd";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { WritingPatternSection } from "./_components/WritingPatternSection";
import { DeepExplanation } from "./_components/DeepExplanation";

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
      }}
    >
      {/* Header */}
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
                style={{ borderRadius: 99, fontWeight: 700, fontSize: 12, margin: 0, padding: "2px 12px" }}
              >
                <ExclamationCircleOutlined style={{ marginRight: 4 }} />
                {unresolvedCount} chưa nắm
              </Tag>
            ) : (
              <Tag
                color="success"
                style={{ borderRadius: 99, fontWeight: 700, fontSize: 12, margin: 0, padding: "2px 12px" }}
              >
                <CheckCircleOutlined style={{ marginRight: 4 }} />
                Đã nắm hết
              </Tag>
            )}
          </div>
        }
      />

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "20px 16px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", width: "100%" }}>
          {/* Stats strip */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            {[
              {
                icon: <CloseCircleOutlined style={{ color: "var(--error)" }} />,
                label: "Chưa nắm",
                value: String(unresolvedCount),
                accent: unresolvedCount > 0 ? "var(--error)" : "var(--text-muted)",
              },
              {
                icon: <CheckCircleOutlined style={{ color: "var(--success)" }} />,
                label: "Đã hiểu",
                value: String(errors.filter((e) => e.isResolved).length),
                accent: "var(--success)",
              },
              {
                icon: <BookOutlined style={{ color: "var(--accent)" }} />,
                label: "Tổng cộng",
                value: String(total),
                accent: "var(--accent)",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  flex: 1, display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 14px", borderRadius: 12,
                  background: "var(--card-bg)", border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <span style={{ fontSize: 18, lineHeight: 1 }}>{stat.icon}</span>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{stat.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: stat.accent }}>{stat.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div
            style={{
              display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16,
              alignItems: "center", padding: "12px 16px", borderRadius: 12,
              background: "var(--card-bg)", border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <FilterOutlined style={{ color: "var(--text-muted)", fontSize: 13 }} />
            <Select
              placeholder="Module"
              allowClear
              value={filterModule}
              onChange={(v) => setFilterModule(v ?? null)}
              style={{ width: 130 }}
              options={[
                { value: "grammar-quiz", label: "Ngữ pháp" },
                { value: "grammar-lessons", label: "Bài học" },
                { value: "mock-test", label: "Thi thử" },
                { value: "daily-challenge", label: "Thử thách" },
                { value: "listening", label: "Nghe" },
              ]}
              size="small"
            />
            <Select
              placeholder="Chủ đề"
              allowClear
              value={filterTopic}
              onChange={(v) => setFilterTopic(v ?? null)}
              style={{ width: 160 }}
              options={topics.map((t) => ({ value: t, label: t }))}
              size="small"
            />
            <Select
              value={filterResolved}
              onChange={(v) => setFilterResolved(v)}
              style={{ width: 130 }}
              options={[
                { value: "false", label: "Chưa nắm" },
                { value: "true", label: "Đã hiểu" },
                { value: "", label: "Tất cả" },
              ]}
              size="small"
            />
            <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: "auto", fontWeight: 600 }}>
              {total} kết quả
            </span>
          </div>

          {/* Resolve all button */}
          {unresolvedCount > 1 && (
            <div style={{ marginBottom: 14, textAlign: "right" }}>
              <button
                onClick={resolveAll}
                style={{
                  padding: "6px 14px", borderRadius: 8,
                  border: "1px solid color-mix(in srgb, var(--success) 30%, var(--border))",
                  background: "color-mix(in srgb, var(--success) 6%, var(--surface))",
                  color: "var(--success)", cursor: "pointer", fontSize: 12, fontWeight: 600,
                }}
              >
                <CheckCircleOutlined style={{ marginRight: 4 }} /> Đánh dấu tất cả đã hiểu
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{
              textAlign: "center", padding: "60px 20px", borderRadius: 20,
              background: "var(--card-bg)", border: "1px solid var(--border)",
            }}>
              <LoadingOutlined style={{ fontSize: 36, color: "var(--accent)" }} />
              <p style={{ color: "var(--text-muted)", marginTop: 12, fontSize: 13 }}>Đang tải dữ liệu...</p>
            </div>
          )}

          {/* Empty */}
          {!loading && errors.length === 0 && (
            <div style={{
              textAlign: "center", padding: "48px 24px", borderRadius: 20,
              background: "var(--card-bg)", border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}>
              <InboxOutlined style={{ fontSize: 48, color: "var(--text-muted)", marginBottom: 16 }} />
              <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>
                {filterResolved === "false" ? "Không có lỗi chưa nắm" : "Không tìm thấy kết quả"}
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>
                {filterResolved === "false"
                  ? "Hãy làm bài tập để bắt đầu thu thập lỗi sai!"
                  : "Thử thay đổi bộ lọc để xem thêm."}
              </p>
            </div>
          )}

          {/* Writing pattern section */}
          <WritingPatternSection />

          {/* Error cards */}
          {!loading && errors.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {errors.map((err) => (
                <div
                  key={err.id}
                  style={{
                    padding: "14px 16px", borderRadius: 14,
                    background: "var(--card-bg)",
                    border: "1px solid var(--border)",
                    borderLeft: err.isResolved
                      ? "4px solid var(--success)"
                      : "4px solid var(--error)",
                    opacity: err.isResolved ? 0.65 : 1,
                    boxShadow: "var(--shadow-sm)",
                    transition: "opacity 0.3s, box-shadow 0.15s",
                  }}
                >
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                    {err.isResolved
                      ? <CheckCircleOutlined style={{ color: "var(--success)", fontSize: 15 }} />
                      : <CloseCircleOutlined style={{ color: "var(--error)", fontSize: 15 }} />}
                    <Tag
                      color={MODULE_COLORS[err.sourceModule] ?? "default"}
                      style={{ fontSize: 11, borderRadius: 6, margin: 0, fontWeight: 600 }}
                    >
                      {MODULE_LABELS[err.sourceModule] ?? err.sourceModule}
                    </Tag>
                    {err.grammarTopic && (
                      <Tag color="default" style={{ fontSize: 11, borderRadius: 6, margin: 0 }}>
                        {err.grammarTopic}
                      </Tag>
                    )}
                    <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
                      {new Date(err.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>

                  {/* Question */}
                  <p style={{ fontSize: 14, margin: "0 0 10px", lineHeight: 1.6, color: "var(--text)" }}>
                    {err.questionStem}
                  </p>

                  {/* Answers */}
                  <div style={{ display: "flex", gap: 12, fontSize: 13, marginBottom: 10 }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "5px 10px", borderRadius: 8,
                      background: "color-mix(in srgb, var(--error) 6%, var(--surface))",
                      border: "1px solid color-mix(in srgb, var(--error) 15%, transparent)",
                    }}>
                      <CloseCircleOutlined style={{ color: "var(--error)", fontSize: 12 }} />
                      <span style={{ color: "var(--error)", fontWeight: 600 }}>{err.userAnswer}</span>
                    </div>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "5px 10px", borderRadius: 8,
                      background: "color-mix(in srgb, var(--success) 6%, var(--surface))",
                      border: "1px solid color-mix(in srgb, var(--success) 15%, transparent)",
                    }}>
                      <CheckCircleOutlined style={{ color: "var(--success)", fontSize: 12 }} />
                      <span style={{ color: "var(--success)", fontWeight: 600 }}>{err.correctAnswer}</span>
                    </div>
                  </div>

                  {/* Deep Explanation */}
                  <DeepExplanation
                    errorId={err.id}
                    cached={err.deepExplanation}
                    fallbackEn={err.explanationEn}
                    fallbackVi={err.explanationVi}
                  />

                  {/* Actions */}
                  {!err.isResolved && (
                    <div style={{ marginTop: 10, textAlign: "right" }}>
                      <Tooltip title="Đánh dấu đã hiểu">
                        <button
                          onClick={() => resolveError(err.id)}
                          style={{
                            padding: "5px 12px", borderRadius: 8,
                            border: "1px solid color-mix(in srgb, var(--success) 30%, var(--border))",
                            background: "color-mix(in srgb, var(--success) 6%, var(--surface))",
                            color: "var(--success)", cursor: "pointer", fontSize: 12, fontWeight: 600,
                          }}
                        >
                          <CheckCircleOutlined style={{ marginRight: 4 }} /> Đã hiểu
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
            <div style={{ textAlign: "center", marginTop: 20, marginBottom: 20 }}>
              <button
                onClick={fetchErrors}
                style={{
                  padding: "8px 18px", borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "var(--card-bg)", color: "var(--text-secondary)",
                  cursor: "pointer", fontSize: 12, fontWeight: 600,
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <ReloadOutlined style={{ marginRight: 4 }} /> Tải lại
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
