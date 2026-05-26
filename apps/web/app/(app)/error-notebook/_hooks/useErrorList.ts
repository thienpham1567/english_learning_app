"use client";

import { useCallback, useRef, useState } from "react";
import { api } from "@/lib/api-client";
import type { ErrorEntry, ErrorFilters } from "../_types/types";
import { INITIAL_FILTERS } from "../_types/types";

const PAGE_SIZE = 30;

interface UseErrorListReturn {
  errors: ErrorEntry[];
  total: number;
  topics: string[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  filters: ErrorFilters;
  setFilter: <K extends keyof ErrorFilters>(key: K, value: ErrorFilters[K]) => void;
  resetFilters: () => void;
  fetchErrors: () => Promise<void>;
  fetchMore: () => Promise<void>;
  resolveOne: (id: string) => Promise<void>;
  resolveAll: () => Promise<void>;
  unresolvedCount: number;
  resolvedCount: number;
}

export function useErrorList(): UseErrorListReturn {
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState<ErrorFilters>(INITIAL_FILTERS);
  const offsetRef = useRef(0);

  const buildParams = useCallback(
    (offset = 0) => {
      const params = new URLSearchParams();
      if (filters.module) params.set("module", filters.module);
      if (filters.topic) params.set("topic", filters.topic);
      if (filters.resolved) params.set("resolved", filters.resolved);
      if (filters.search) params.set("search", filters.search);
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(offset));
      return params;
    },
    [filters],
  );

  const fetchErrors = useCallback(async () => {
    setLoading(true);
    offsetRef.current = 0;
    try {
      const params = buildParams(0);
      const data = await api.get<{ errors: ErrorEntry[]; total: number; topics: string[] }>(
        `/errors?${params}`,
      );
      if (data) {
        setErrors(data.errors);
        setTotal(data.total);
        setTopics(data.topics);
        offsetRef.current = data.errors.length;
      }
    } catch {
      console.error("Không thể tải danh sách lỗi sai");
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  const fetchMore = useCallback(async () => {
    if (loadingMore || offsetRef.current >= total) return;
    setLoadingMore(true);
    try {
      const params = buildParams(offsetRef.current);
      const data = await api.get<{ errors: ErrorEntry[]; total: number; topics: string[] }>(
        `/errors?${params}`,
      );
      if (data?.errors.length) {
        setErrors((prev) => [...prev, ...data.errors]);
        offsetRef.current += data.errors.length;
      }
    } catch {
      // Silent — pagination failure is not critical
    } finally {
      setLoadingMore(false);
    }
  }, [buildParams, loadingMore, total]);

  const setFilter = useCallback(<K extends keyof ErrorFilters>(key: K, value: ErrorFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  const resolveOne = useCallback(async (id: string) => {
    try {
      await api.patch("/errors", { ids: [id] });
      setErrors((prev) => prev.map((e) => (e.id === id ? { ...e, isResolved: true } : e)));
    } catch {
      console.error("Không thể cập nhật");
    }
  }, []);

  const resolveAll = useCallback(async () => {
    const ids = errors.filter((e) => !e.isResolved).map((e) => e.id);
    if (ids.length === 0) return;
    try {
      await api.patch("/errors", { ids });
      setErrors((prev) => prev.map((e) => ({ ...e, isResolved: true })));
    } catch {
      console.error("Không thể cập nhật");
    }
  }, [errors]);

  const unresolvedCount = errors.filter((e) => !e.isResolved).length;
  const resolvedCount = errors.filter((e) => e.isResolved).length;
  const hasMore = offsetRef.current < total;

  return {
    errors,
    total,
    topics,
    loading,
    loadingMore,
    hasMore,
    filters,
    setFilter,
    resetFilters,
    fetchErrors,
    fetchMore,
    resolveOne,
    resolveAll,
    unresolvedCount,
    resolvedCount,
  };
}
