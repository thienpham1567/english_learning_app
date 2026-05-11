"use client";
import { api } from "@/lib/api-client";
import { useCallback, useEffect, useState } from "react";
import { Tag, message } from "antd";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import {
  SoundOutlined,
  BookOutlined,
  CheckCircleFilled,
  LoadingOutlined,
  StarFilled,
} from "@ant-design/icons";
import * as m from "motion/react-client";
import { AnimatePresence } from "motion/react";

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

  const { speak: speakTts, isLoading: isTtsLoading } = useTextToSpeech();

  const playAudio = useCallback(() => {
    if (!word) return;
    speakTts(word.headword);
  }, [word, speakTts]);

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

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <m.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            padding: "24px",
            borderRadius: "var(--radius-lg, 16px)",
            border: "1px solid var(--border)",
            background: "var(--card-bg, var(--surface))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 120,
          }}
        >
          <LoadingOutlined style={{ fontSize: 20, color: "var(--accent)" }} />
        </m.div>
      ) : word ? (
        <m.div
          key="content"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
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
          <m.div
            animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 6 }}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 140,
              height: 140,
              background: "radial-gradient(circle at top right, var(--accent), transparent 70%)",
              pointerEvents: "none",
            }}
          />

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, position: "relative", zIndex: 1 }}>
            <m.div
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <StarFilled style={{ fontSize: 18, color: "var(--xp)" }} />
              <span style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>Từ vựng hôm nay</span>
            </m.div>
            {word.level && (
              <m.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                <Tag color="blue" style={{ fontSize: 11, borderRadius: 99, fontWeight: 700 }}>{word.level}</Tag>
              </m.div>
            )}
          </div>

          {/* Word */}
          <m.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8, position: "relative", zIndex: 1 }}
          >
            <span style={{ fontSize: 32, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>
              {word.headword}
            </span>
            <m.button
              whileHover={{ scale: 1.1, color: "var(--accent)" }}
              whileTap={{ scale: 0.9 }}
              onClick={playAudio}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
                color: "var(--accent-muted, var(--text-muted))",
                fontSize: 20,
                transition: "color 0.2s",
              }}
              aria-label="Phát âm"
            >
              {isTtsLoading ? <LoadingOutlined spin style={{ fontSize: 18 }} /> : <SoundOutlined />}
            </m.button>
          </m.div>

          {/* Pronunciation + Part of Speech */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap", position: "relative", zIndex: 1 }}
          >
            {word.pronunciation && (
              <span style={{ fontSize: 14, color: "var(--text-muted)", fontStyle: "italic", fontFamily: "var(--font-mono)" }}>
                /{word.pronunciation}/
              </span>
            )}
            {word.partOfSpeech && (
              <Tag color="default" style={{ fontSize: 10, borderRadius: 99, fontWeight: 600 }}>{word.partOfSpeech}</Tag>
            )}
          </m.div>

          {/* Vietnamese meaning */}
          <m.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)", margin: "0 0 8px", lineHeight: 1.5, position: "relative", zIndex: 1 }}
          >
            {word.overviewVi}
          </m.p>

          {/* English meaning */}
          {word.overviewEn && (
            <m.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{ fontSize: 14, color: "var(--text-muted)", margin: "0 0 16px", lineHeight: 1.5, position: "relative", zIndex: 1 }}
            >
              {word.overviewEn}
            </m.p>
          )}

          {/* Example */}
          {word.example && (
            <m.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                background: "var(--accent-muted, rgba(99,102,241,0.08))",
                fontSize: 14,
                fontStyle: "italic",
                color: "var(--ink)",
                marginBottom: 20,
                borderLeft: "4px solid var(--accent)",
                position: "relative",
                zIndex: 1,
              }}
            >
              &ldquo;{word.example}&rdquo;
            </m.div>
          )}

          {/* Save button */}
          <m.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={!isSaved ? { scale: 1.02, y: -2 } : {}}
            whileTap={!isSaved ? { scale: 0.98 } : {}}
            onClick={saveWord}
            disabled={isSaved || saving}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 20px",
              borderRadius: 14,
              border: isSaved ? "1px solid color-mix(in srgb, var(--success) 30%, transparent)" : "1px solid var(--accent)",
              background: isSaved ? "color-mix(in srgb, var(--success) 10%, transparent)" : "var(--accent)",
              color: isSaved ? "var(--success)" : "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: isSaved ? "default" : "pointer",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              width: "100%",
              justifyContent: "center",
              position: "relative",
              zIndex: 1,
              boxShadow: isSaved ? "none" : "0 4px 12px color-mix(in srgb, var(--accent) 30%, transparent)",
            }}
          >
            {saving ? (
              <LoadingOutlined />
            ) : isSaved ? (
              <CheckCircleFilled />
            ) : (
              <BookOutlined />
            )}
            {isSaved ? "Đã lưu vào kho từ vựng" : "Lưu vào kho từ vựng"}
          </m.button>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
