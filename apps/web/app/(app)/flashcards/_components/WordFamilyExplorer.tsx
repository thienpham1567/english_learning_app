"use client";

import { Card, Tag, Typography } from "antd";
import { Lightbulb, Loader2, Network, Star, Target, Volume2 } from "lucide-react";

import * as m from "motion/react-client";
import { useCallback, useState } from "react";
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
        onClick={(e) => {
          e.stopPropagation();
          fetchWordFamily();
        }}
        className="mt-2 w-full flex items-center justify-center gap-1.5 cursor-pointer text-xs font-bold"
        style={{
          padding: "9px 16px",
          borderRadius: 10,
          border: "1.5px solid color-mix(in srgb, var(--secondary) 20%, var(--border))",
          background: "color-mix(in srgb, var(--secondary) 4%, var(--surface))",
          color: "var(--secondary, var(--accent))",
          transition: "all 0.2s",
        }}
      >
        <Network size={12} />
        Word Family Explorer
      </button>
    );
  }

  if (loading) {
    return (
      <div className="mt-2 text-center" style={{ padding: "12px 0" }}>
        <Loader2 className="animate-spin text-accent" size={16} />
        <div className="text-[11px] text-text-muted mt-1">Đang phân tích word family...</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <m.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={{ duration: 0.3 }}
      onClick={(e) => e.stopPropagation()}
      className="mt-2.5 overflow-hidden"
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 py-2 px-3 cursor-pointer text-[11px] font-bold text-accent uppercase"
        style={{
          borderRadius: 10,
          border: "1px solid color-mix(in srgb, var(--accent) 15%, var(--border))",
          background: "color-mix(in srgb, var(--accent) 4%, var(--surface))",
          letterSpacing: ".08em",
        }}
      >
        <Network />
        Word Family: {data.rootWord}
        <span className="text-[10px] text-text-muted" style={{ marginLeft: "auto" }}>
          {data.family.length} forms
        </span>
      </button>

      {expanded && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-1.5 mt-2"
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
                  styles={{ body: { padding: "10px 12px" } }}
                  className="bg-bg-deep border-2 border-border"
                  style={{ borderRadius: 10 }}
                >
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <Text strong className="text-ink text-sm">
                      {form.word}
                    </Text>
                    <Tag
                      color={POS_COLORS[form.partOfSpeech.toLowerCase()] ?? "default"}
                      className="text-[10px] rounded-full m-0"
                    >
                      {form.partOfSpeech}
                    </Tag>
                    <span className="text-[10px] font-semibold" style={{ color: freqInfo.color }}>
                      <Star style={{ fontSize: 8, marginRight: 2 }} />
                      {freqInfo.label}
                    </span>
                    {form.pronunciation && (
                      <Text type="secondary" className="text-[10px] font-mono">
                        {form.pronunciation}
                      </Text>
                    )}
                  </div>
                  <Text type="secondary" className="text-xs block mb-1">
                    {form.meaningVi}
                  </Text>
                  <Text
                    dangerouslySetInnerHTML={{
                      __html: form.exampleEn.replace(
                        /\*([^*]+)\*/g,
                        '<strong style="color: var(--accent)">$1</strong>',
                      ),
                    }}
                    className="text-xs leading-normal"
                  />
                  <br />
                  <Text type="secondary" className="text-[11px]">
                    {form.exampleVi}
                  </Text>
                  {form.commonCollocations.length > 0 && (
                    <div className="mt-1 flex gap-1 flex-wrap">
                      {form.commonCollocations.map((c) => (
                        <Tag key={c} className="text-[9px] rounded-full">
                          {c}
                        </Tag>
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
              className="py-2 px-3 rounded-lg"
              style={{
                background: "color-mix(in srgb, var(--accent) 5%, var(--surface))",
                border: "1px solid color-mix(in srgb, var(--accent) 10%, var(--border))",
              }}
            >
              {data.tip && (
                <p
                  className="text-[11px] text-text-secondary leading-normal"
                  style={{ margin: "0 0 4px" }}
                >
                  <Lightbulb className="mr-1" />
                  {data.tip}
                </p>
              )}
              {data.toeicNote && (
                <p className="text-[11px] text-text-muted m-0 leading-normal">
                  <Target className="mr-1" />
                  {data.toeicNote}
                </p>
              )}
            </div>
          )}
        </m.div>
      )}
    </m.div>
  );
}
