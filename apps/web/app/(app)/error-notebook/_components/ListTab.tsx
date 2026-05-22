"use client";

import { useEffect, useState, useCallback } from "react";
import { Typography } from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import * as m from "motion/react-client";
import { useErrorList } from "../_hooks/useErrorList";
import {
  FILTER_RESOLVED_OPTIONS,
  MODULE_FILTER_OPTIONS,
} from "../_types/types";
import type { ErrorEntry } from "../_types/types";
import { ErrorCard } from "./ErrorCard";
import { ErrorDetailPanel } from "./ErrorDetailPanel";

const { Text } = Typography;

export function ListTab() {
  const list = useErrorList();
  const [selectedError, setSelectedError] = useState<ErrorEntry | null>(null);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    list.fetchErrors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.filters.module, list.filters.topic, list.filters.resolved]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== list.filters.search) {
        list.setFilter("search", searchInput);
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // Refetch when search changes
  useEffect(() => {
    if (list.filters.search !== undefined) {
      list.fetchErrors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.filters.search]);

  const handleResolve = useCallback(async (id: string) => {
    await list.resolveOne(id);
    // Update selected error if it was resolved
    setSelectedError((prev) => (prev?.id === id ? { ...prev, isResolved: true } : prev));
  }, [list]);

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Search + Filters */}
        <div style={{
          background: "var(--surface)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border)",
          padding: "14px 16px",
          display: "flex", flexDirection: "column", gap: 12,
        }}>
          {/* Search bar */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 14px", borderRadius: 12,
            background: "var(--surface-alt)", border: "1px solid var(--border)",
          }}>
            <SearchOutlined style={{ color: "var(--text-muted)", fontSize: 14 }} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm kiếm câu hỏi..."
              style={{
                flex: 1, border: "none", background: "transparent",
                fontSize: 14, color: "var(--text-primary)", outline: "none",
                fontFamily: "var(--font-body)",
              }}
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                style={{
                  border: "none", background: "transparent",
                  color: "var(--text-muted)", cursor: "pointer", fontSize: 12,
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter chips */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <FilterOutlined style={{ color: "var(--text-muted)", fontSize: 12, flexShrink: 0 }} />

            {/* Status filters */}
            <div style={{ display: "flex", gap: 4 }}>
              {FILTER_RESOLVED_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => list.setFilter("resolved", opt.value)}
                  style={{
                    padding: "5px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                    border: "1.5px solid",
                    cursor: "pointer", transition: "all 0.15s",
                    borderColor: list.filters.resolved === opt.value ? "var(--accent)" : "var(--border)",
                    background: list.filters.resolved === opt.value ? "var(--accent)" : "transparent",
                    color: list.filters.resolved === opt.value ? "var(--text-on-accent)" : "var(--text-secondary)",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Module filters */}
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {MODULE_FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => list.setFilter("module", opt.value)}
                  style={{
                    padding: "5px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                    border: "1.5px solid",
                    cursor: "pointer", transition: "all 0.15s",
                    borderColor: list.filters.module === opt.value ? "var(--accent)" : "var(--border)",
                    background: list.filters.module === opt.value ? "var(--accent-light)" : "transparent",
                    color: list.filters.module === opt.value ? "var(--accent)" : "var(--text-secondary)",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Topic filter */}
            {list.topics.length > 0 && (
              <select
                value={list.filters.topic}
                onChange={(e) => list.setFilter("topic", e.target.value)}
                style={{
                  padding: "5px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                  border: "1.5px solid var(--border)",
                  background: list.filters.topic ? "var(--accent-light)" : "var(--surface)",
                  color: list.filters.topic ? "var(--accent)" : "var(--text-secondary)",
                  cursor: "pointer", outline: "none",
                }}
              >
                <option value="">Chủ đề</option>
                {list.topics.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            )}

            <span style={{
              marginLeft: "auto", fontSize: 12, fontWeight: 800,
              color: "var(--text-muted)", fontVariantNumeric: "tabular-nums",
            }}>
              {list.total} kết quả
            </span>
          </div>
        </div>

        {/* Batch resolve */}
        {list.unresolvedCount > 1 && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <m.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={list.resolveAll}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 99,
                border: "1.5px solid color-mix(in srgb, var(--success) 35%, transparent)",
                background: "var(--success-bg)", color: "var(--success)",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                fontFamily: "var(--font-body)",
              }}
            >
              <CheckCircleOutlined /> Đánh dấu tất cả đã hiểu
            </m.button>
          </div>
        )}

        {/* Error Cards */}
        {list.loading ? (
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <LoadingOutlined spin style={{ fontSize: 24, color: "var(--accent)", marginBottom: 8 }} />
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Đang tải...</div>
          </div>
        ) : list.errors.length === 0 ? (
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: "60px 24px", textAlign: "center",
              background: "var(--surface)",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ fontSize: 44, marginBottom: 12 }}>
              {list.filters.resolved === "false" ? "🎉" : "📭"}
            </div>
            <Text style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", display: "block", marginBottom: 6 }}>
              {list.filters.resolved === "false" ? "Không còn lỗi sai chưa nắm!" : "Không tìm thấy kết quả"}
            </Text>
            <Text style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {list.filters.resolved === "false"
                ? "Hãy tiếp tục phát huy nhé! 💪"
                : "Hãy thử thay đổi bộ lọc."}
            </Text>
          </m.div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {list.errors.map((error, i) => (
              <ErrorCard
                key={error.id}
                error={error}
                index={i}
                onClick={() => setSelectedError(error)}
              />
            ))}

            {/* Load more */}
            {list.hasMore && (
              <m.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={list.fetchMore}
                disabled={list.loadingMore}
                style={{
                  padding: "12px", borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--surface)", color: "var(--text-secondary)",
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  textAlign: "center",
                }}
              >
                {list.loadingMore ? <><LoadingOutlined /> Đang tải...</> : "Tải thêm"}
              </m.button>
            )}
          </div>
        )}
      </div>

      {/* Detail Panel */}
      <ErrorDetailPanel
        error={selectedError}
        onClose={() => setSelectedError(null)}
        onResolve={handleResolve}
      />
    </>
  );
}
