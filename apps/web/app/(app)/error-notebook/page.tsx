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
  PlusOutlined,
  MinusOutlined,
} from "@ant-design/icons";
import { Table, Tag, Button, Space, Tooltip, Skeleton } from "antd";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { WritingPatternSection } from "./_components/WritingPatternSection";
import { DeepExplanation } from "./_components/DeepExplanation";
import { InlinePractice } from "./_components/InlinePractice";
import { ErrorPatternSummary } from "./_components/ErrorPatternSummary";
import { ErrorTrendSection } from "./_components/ErrorTrendSection";
import { PersonalizedDrill } from "./_components/PersonalizedDrill";
import * as m from "motion/react-client";

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
  "toeic-practice": " ETS Luyện",
  "toeic-mock-test": " ETS Mock",
  "toeic-diagnostic": " ETS Diag",
  "toeic-drill": " ETS Drill",
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
  { value: "toeic-practice", label: "TOEIC ETS" },
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

  const columns = [
    {
      title: "Trạng thái",
      dataIndex: "isResolved",
      key: "isResolved",
      width: 120,
      render: (isResolved: boolean) =>
        isResolved ? (
          <Tag color="success" style={{ borderRadius: 99, fontWeight: 700, padding: "2px 10px" }}>
            <CheckCircleOutlined /> Đã hiểu
          </Tag>
        ) : (
          <Tag color="error" style={{ borderRadius: 99, fontWeight: 700, padding: "2px 10px" }}>
            <WarningOutlined /> Chưa nắm
          </Tag>
        ),
    },
    {
      title: "Nguồn & Chủ đề",
      key: "source_topic",
      width: 200,
      render: (record: ErrorEntry) => (
        <Space direction="vertical" size={4} style={{ display: "flex" }}>
          <Tag color="purple" style={{ borderRadius: 6, fontWeight: 700 }}>
            {MODULE_LABELS[record.sourceModule] ?? record.sourceModule}
          </Tag>
          {record.grammarTopic && (
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>
              🔑 {record.grammarTopic}
            </span>
          )}
        </Space>
      ),
    },
    {
      title: "Câu hỏi",
      dataIndex: "questionStem",
      key: "questionStem",
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text} placement="topLeft">
          <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 13.5 }}>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: "So sánh đáp án",
      key: "answers",
      width: 220,
      render: (record: ErrorEntry) => (
        <Space size={6} wrap>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 10px",
              borderRadius: 8,
              background: "var(--error-bg)",
              border: "1px solid color-mix(in srgb, var(--error) 18%, transparent)",
              color: "var(--error)",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <CloseCircleOutlined style={{ fontSize: 10 }} />
            {record.userAnswer || "(Trống)"}
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 10px",
              borderRadius: 8,
              background: "var(--success-bg)",
              border: "1px solid color-mix(in srgb, var(--success) 18%, transparent)",
              color: "var(--success)",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <CheckCircleOutlined style={{ fontSize: 10 }} />
            {record.correctAnswer}
          </span>
        </Space>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 100,
      render: (dateStr: string) => (
        <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
          {new Date(dateStr).toLocaleDateString("vi-VN", { day: "numeric", month: "short" })}
        </span>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 110,
      render: (record: ErrorEntry) =>
        !record.isResolved && (
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              resolveError(record.id);
            }}
            style={{
              borderRadius: 99,
              background: "var(--success-bg)",
              borderColor: "color-mix(in srgb, var(--success) 35%, transparent)",
              color: "var(--success)",
              fontWeight: 700,
              fontSize: 11,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--success)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--success-bg)";
              e.currentTarget.style.color = "var(--success)";
            }}
          >
            Đã hiểu
          </Button>
        ),
    },
  ];

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
        <div style={{ maxWidth: 1000, margin: "0 auto", width: "100%" }}>

          {/* ── Stats row ── */}
          <div
            className="anim-fade-up"
            style={{
              display: "flex", gap: 12, marginBottom: 24,
            }}
          >
            {[
              { label: "Chưa nắm", value: unresolvedCount, color: unresolvedCount > 0 ? "var(--error)" : "var(--text-muted)", icon: "✗", bg: "rgba(239, 68, 68, 0.05)", border: "rgba(239, 68, 68, 0.15)" },
              { label: "Đã hiểu", value: resolvedCount, color: "var(--success)", icon: "✓", bg: "rgba(16, 185, 129, 0.05)", border: "rgba(16, 185, 129, 0.15)" },
              { label: "Tổng cộng", value: total, color: "var(--accent)", icon: "#", bg: "var(--accent-light)", border: "color-mix(in srgb, var(--accent) 15%, transparent)" },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "16px 22px",
                  background: "var(--surface)",
                  borderRadius: "var(--radius-xl)",
                  border: `1.5px solid ${s.border}`,
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    color: s.color,
                    background: s.bg,
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    fontFamily: "monospace",
                  }}
                >
                  {s.icon}
                </span>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: s.color, lineHeight: 1.1, fontFamily: "var(--font-display)" }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, marginTop: 2 }}>
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

          {/* ── AI Personalized Drill ── */}
          {!loading && errors.length >= 2 && (
            <div className="anim-fade-up anim-delay-3" style={{ marginBottom: 20 }}>
              <PersonalizedDrill />
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
              display: "flex", gap: 10, flexWrap: "wrap",
              alignItems: "center", marginBottom: 20,
              background: "var(--surface)",
              padding: "12px 16px",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <FilterOutlined style={{ color: "var(--text-muted)", fontSize: 14, flexShrink: 0 }} />

            {/* Status pills */}
            <div style={{ display: "flex", gap: 4 }}>
              {FILTER_RESOLVED_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilterResolved(opt.value)}
                  style={{
                    padding: "5px 14px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                    border: "1.5px solid",
                    cursor: "pointer", transition: "all 0.15s",
                    borderColor: filterResolved === opt.value ? "var(--accent)" : "var(--border)",
                    background: filterResolved === opt.value ? "var(--accent)" : "transparent",
                    color: filterResolved === opt.value ? "var(--text-on-accent)" : "var(--text-secondary)",
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
                    padding: "5px 14px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                    border: "1.5px solid",
                    cursor: "pointer", transition: "all 0.15s",
                    borderColor: filterModule === opt.value ? "var(--accent)" : "var(--border)",
                    background: filterModule === opt.value ? "var(--accent-light)" : "transparent",
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
                  padding: "6px 14px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                  border: "1.5px solid var(--border)",
                  background: filterTopic ? "var(--accent-light)" : "var(--surface)",
                  color: filterTopic ? "var(--accent)" : "var(--text-secondary)",
                  cursor: "pointer", outline: "none",
                }}
              >
                <option value="">Chủ đề lỗi sai</option>
                {topics.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            )}

            <span style={{
              marginLeft: "auto", fontSize: 12, fontWeight: 800,
              color: "var(--text-muted)", fontVariantNumeric: "tabular-nums",
            }}>
              {total} kết quả
            </span>
          </div>

          {/* ── Resolve all ── */}
          {unresolvedCount > 1 && (
            <div className="anim-fade-up" style={{ marginBottom: 16, display: "flex", justifySelf: "stretch", justifyContent: "flex-end" }}>
              <button
                onClick={resolveAll}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "8px 18px", borderRadius: 99,
                  border: "1.5px solid color-mix(in srgb, var(--success) 35%, transparent)",
                  background: "var(--success-bg)",
                  color: "var(--success)", cursor: "pointer",
                  fontSize: 13, fontWeight: 700, transition: "all 0.15s",
                  boxShadow: "var(--shadow-sm)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--success)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--success-bg)"; e.currentTarget.style.color = "var(--success)"; }}
              >
                <CheckCircleOutlined style={{ fontSize: 13 }} />
                Đánh dấu tất cả đã hiểu
              </button>
            </div>
          )}

          {/* ── Table & Loader & Empty states ── */}
          <div
            className="anim-fade-up anim-delay-4"
            style={{
              background: "var(--surface)",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
              overflow: "hidden",
              marginBottom: 32,
            }}
          >
            {/* Section label */}
            <div style={{ display: "flex", alignItems: "center", justifySelf: "stretch", gap: 10, padding: "16px 20px", background: "var(--surface-alt)", borderBottom: "1px solid var(--border)" }}>
              <div style={{ width: 3, height: 14, borderRadius: 2, background: "var(--accent)", flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)" }}>
                Danh sách lỗi sai
              </span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>
                💡 Click để mở rộng chi tiết & luyện tập lại
              </span>
            </div>

            {loading ? (
              <div style={{ padding: "24px 20px" }}>
                <Skeleton active paragraph={{ rows: 6 }} round />
              </div>
            ) : errors.length === 0 ? (
              <div style={{ padding: "72px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 44, marginBottom: 16 }}>
                  {filterResolved === "false" ? "🎉" : "📭"}
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-display)", marginBottom: 6 }}>
                  {filterResolved === "false" ? "Tuyệt vời! Không còn lỗi sai nào chưa nắm!" : "Không tìm thấy kết quả"}
                </div>
                <div style={{ fontSize: 13.5, color: "var(--text-muted)", fontWeight: 500 }}>
                  {filterResolved === "false"
                    ? "Hãy tiếp tục phát huy và làm thêm nhiều bài học mới nhé!"
                    : "Hãy thử thay đổi tiêu chí bộ lọc phía trên."}
                </div>
              </div>
            ) : (
              <Table
                dataSource={errors}
                columns={columns}
                rowKey="id"
                pagination={false}
                className="custom-antd-table"
                expandable={{
                  expandIcon: ({ expanded, onExpand, record }) =>
                    expanded ? (
                      <MinusOutlined style={{ cursor: "pointer", color: "var(--accent)" }} onClick={(e) => onExpand(record, e)} />
                    ) : (
                      <PlusOutlined style={{ cursor: "pointer", color: "var(--text-muted)" }} onClick={(e) => onExpand(record, e)} />
                    ),
                  expandedRowRender: (record: ErrorEntry) => (
                    <div
                      style={{
                        padding: "20px 24px",
                        background: "var(--surface-alt)",
                        borderRadius: "var(--radius-lg)",
                        border: "1px solid var(--border)",
                        boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.02)",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                          gap: 20,
                        }}
                      >
                        {/* Left column: Deep AI Explanation */}
                        <div>
                          <DeepExplanation
                            errorId={record.id}
                            cached={record.deepExplanation}
                            fallbackEn={record.explanationEn}
                            fallbackVi={record.explanationVi}
                          />
                        </div>

                        {/* Right column: Practice drill */}
                        <div>
                          <InlinePractice
                            errorId={record.id}
                            onResolved={() => resolveError(record.id)}
                          />
                        </div>
                      </div>
                    </div>
                  ),
                }}
              />
            )}
          </div>

          {/* ── Refresh ── */}
          {!loading && (
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <button
                onClick={fetchErrors}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "8px 22px", borderRadius: 99,
                  border: "1.5px solid var(--border)",
                  background: "var(--surface)", color: "var(--text-secondary)",
                  cursor: "pointer", fontSize: 13, fontWeight: 700,
                  transition: "all 0.15s",
                  boxShadow: "var(--shadow-sm)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
              >
                <ReloadOutlined style={{ fontSize: 12 }} />
                Tải lại danh sách
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .custom-antd-table .ant-table {
          background: transparent !important;
          color: var(--text-primary) !important;
        }
        .custom-antd-table .ant-table-thead > tr > th {
          background: var(--surface-alt) !important;
          color: var(--text-secondary) !important;
          border-bottom: 1px solid var(--border) !important;
          font-weight: 800 !important;
          font-size: 12.5px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          padding: 14px 16px !important;
        }
        .custom-antd-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid var(--border) !important;
          color: var(--text-primary) !important;
          font-size: 13.5px !important;
          padding: 14px 16px !important;
          font-weight: 500 !important;
        }
        .custom-antd-table .ant-table-tbody > tr:hover > td {
          background: var(--surface-alt) !important;
        }
        .custom-antd-table .ant-table-expanded-row > td {
          background: var(--surface) !important;
          padding: 16px 20px !important;
        }
      `}</style>
    </div>
  );
}
