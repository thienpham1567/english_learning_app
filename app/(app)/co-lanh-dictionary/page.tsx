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

const WORD_PATTERN = /^[A-Za-z][A-Za-z'-]{0,47}$/;

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
      messageApi.error("Vui long nhap mot tu tieng Anh truoc khi tra cuu.");
      return;
    }

    if (!WORD_PATTERN.test(normalizedWord)) {
      messageApi.error("Chi chap nhan mot tu tieng Anh don le, khong chua khoang trang.");
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
          payload && "error" in payload ? payload.error : "Khong the tra cuu tu nay luc nay.";
        messageApi.error(errorMessage);
        return;
      }

      setResult(payload.data);
    } catch {
      if (requestId !== latestRequestIdRef.current) {
        return;
      }

      messageApi.error("Da xay ra loi mang. Vui long thu lai sau.");
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
            <p className="dictionary-hero__eyebrow">Tu dien Co Lanh</p>
            <h1>Tra cuu tu vung theo cach ro rang, gon va de hoc lai</h1>
            <p className="dictionary-hero__description">
              Mot khong gian tra cuu co cau truc de ban xem ngay nghia tieng
              Viet, phien am, cap do va ghi chu ngu phap cho tung tu.
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
