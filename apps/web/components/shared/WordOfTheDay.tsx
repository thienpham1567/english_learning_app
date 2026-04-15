"use client";
import { api } from "@/lib/api-client";
import { useCallback, useEffect, useState } from "react";
import { Tag, message } from "antd";
import {
  SoundOutlined,
  BookOutlined,
  CheckCircleFilled,
  LoadingOutlined,
} from "@ant-design/icons";

type WordData = {
  query: string;
  headword: string;
  overviewVi: string;
  overviewEn: string;
  partOfSpeech: string | null;
  level: string | null;
  pronunciation: string | null;
  example: string | null;
  saved: boolean;
};

/**
 * WordOfTheDay card for the Home page (Story 14.3).
 * Fetches from /api/word-of-the-day, shows word details + quick-save.
 */
export function WordOfTheDay() {
  const [word, setWord] = useState<WordData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    api.get<{ word?: WordData }>("/word-of-the-day")
      .then((data) => {
        if (data?.word) {
          setWord(data.word);
          setIsSaved(data.word.saved);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const playAudio = useCallback(() => {
    if (!word) return;
    const utterance = new SpeechSynthesisUtterance(word.headword);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    speechSynthesis.speak(utterance);
  }, [word]);

  const saveWord = useCallback(async () => {
    if (!word || isSaved) return;
    setSaving(true);
    try {
      await api.post("/vocabulary/save", { query: word.query });
      setIsSaved(true);
      message.success("Đã lưu vào từ vựng!");
    } catch {
      message.error("Không thể lưu từ");
    }
    setSaving(false);
  }, [word, isSaved]);

  if (loading) {
    return (
      <div style={{
        padding: "24px",
        borderRadius: "var(--radius-lg, 16px)",
        border: "1px solid var(--border)",
        background: "var(--card-bg, var(--surface))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 120,
      }}>
        <LoadingOutlined style={{ fontSize: 20, color: "var(--accent)" }} />
      </div>
    );
  }

  if (!word) return null;

  return (
    <div
      style={{
        padding: "24px",
        borderRadius: "var(--radius-lg, 16px)",
        border: "1px solid var(--border)",
        background: "linear-gradient(135deg, var(--card-bg, var(--surface)), var(--surface))",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative gradient accent */}
      <div style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: 120,
        height: 120,
        background: "radial-gradient(circle at top right, var(--accent-muted, rgba(99,102,241,0.1)), transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>✨</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Từ vựng hôm nay</span>
        </div>
        {word.level && (
          <Tag color="blue" style={{ fontSize: 11, borderRadius: 99 }}>{word.level}</Tag>
        )}
      </div>

      {/* Word */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em" }}>
          {word.headword}
        </span>
        <button
          onClick={playAudio}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            color: "var(--accent)",
            fontSize: 18,
          }}
          aria-label="Phát âm"
        >
          <SoundOutlined />
        </button>
      </div>

      {/* Pronunciation + Part of Speech */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {word.pronunciation && (
          <span style={{ fontSize: 13, color: "var(--text-secondary)", fontStyle: "italic" }}>
            /{word.pronunciation}/
          </span>
        )}
        {word.partOfSpeech && (
          <Tag color="default" style={{ fontSize: 10, borderRadius: 99 }}>{word.partOfSpeech}</Tag>
        )}
      </div>

      {/* Vietnamese meaning */}
      <p style={{ fontSize: 15, fontWeight: 500, color: "var(--text)", margin: "0 0 8px", lineHeight: 1.5 }}>
        {word.overviewVi}
      </p>

      {/* English meaning */}
      {word.overviewEn && (
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 12px", lineHeight: 1.5 }}>
          {word.overviewEn}
        </p>
      )}

      {/* Example */}
      {word.example && (
        <div style={{
          padding: "10px 14px",
          borderRadius: 8,
          background: "var(--accent-muted, rgba(99,102,241,0.08))",
          fontSize: 13,
          fontStyle: "italic",
          color: "var(--text-secondary)",
          marginBottom: 16,
          borderLeft: "3px solid var(--accent)",
        }}>
          &ldquo;{word.example}&rdquo;
        </div>
      )}

      {/* Save button */}
      <button
        onClick={saveWord}
        disabled={isSaved || saving}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 20px",
          borderRadius: 10,
          border: isSaved ? "1px solid #52c41a44" : "1px solid var(--accent)",
          background: isSaved ? "#52c41a12" : "var(--accent-muted, rgba(99,102,241,0.08))",
          color: isSaved ? "#52c41a" : "var(--accent)",
          fontSize: 13,
          fontWeight: 600,
          cursor: isSaved ? "default" : "pointer",
          transition: "all 0.2s",
          width: "100%",
          justifyContent: "center",
        }}
      >
        {saving ? (
          <LoadingOutlined />
        ) : isSaved ? (
          <CheckCircleFilled />
        ) : (
          <BookOutlined />
        )}
        {isSaved ? "Đã lưu" : "Lưu vào từ vựng"}
      </button>
    </div>
  );
}
