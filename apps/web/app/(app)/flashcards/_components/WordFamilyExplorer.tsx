"use client";

import { Lightbulb, Loader2, Network, Star, Target } from "lucide-react";
import * as m from "motion/react-client";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api-client";

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
  noun: "var(--info)",
  verb: "var(--success)",
  adjective: "var(--warning)",
  adverb: "var(--tertiary, #8B5CF6)",
  "phrasal verb": "var(--accent-active)",
};

const FREQ_LABELS: Record<string, { label: string; color: string }> = {
  high: { label: "Very Common", color: "var(--success)" },
  medium: { label: "Common", color: "var(--accent-active)" },
  low: { label: "Rare", color: "var(--text-muted)" },
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
      <Button
        variant="subtle"
        size="sm"
        className="mt-2 w-full"
        onClick={(e) => {
          e.stopPropagation();
          fetchWordFamily();
        }}
      >
        <Network size={12} />
        Word Family Explorer
      </Button>
    );
  }

  if (loading) {
    return (
      <div className="mt-2 text-center py-3">
        <Loader2 className="animate-spin text-accent-active" size={16} />
        <div className="text-[11px] text-text-muted mt-1">Analyzing word family...</div>
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
        className="w-full flex items-center gap-2 py-2 px-3 cursor-pointer text-[11px] font-bold text-accent-active uppercase tracking-[.08em] rounded-xl"
        style={{
          border: "1px solid color-mix(in srgb, var(--accent) 15%, var(--border))",
          background: "color-mix(in srgb, var(--accent) 4%, var(--surface))",
        }}
      >
        <Network />
        Word Family: {data.rootWord}
        <span className="text-[10px] text-text-muted ml-auto">{data.family.length} forms</span>
      </button>

      {expanded && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-1.5 mt-2"
        >
          {data.family.map((form, i) => {
            const freqInfo = FREQ_LABELS[form.toeicFrequency] ?? FREQ_LABELS.medium;
            const posColor = POS_COLORS[form.partOfSpeech.toLowerCase()] ?? "var(--text-muted)";
            return (
              <m.div
                key={form.word}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card
                  size="sm"
                  shadowSize="none"
                  bgType="muted"
                  className="py-2.5 px-3 gap-0.5 border-2 rounded-xl"
                >
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className="font-bold text-ink text-sm">{form.word}</span>
                    <span
                      className="text-[10px] font-bold rounded-lg py-0.5 px-2"
                      style={{
                        color: posColor,
                        background: `color-mix(in srgb, ${posColor} 10%, var(--surface))`,
                        border: `1px solid color-mix(in srgb, ${posColor} 25%, transparent)`,
                      }}
                    >
                      {form.partOfSpeech}
                    </span>
                    <span
                      className="text-[10px] font-semibold inline-flex items-center gap-0.5"
                      style={{ color: freqInfo.color }}
                    >
                      <Star size={8} />
                      {freqInfo.label}
                    </span>
                    {form.pronunciation && (
                      <span className="text-[10px] font-mono text-text-muted">
                        {form.pronunciation}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-text-secondary block mb-1">{form.meaningVi}</span>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: form.exampleEn.replace(
                        /\*([^*]+)\*/g,
                        '<strong style="color: var(--accent-active)">$1</strong>',
                      ),
                    }}
                    className="text-xs leading-normal"
                  />
                  <br />
                  <span className="text-[11px] text-text-muted">{form.exampleVi}</span>
                  {form.commonCollocations.length > 0 && (
                    <div className="mt-1 flex gap-1 flex-wrap">
                      {form.commonCollocations.map((c) => (
                        <span
                          key={c}
                          className="text-[9px] rounded-lg py-0.5 px-2 bg-surface-alt border-2 border-border text-text-muted font-medium"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </Card>
              </m.div>
            );
          })}

          {/* Tips */}
          {(data.tip || data.toeicNote) && (
            <Card
              size="sm"
              shadowSize="none"
              bgType="accent-light"
              className="py-2 px-3 border-2 border-accent/15 rounded-lg gap-1"
            >
              {data.tip && (
                <p className="text-[11px] text-text-secondary leading-normal m-0 mb-1">
                  <Lightbulb className="mr-1 inline" size={12} />
                  {data.tip}
                </p>
              )}
              {data.toeicNote && (
                <p className="text-[11px] text-text-muted m-0 leading-normal">
                  <Target className="mr-1 inline" size={12} />
                  {data.toeicNote}
                </p>
              )}
            </Card>
          )}
        </m.div>
      )}
    </m.div>
  );
}
