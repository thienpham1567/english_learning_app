"use client";

import { useState, useCallback } from "react";
import { Tag, Card, Typography } from "antd";
import {
  ApartmentOutlined,
  LoadingOutlined,
  SoundOutlined,
  StarFilled,
  BulbOutlined,
  AimOutlined,
} from "@ant-design/icons";
import * as m from "motion/react-client";
import { api } from "@/lib/api-client";

const { Text } = Typography;

type WordForm = {
  word: string;
  partOfSpeech: string;
  pronunciation: string;
  meaningVi: string;
  exampleEn: string;
  exampleVi: string;
  toeicFrequency: "high" | "medium" | "low";
  commonCollocations: string[];
};

type WordFamilyData = {
  rootWord: string;
  family: WordForm[];
  tip: string;
  toeicNote: string;
};

const POS_COLORS: Record<string, string> = {
  noun: "blue",
  verb: "green",
  adjective: "orange",
  adverb: "purple",
  "phrasal verb": "cyan",
};

const FREQ_LABELS: Record<string, { label: string; color: string }> = {
  high: { label: "Rất phổ biến", color: "var(--success)" },
  medium: { label: "Phổ biến", color: "var(--accent)" },
  low: { label: "Ít gặp", color: "var(--text-muted)" },
};

export function WordFamilyExplorer({ word }: { word: string }) {
  const [data, setData] = useState<WordFamilyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchWordFamily = useCallback(async () => {
    if (data || loading) return;
    setLoading(true);
    try {
      const result = await api.post<WordFamilyData>("/vocabulary/word-family", { word });
      setData(result);
      setExpanded(true);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, [word, data, loading]);

  if (!data && !loading) {
    return (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); fetchWordFamily(); }}
        style={{
          marginTop: 8,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: "9px 16px",
          borderRadius: 10,
          border: "1.5px solid color-mix(in srgb, var(--secondary) 20%, var(--border))",
          background: "color-mix(in srgb, var(--secondary) 4%, var(--surface))",
          color: "var(--secondary, var(--accent))",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 700,
          transition: "all 0.2s",
        }}
      >
        <ApartmentOutlined style={{ fontSize: 12 }} />
        Word Family Explorer
      </button>
    );
  }

  if (loading) {
    return (
      <div style={{ marginTop: 8, textAlign: "center", padding: "12px 0" }}>
        <LoadingOutlined spin style={{ fontSize: 16, color: "var(--accent)" }} />
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
          Đang phân tích word family...
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <m.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={{ duration: 0.3 }}
      style={{ marginTop: 10, overflow: "hidden" }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          borderRadius: 10,
          border: "1px solid color-mix(in srgb, var(--accent) 15%, var(--border))",
          background: "color-mix(in srgb, var(--accent) 4%, var(--surface))",
          cursor: "pointer",
          fontSize: 11,
          fontWeight: 700,
          color: "var(--accent)",
          textTransform: "uppercase",
          letterSpacing: ".08em",
        }}
      >
        <ApartmentOutlined />
        Word Family: {data.rootWord}
        <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--text-muted)" }}>
          {data.family.length} forms
        </span>
      </button>

      {expanded && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}
        >
          {data.family.map((form, i) => {
            const freqInfo = FREQ_LABELS[form.toeicFrequency] ?? FREQ_LABELS.medium;
            return (
              <m.div
                key={form.word}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card
                  size="small"
                  style={{
                    background: "var(--bg-deep)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                  }}
                  styles={{ body: { padding: "10px 12px" } }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                    <Text strong style={{ fontSize: 14, color: "var(--ink)" }}>
                      {form.word}
                    </Text>
                    <Tag
                      color={POS_COLORS[form.partOfSpeech.toLowerCase()] ?? "default"}
                      style={{ fontSize: 10, borderRadius: 99, margin: 0 }}
                    >
                      {form.partOfSpeech}
                    </Tag>
                    <span style={{ fontSize: 10, color: freqInfo.color, fontWeight: 600 }}>
                      <StarFilled style={{ fontSize: 8, marginRight: 2 }} />
                      {freqInfo.label}
                    </span>
                    {form.pronunciation && (
                      <Text type="secondary" style={{ fontSize: 10, fontFamily: "var(--font-mono)" }}>
                        {form.pronunciation}
                      </Text>
                    )}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                    {form.meaningVi}
                  </Text>
                  <Text
                    style={{ fontSize: 12, lineHeight: 1.5 }}
                    dangerouslySetInnerHTML={{
                      __html: form.exampleEn.replace(
                        /\*([^*]+)\*/g,
                        '<strong style="color: var(--accent)">$1</strong>',
                      ),
                    }}
                  />
                  <br />
                  <Text type="secondary" style={{ fontSize: 11 }}>{form.exampleVi}</Text>
                  {form.commonCollocations.length > 0 && (
                    <div style={{ marginTop: 4, display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {form.commonCollocations.map((c) => (
                        <Tag key={c} style={{ fontSize: 9, borderRadius: 99 }}>{c}</Tag>
                      ))}
                    </div>
                  )}
                </Card>
              </m.div>
            );
          })}

          {/* Tips */}
          {(data.tip || data.toeicNote) && (
            <div
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                background: "color-mix(in srgb, var(--accent) 5%, var(--surface))",
                border: "1px solid color-mix(in srgb, var(--accent) 10%, var(--border))",
              }}
            >
              {data.tip && (
                <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: "0 0 4px", lineHeight: 1.5 }}>
                  <BulbOutlined style={{ marginRight: 4 }} />{data.tip}
                </p>
              )}
              {data.toeicNote && (
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                  <AimOutlined style={{ marginRight: 4 }} />{data.toeicNote}
                </p>
              )}
            </div>
          )}
        </m.div>
      )}
    </m.div>
  );
}
