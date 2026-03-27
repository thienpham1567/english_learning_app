"use client";

import { useRef, useState } from "react";
import { message } from "antd";

import { DictionaryResultCard } from "@/components/dictionary/DictionaryResultCard";
import { DictionarySearchPanel } from "@/components/dictionary/DictionarySearchPanel";
import type { Vocabulary } from "@/lib/schemas/vocabulary";

type DictionaryResponse =
  | {
      data: Vocabulary;
    }
  | {
      error: string;
    };

const QUERY_PATTERN = /^[A-Za-z][A-Za-z\s'-]{0,79}$/;

export default function CoLanhDictionaryPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Vocabulary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const latestRequestIdRef = useRef(0);

  const handleSearch = async () => {
    const normalizedWord = query.trim();

    if (!normalizedWord) {
      messageApi.error("Vui lòng nhập từ hoặc cụm từ tiếng Anh trước khi tra cứu.");
      return;
    }

    if (!QUERY_PATTERN.test(normalizedWord)) {
      messageApi.error("Chỉ hỗ trợ từ hoặc cụm từ tiếng Anh hợp lệ.");
      return;
    }

    setHasSearched(true);
    setIsLoading(true);
    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;

    try {
      const response = await fetch("/api/dictionary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ word: normalizedWord }),
      });

      const payload = (await response.json().catch(() => null)) as DictionaryResponse | null;

      if (requestId !== latestRequestIdRef.current) {
        return;
      }

      if (!response.ok || !payload || !("data" in payload)) {
        const errorMessage =
          payload && "error" in payload ? payload.error : "Không thể tra cứu từ này lúc này.";
        messageApi.error(errorMessage);
        return;
      }

      setResult(payload.data);
    } catch {
      if (requestId !== latestRequestIdRef.current) {
        return;
      }

      messageApi.error("Đã xảy ra lỗi mạng. Vui lòng thử lại sau.");
    } finally {
      if (requestId === latestRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      {contextHolder}
      <div className="dictionary-page">
        <section className="dictionary-hero">
          <div className="dictionary-hero__content">
            <p className="dictionary-hero__eyebrow">Từ điển cô Lành</p>
            <h1>Tra cứu từ vựng và cụm từ theo cách rõ ràng, dễ học lại</h1>
            <p className="dictionary-hero__description">
              Xem giải thích song ngữ, ví dụ tiếng Việt và ghi chú dùng cho từng nghĩa trong cùng một khung học tập.
            </p>
          </div>
        </section>

        <section className="dictionary-layout">
          <DictionarySearchPanel
            value={query}
            onChange={setQuery}
            onSearch={handleSearch}
            isLoading={isLoading}
          />
          <DictionaryResultCard
            vocabulary={result}
            hasSearched={hasSearched}
            isLoading={isLoading}
          />
        </section>
      </div>
    </>
  );
}
