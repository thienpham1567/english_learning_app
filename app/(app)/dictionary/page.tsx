"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { message } from "antd";

import axios from "axios";
import http from "@/lib/http";
import { normalizeDictionaryQuery } from "@/lib/dictionary/normalize-query";
import { DictionaryResultCard } from "@/components/dictionary/DictionaryResultCard";
import { DictionarySearchPanel } from "@/components/dictionary/DictionarySearchPanel";
import { ThesaurusSheet } from "@/components/dictionary/ThesaurusSheet";
import { RecentLookups, getRecentLookups, pushRecentLookup } from "@/components/dictionary/RecentLookups";
import type { VocabularyWithNearby } from "@/lib/schemas/vocabulary";

const QUERY_PATTERN = /^[A-Za-z][A-Za-z\s'-]{0,79}$/;

export default function DictionaryPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const [q, setQ] = useQueryState("q", parseAsString.withDefault(""));
  const [result, setResult] = useState<VocabularyWithNearby | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [saved, setSaved] = useState<boolean | null>(null);
  const [currentQuery, setCurrentQuery] = useState<string | null>(null);
  const [isThesaurusOpen, setIsThesaurusOpen] = useState(false);
  const [recentWords, setRecentWords] = useState<string[]>([]);
  const latestRequestIdRef = useRef(0);
  const initialSearchDone = useRef(false);

  // Load recent lookups on mount
  useEffect(() => {
    setRecentWords(getRecentLookups());
  }, []);

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
      const { data: payload } = await http.post<{
        data: VocabularyWithNearby;
        saved: boolean;
      }>("/dictionary", { word: normalized });

      if (requestId !== latestRequestIdRef.current) return;

      setResult(payload.data);
      setSaved(payload.saved);
      setCurrentQuery(cacheKey);
      // Push to recent lookups (AC #1, #4)
      pushRecentLookup(payload.data.headword);
      setRecentWords(getRecentLookups());
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
      await http.patch(`/vocabulary/${encodeURIComponent(currentQuery)}/saved`, { saved: next });
    } catch {
      setSaved(!next); // rollback
    }
  };

  return (
    <>
      {contextHolder}
      <div style={{ height: "100%", minHeight: 0 }}>
        <div
          style={{
            display: "grid",
            alignItems: "start",
            gap: 24,
            gridTemplateColumns: "minmax(280px,360px) minmax(0,1fr)",
          }}
        >
          <div>
            <RecentLookups words={recentWords} onSelect={handleSubmit} />
            <DictionarySearchPanel initialValue={q} onSubmit={handleSubmit} isLoading={isLoading} />
          </div>
          <div>
            <DictionaryResultCard
              vocabulary={result}
              hasSearched={hasSearched}
              isLoading={isLoading}
              saved={saved}
              onToggleSaved={handleToggleSaved}
              onOpenThesaurus={() => setIsThesaurusOpen(true)}
              onSearch={handleSubmit}
            />
          </div>
        </div>
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
