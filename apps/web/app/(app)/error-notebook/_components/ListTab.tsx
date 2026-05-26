"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Filter,
  CheckCircle,
  Loader2,
} from "lucide-react";
import * as m from "motion/react-client";
import { useErrorList } from "../_hooks/useErrorList";
import {
  FILTER_RESOLVED_OPTIONS,
  MODULE_FILTER_OPTIONS,
} from "../_types/types";
import type { ErrorEntry } from "../_types/types";
import { ErrorCard } from "./ErrorCard";
import { ErrorDetailPanel } from "./ErrorDetailPanel";

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
      <div className="flex flex-col gap-4">
        {/* Search + Filters */}
        <div className="bg-surface rounded-xl border-2 border-border p-3.5 flex flex-col gap-3">
          {/* Search bar */}
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-surface-alt border-2 border-border">
            <Search className="h-3.5 w-3.5 text-text-muted shrink-0" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm kiếm câu hỏi..."
              className="flex-1 border-none bg-transparent text-sm text-text-primary outline-none font-body placeholder:text-text-muted"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="border-none bg-transparent text-text-muted cursor-pointer text-xs hover:text-ink"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-3 w-3 text-text-muted shrink-0" />

            {/* Status filters */}
            <div className="flex gap-1">
              {FILTER_RESOLVED_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => list.setFilter("resolved", opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border-[1.5px] cursor-pointer transition-all duration-150 ${
                    list.filters.resolved === opt.value
                      ? "border-accent bg-accent text-(--text-on-accent)"
                      : "border-border bg-transparent text-text-secondary hover:border-accent/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Module filters */}
            <div className="flex gap-1 flex-wrap">
              {MODULE_FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => list.setFilter("module", opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border-[1.5px] cursor-pointer transition-all duration-150 ${
                    list.filters.module === opt.value
                      ? "border-accent bg-accent-light text-accent"
                      : "border-border bg-transparent text-text-secondary hover:border-accent/40"
                  }`}
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
                className={`px-3 py-1.5 rounded-full text-xs font-bold border-[1.5px] border-border cursor-pointer outline-none ${
                  list.filters.topic
                    ? "bg-accent-light text-accent"
                    : "bg-surface text-text-secondary"
                }`}
              >
                <option value="">Chủ đề</option>
                {list.topics.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            )}

            <span className="ml-auto text-xs font-extrabold text-text-muted tabular-nums">
              {list.total} kết quả
            </span>
          </div>
        </div>

        {/* Batch resolve */}
        {list.unresolvedCount > 1 && (
          <div className="flex justify-end">
            <m.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={list.resolveAll}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border-[1.5px] border-emerald-500/35 bg-(--success-bg) text-(--success) text-xs font-bold cursor-pointer font-body"
            >
              <CheckCircle className="h-3.5 w-3.5" /> Đánh dấu tất cả đã hiểu
            </m.button>
          </div>
        )}

        {/* Error Cards */}
        {list.loading ? (
          <div className="py-10 text-center">
            <Loader2 className="h-6 w-6 text-accent animate-mx-auto mb-2" />
            <div className="text-[13px] text-text-muted">Đang tải...</div>
          </div>
        ) : list.errors.length === 0 ? (
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-16 px-6 text-center bg-surface rounded-xl border-2 border-border"
          >
            <div className="text-[44px] mb-3">
              {list.filters.resolved === "false" ? "🎉" : "📭"}
            </div>
            <span className="text-base font-extrabold text-text-primary block mb-1.5">
              {list.filters.resolved === "false" ? "Không còn lỗi sai chưa nắm!" : "Không tìm thấy kết quả"}
            </span>
            <span className="text-[13px] text-text-muted">
              {list.filters.resolved === "false"
                ? "Hãy tiếp tục phát huy nhé! 💪"
                : "Hãy thử thay đổi bộ lọc."}
            </span>
          </m.div>
        ) : (
          <div className="flex flex-col gap-2.5">
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
                className="p-3 rounded-xl border-2 border-border bg-surface text-text-secondary text-[13px] font-bold cursor-pointer font-body text-center disabled:opacity-50"
              >
                {list.loadingMore ? <><Loader2 className="h-4 w-4 animate-inline mr-1.5" /> Đang tải...</> : "Tải thêm"}
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
