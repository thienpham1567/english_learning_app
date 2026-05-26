"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { ListeningHistoryItem } from "@/lib/listening/types";

interface UseListeningHistoryOptions {
  autoFetch?: boolean;
}

interface HistoryState {
  items: ListeningHistoryItem[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
  // Filters
  mode: string | null;
  level: string | null;
  bookmarkedOnly: boolean;
}

export function useListeningHistory(options: UseListeningHistoryOptions = {}) {
  const { autoFetch = false } = options;

  const [state, setState] = useState<HistoryState>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    isLoading: false,
    error: null,
    mode: null,
    level: null,
    bookmarkedOnly: false,
  });

  const fetchHistory = useCallback(
    async (
      overrides?: Partial<Pick<HistoryState, "page" | "mode" | "level" | "bookmarkedOnly">>,
    ) => {
      const page = overrides?.page ?? state.page;
      const mode = overrides?.mode !== undefined ? overrides.mode : state.mode;
      const level = overrides?.level !== undefined ? overrides.level : state.level;
      const bookmarkedOnly = overrides?.bookmarkedOnly ?? state.bookmarkedOnly;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("pageSize", String(state.pageSize));
        if (mode) params.set("mode", mode);
        if (level) params.set("level", level);
        if (bookmarkedOnly) params.set("bookmarked", "true");

        const data = await api.get<{
          items: ListeningHistoryItem[];
          total: number;
          page: number;
          pageSize: number;
        }>(`/listening/history?${params.toString()}`);

        setState((prev) => ({
          ...prev,
          items: data.items,
          total: data.total,
          page: data.page,
          pageSize: data.pageSize,
          isLoading: false,
          mode,
          level,
          bookmarkedOnly,
        }));
      } catch {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Không thể tải lịch sử",
        }));
      }
    },
    [state.page, state.mode, state.level, state.bookmarkedOnly, state.pageSize],
  );

  const setMode = useCallback(
    (mode: string | null) => fetchHistory({ mode, page: 1 }),
    [fetchHistory],
  );

  const setLevel = useCallback(
    (level: string | null) => fetchHistory({ level, page: 1 }),
    [fetchHistory],
  );

  const setBookmarkedOnly = useCallback(
    (bookmarkedOnly: boolean) => fetchHistory({ bookmarkedOnly, page: 1 }),
    [fetchHistory],
  );

  const goToPage = useCallback((page: number) => fetchHistory({ page }), [fetchHistory]);

  const toggleBookmark = useCallback(async (exerciseId: string, bookmarked: boolean) => {
    try {
      await api.post("/listening/bookmark", { exerciseId, bookmarked });
      setState((prev) => ({
        ...prev,
        items: prev.items.map((item) => (item.id === exerciseId ? { ...item, bookmarked } : item)),
      }));
    } catch {
      // silent fail
    }
  }, []);

  // Auto-fetch on mount if requested
  useEffect(() => {
    if (autoFetch) fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch]);

  return {
    ...state,
    fetchHistory,
    setMode,
    setLevel,
    setBookmarkedOnly,
    goToPage,
    toggleBookmark,
    hasHistory: state.total > 0 || state.items.length > 0,
  };
}
