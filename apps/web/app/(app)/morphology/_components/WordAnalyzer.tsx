"use client";

import { Loader2, Search, Wand2 } from "lucide-react";
import * as m from "motion/react-client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api-client";
import type { MorphemeAnalysis, MorphemeType } from "@/lib/morphology/schema";
import { FamilyRow } from "./lesson/FamilyRow";

const PART_COLOR: Record<MorphemeType, string> = {
  prefix: "var(--info)",
  root: "var(--accent)",
  suffix: "var(--secondary, var(--accent))",
};

const PART_LABEL: Record<MorphemeType, string> = {
  prefix: "prefix",
  root: "root",
  suffix: "suffix",
};

/** Analyze-a-word mode: split an arbitrary word into morphemes + word family. */
export function WordAnalyzer() {
  const [word, setWord] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MorphemeAnalysis | null>(null);

  const analyze = async () => {
    const w = word.trim();
    if (!w || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.post<MorphemeAnalysis>("/morphology/analyze", { word: w });
      setResult(data);
    } catch {
      setError("Couldn't analyze that word. Try another one.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[700px] mx-auto w-full flex flex-col gap-4">
      <Card shadowSize="sm" className="rounded-xl bg-surface">
        <span className="flex items-center gap-1.5 text-[11.5px] font-black text-text-secondary uppercase tracking-wider mb-3">
          <Wand2 size={14} /> Analyze a word
        </span>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
            <input
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") analyze();
              }}
              placeholder="e.g. unbelievable, transportation…"
              className="w-full rounded-xl bg-surface text-text-primary text-sm py-3 pl-9 pr-4 border-2 border-border outline-none transition-colors focus:border-accent"
            />
          </div>
          <m.button
            type="button"
            whileHover={word.trim() ? { scale: 1.03 } : undefined}
            whileTap={word.trim() ? { scale: 0.97 } : undefined}
            onClick={analyze}
            disabled={!word.trim() || loading}
            className={`inline-flex items-center gap-1.5 rounded-xl text-[13px] font-black py-3 px-5 border-2 transition-colors ${
              word.trim()
                ? "bg-accent text-text-on-accent border-border cursor-pointer hover:bg-accent-hover"
                : "bg-surface-alt text-text-muted border-border cursor-default"
            }`}
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : "Analyze"}
          </m.button>
        </div>
      </Card>

      {error && (
        <div className="p-4 rounded-xl text-center border-2 border-error/25 bg-error/5">
          <p className="font-bold text-sm text-error m-0">{error}</p>
        </div>
      )}

      {result && (
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4"
        >
          {/* Morpheme breakdown */}
          <Card shadowSize="sm" className="rounded-xl bg-surface">
            <span className="text-[11.5px] font-black text-text-secondary uppercase tracking-wider mb-3 block">
              Breakdown of "{result.word}"
            </span>
            <div className="flex flex-wrap items-stretch gap-2">
              {result.parts.map((part, i) => (
                <div
                  key={i}
                  className="rounded-lg border-2 px-3 py-2 min-w-[90px]"
                  style={{
                    borderColor: PART_COLOR[part.type],
                    background: `color-mix(in srgb, ${PART_COLOR[part.type]} 8%, transparent)`,
                  }}
                >
                  <div
                    className="font-black font-mono text-[15px]"
                    style={{ color: PART_COLOR[part.type] }}
                  >
                    {part.surface}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
                    {PART_LABEL[part.type]}
                  </div>
                  <div className="mt-0.5 text-[12px] text-text-secondary font-medium">
                    {part.meaning}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Word family */}
          {result.family.length > 0 && (
            <Card shadowSize="sm" className="rounded-xl bg-surface">
              <span className="text-[11.5px] font-black text-text-secondary uppercase tracking-wider mb-3.5 block">
                Word Family
              </span>
              <div className="flex flex-col gap-2.5">
                {result.family.map((fw) => (
                  <FamilyRow key={fw.word} fw={fw} />
                ))}
              </div>
            </Card>
          )}
        </m.div>
      )}
    </div>
  );
}
