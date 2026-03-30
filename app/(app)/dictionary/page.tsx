"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { message } from "antd";
import { motion } from "motion/react";

import axios from "axios";
import http from "@/lib/http";
import { normalizeDictionaryQuery } from "@/lib/dictionary/normalize-query";
import { DictionaryResultCard } from "@/components/dictionary/DictionaryResultCard";
import { DictionarySearchPanel } from "@/components/dictionary/DictionarySearchPanel";
import { ThesaurusSheet } from "@/components/dictionary/ThesaurusSheet";
import type { Vocabulary } from "@/lib/schemas/vocabulary";

const QUERY_PATTERN = /^[A-Za-z][A-Za-z\s'-]{0,79}$/;

export default function DictionaryPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const [q, setQ] = useQueryState("q", parseAsString.withDefault(""));
  const [result, setResult] = useState<Vocabulary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [saved, setSaved] = useState<boolean | null>(null);
  const [currentQuery, setCurrentQuery] = useState<string | null>(null);
  const [isThesaurusOpen, setIsThesaurusOpen] = useState(false);
  const latestRequestIdRef = useRef(0);
  const initialSearchDone = useRef(false);

  // Auto-search on mount when URL has ?q= (bookmark/link support)
  useEffect(() => {
    if (q && !initialSearchDone.current) {
      initialSearchDone.current = true;
      searchFor(q);
    }
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const searchFor = async (word: string) => {
    const { normalized, cacheKey } = normalizeDictionaryQuery(word);

    if (!normalized) {
      messageApi.error("Vui lòng nhập từ hoặc cụm từ tiếng Anh trước khi tra cứu.");
      return;
    }

    if (!QUERY_PATTERN.test(normalized)) {
      messageApi.error("Chỉ hỗ trợ từ hoặc cụm từ tiếng Anh hợp lệ.");
      return;
    }

    setIsThesaurusOpen(false);
    setHasSearched(true);
    setIsLoading(true);
    setSaved(null);
    setCurrentQuery(null);
    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;

    try {
      const { data: payload } = await http.post<{ data: Vocabulary; saved: boolean }>(
        "/dictionary",
        { word: normalized },
      );

      if (requestId !== latestRequestIdRef.current) return;

      setResult(payload.data);
      setSaved(payload.saved);
      setCurrentQuery(cacheKey);
    } catch (error) {
      if (requestId !== latestRequestIdRef.current) return;

      if (axios.isAxiosError(error) && error.response?.data?.error) {
        messageApi.error(error.response.data.error);
      } else {
        messageApi.error("Đã xảy ra lỗi mạng. Vui lòng thử lại sau.");
      }
    } finally {
      if (requestId === latestRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleSubmit = (word: string) => {
    setQ(word || null);
    searchFor(word);
  };

  const handleSynonymClick = (word: string) => {
    setQ(word);
    searchFor(word);
  };

  const handleToggleSaved = async () => {
    if (currentQuery === null || saved === null) return;
    const next = !saved;
    setSaved(next); // optimistic
    try {
      await fetch(`/api/vocabulary/${encodeURIComponent(currentQuery)}/saved`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saved: next }),
      });
    } catch {
      setSaved(!next); // rollback
    }
  };

  return (
    <>
      {contextHolder}
      <div className="h-full min-h-0">
        <motion.section
          className="relative mb-7 overflow-hidden rounded-2xl border border-(--border) bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(253,243,235,0.9))] p-5 shadow-(--shadow-md) md:p-6 max-[720px]:rounded-xl max-[720px]:px-4 max-[720px]:py-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <div className="relative max-w-3xl">
            <h1 className="mt-3 text-4xl [font-family:var(--font-display)] text-(--ink)">
              Tra cứu từ vựng theo cách rõ ràng, dễ học lại
            </h1>
            <p className="mt-4 text-base text-(--text-secondary)">
              Xem giải thích song ngữ, ví dụ tiếng Việt và ghi chú dùng cho từng nghĩa trong cùng một khung học tập.
            </p>
          </div>
        </motion.section>

        <section className="grid items-start gap-6 min-[1121px]:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.4, ease: "easeOut" }}
          >
            <DictionarySearchPanel
              initialValue={q}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: 0.4, ease: "easeOut" }}
          >
            <DictionaryResultCard
              vocabulary={result}
              hasSearched={hasSearched}
              isLoading={isLoading}
              saved={saved}
              onToggleSaved={handleToggleSaved}
              onOpenThesaurus={() => setIsThesaurusOpen(true)}
            />
          </motion.div>
        </section>
      </div>
      <ThesaurusSheet
        vocabulary={result}
        isOpen={isThesaurusOpen}
        onClose={() => setIsThesaurusOpen(false)}
        onWordClick={(word) => {
          setIsThesaurusOpen(false);
          handleSynonymClick(word);
        }}
      />
    </>
  );
}
