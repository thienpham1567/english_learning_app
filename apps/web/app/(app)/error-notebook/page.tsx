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
  InfoCircleOutlined,
} from "@ant-design/icons";
import { Tag, Tooltip, Collapse, Select, Empty } from "antd";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { WritingPatternSection } from "./_components/WritingPatternSection";

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
  createdAt: string;
};

const MODULE_LABELS: Record<string, string> = {
  "grammar-quiz": "Ngữ pháp",
  "mock-test": "Thi thử",
  "daily-challenge": "Thử thách",
  listening: "Nghe",
};

const MODULE_COLORS: Record<string, string> = {
  "grammar-quiz": "blue",
  "mock-test": "purple",
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
        overflow: "auto",
      }}
    >
      {/* Header */}
      <ModuleHeader
        icon={<BookOutlined />}
        gradient="linear-gradient(135deg, var(--accent), var(--secondary))"
        title="Sổ lỗi sai 📋"
        subtitle="Error Notebook · Tổng hợp lỗi sai từ tất cả bài tập"
        action={
          <Tag color={unresolvedCount > 0 ? "error" : "success"} style={{ borderRadius: 99 }}>
            {unresolvedCount} chưa nắm
          </Tag>
        }
      />

      <div style={{ flex: 1, padding: 24, maxWidth: 720, margin: "0 auto", width: "100%" }}>
        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 16,
            alignItems: "center",
          }}
        >
          <FilterOutlined style={{ color: "var(--text-secondary)" }} />
          <Select
            placeholder="Module"
            allowClear
            value={filterModule}
            onChange={(v) => setFilterModule(v ?? null)}
            style={{ width: 130 }}
            options={[
              { value: "grammar-quiz", label: "Ngữ pháp" },
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
          <span style={{ fontSize: 12, color: "var(--text-secondary)", marginLeft: "auto" }}>
            {total} kết quả
          </span>
        </div>

        {/* Resolve all button */}
        {unresolvedCount > 1 && (
          <div style={{ marginBottom: 12, textAlign: "right" }}>
            <button
              onClick={resolveAll}
              style={{
                padding: "4px 12px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-secondary)",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              <CheckCircleOutlined /> Đánh dấu tất cả đã hiểu
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <LoadingOutlined style={{ fontSize: 32, color: "var(--accent)" }} />
          </div>
        )}

        {/* Empty */}
        {!loading && errors.length === 0 && (
          <Empty
            description={
              filterResolved === "false"
                ? "Chưa có lỗi sai nào. Hãy làm bài tập để bắt đầu!"
                : "Không tìm thấy kết quả"
            }
            style={{ padding: 40 }}
          />
        )}

        {/* Writing pattern section (AC4 — Story 19.2.4) */}
        <WritingPatternSection />

        {/* Error cards */}
        {!loading && errors.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {errors.map((err) => (
              <div
                key={err.id}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: "var(--card-bg)",
                  border: `1px solid ${err.isResolved ? "var(--border)" : "color-mix(in srgb, var(--error) 20%, transparent)"}`,
                  opacity: err.isResolved ? 0.7 : 1,
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <CloseCircleOutlined style={{ color: err.isResolved ? "var(--text-secondary)" : "var(--error)" }} />
                  <Tag color={MODULE_COLORS[err.sourceModule] ?? "default"} style={{ fontSize: 11 }}>
                    {MODULE_LABELS[err.sourceModule] ?? err.sourceModule}
                  </Tag>
                  {err.grammarTopic && (
                    <Tag color="default" style={{ fontSize: 11 }}>
                      {err.grammarTopic}
                    </Tag>
                  )}
                  <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-secondary)" }}>
                    {new Date(err.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>

                {/* Question */}
                <p style={{ fontSize: 14, margin: "0 0 8px", lineHeight: 1.5 }}>{err.questionStem}</p>

                {/* Answers */}
                <div style={{ display: "flex", gap: 16, fontSize: 13, marginBottom: 8 }}>
                  <span>
                    Bạn chọn: <strong style={{ color: "var(--error)" }}>{err.userAnswer}</strong>
                  </span>
                  <span>
                    Đáp án: <strong style={{ color: "var(--success)" }}>{err.correctAnswer}</strong>
                  </span>
                </div>

                {/* Explanation */}
                {(err.explanationEn || err.explanationVi) && (
                  <Collapse
                    size="small"
                    items={[
                      {
                        key: `exp-${err.id}`,
                        label: (
                          <span style={{ fontSize: 12 }}>
                            <InfoCircleOutlined /> Giải thích
                          </span>
                        ),
                        children: (
                          <div style={{ fontSize: 13 }}>
                            {err.explanationEn && <p style={{ margin: "0 0 4px" }}>{err.explanationEn}</p>}
                            {err.explanationVi && (
                              <p style={{ margin: 0, color: "var(--text-secondary)" }}>{err.explanationVi}</p>
                            )}
                          </div>
                        ),
                      },
                    ]}
                  />
                )}

                {/* Actions */}
                {!err.isResolved && (
                  <div style={{ marginTop: 8, textAlign: "right" }}>
                    <Tooltip title="Đánh dấu đã hiểu">
                      <button
                        onClick={() => resolveError(err.id)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          border: "1px solid color-mix(in srgb, var(--success) 27%, transparent)",
                          background: "color-mix(in srgb, var(--success) 7%, transparent)",
                          color: "var(--success)",
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        <CheckCircleOutlined /> Đã hiểu
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
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button
              onClick={fetchErrors}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-secondary)",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              <ReloadOutlined /> Tải lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
