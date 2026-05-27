"use client";

import { Lightbulb } from "lucide-react";
import * as m from "motion/react-client";
import { useCallback, useMemo, useState } from "react";
import { type TtsAccent, useTextToSpeech } from "@/hooks/useTextToSpeech";
import { PhonemeCard } from "./_components/PhonemeCard";
import {
  CONSONANT_SUBTYPE_LABELS,
  CONSONANTS,
  type IpaPhoneme,
  VOWEL_SUBTYPE_LABELS,
  VOWELS,
} from "./_data/phonemes";

type TabKey = "consonants" | "vowels";

function groupBy<T extends IpaPhoneme>(
  items: T[],
  getKey: (item: T) => string,
): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const key = getKey(item);
    (result[key] ??= []).push(item);
  }
  return result;
}

const VOWEL_COLORS: Record<string, string> = {
  "monophthong-short": "var(--accent)",
  "monophthong-long": "var(--info)",
  diphthong: "var(--tertiary, #8B5CF6)",
};

export default function IpaChartPage() {
  const [tab, setTab] = useState<TabKey>("consonants");
  const [accent, setAccent] = useState<TtsAccent>("us");
  const { speak, isSpeaking, isLoading } = useTextToSpeech();

  const isBusy = isSpeaking || isLoading;

  const handleSpeak = useCallback(
    (word: string, selectedAccent: TtsAccent) => {
      setAccent(selectedAccent);
      speak(word, { accent: selectedAccent });
    },
    [speak],
  );

  const consonantGroups = useMemo(() => groupBy(CONSONANTS, (p) => p.subtype), []);
  const vowelGroups = useMemo(() => groupBy(VOWELS, (p) => p.subtype), []);

  return (
    <div className="flex flex-col h-full min-h-0 flex-1 overflow-hidden relative">
      {/* ─── Control bar ─── */}
      <div className="flex items-center gap-3 flex-wrap shrink-0 z-[1] py-3 px-5">
        {/* Tab switcher */}
        <div className="flex gap-1 bg-surface-alt rounded-2xl border-2 border-border p-1 shadow-sm">
          {(
            [
              { key: "consonants", label: "Consonants", count: CONSONANTS.length },
              { key: "vowels", label: "Vowels", count: VOWELS.length },
            ] as { key: TabKey; label: string; count: number }[]
          ).map(({ key, label, count }) => {
            const isActive = tab === key;
            return (
              <m.button
                key={key}
                onClick={() => setTab(key)}
                whileTap={{ scale: 0.97 }}
                className={`border-none cursor-pointer text-[13px] font-black flex items-center gap-2 py-2 px-4.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-accent text-text-on-accent shadow-sm"
                    : "bg-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                <span>{label}</span>
                <span
                  className={`text-[10px] rounded-full font-extrabold py-0.5 px-2 ${
                    isActive
                      ? "bg-black/15 text-text-on-accent"
                      : "bg-bg-deep text-text-muted"
                  }`}
                >
                  {count}
                </span>
              </m.button>
            );
          })}
        </div>

        {/* Accent Picker */}
        <div className="flex items-center gap-2.5 ml-auto">
          <span className="text-[10px] text-text-muted font-extrabold uppercase tracking-widest hidden sm:inline font-display">
            Default voice accent
          </span>
          <div className="flex bg-surface-alt border-2 border-border gap-0.5 p-1 rounded-xl shadow-sm">
            {(
              [
                { value: "us", label: "🇺🇸 US" },
                { value: "uk", label: "🇬🇧 UK" },
              ] as { value: TtsAccent; label: string }[]
            ).map(({ value, label }) => {
              const isActive = accent === value;
              return (
                <m.button
                  key={value}
                  onClick={() => setAccent(value)}
                  whileTap={{ scale: 0.95 }}
                  className={`rounded-lg border-none cursor-pointer text-xs font-black py-1.5 px-3.5 transition-all duration-150 ${
                    isActive
                      ? "bg-surface text-ink shadow-sm border-2 border-border"
                      : "bg-transparent text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {label}
                </m.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Legend ─── */}
      <div className="flex items-center gap-4 flex-wrap shrink-0 z-[1] py-2.5 px-5 border-y-2 border-border bg-surface-alt">
        {tab === "consonants" ? (
          <>
            <LegendDot color="var(--success)" label="Voiced" />
            <LegendDot color="var(--warning)" label="Voiceless" />
          </>
        ) : (
          <>
            <LegendDot color="var(--accent)" label="Short Vowels" />
            <LegendDot color="var(--info)" label="Long Vowels" />
            <LegendDot color="var(--tertiary, #8B5CF6)" label="Diphthongs" />
          </>
        )}
        <span className="text-text-muted font-semibold text-[11px] ml-auto hidden sm:flex items-center gap-1.5">
          <Lightbulb size={12} className="text-accent" />
          Click on each phoneme below to listen to its pronunciation
        </span>
      </div>

      {/* ─── Chart grid ─── */}
      <div className="flex-1 overflow-y-auto z-[1] py-6 px-5 pb-12">
        <div className="w-full max-w-5xl mx-auto relative">
          {tab === "consonants" ? (
            <div className="flex flex-col gap-8">
              {Object.entries(CONSONANT_SUBTYPE_LABELS).map(([key, label]) => {
                const items = consonantGroups[key];
                if (!items?.length) return null;
                return (
                  <section key={key}>
                    <SectionHeader label={label} count={items.length} />
                    <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
                      {items.map((p, idx) => (
                        <PhonemeCard
                          key={p.symbol}
                          phoneme={p}
                          accent={accent}
                          onSpeak={handleSpeak}
                          isBusy={isBusy}
                          index={idx}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {Object.entries(VOWEL_SUBTYPE_LABELS).map(([key, label]) => {
                const items = vowelGroups[key];
                if (!items?.length) return null;
                return (
                  <section key={key}>
                    <SectionHeader label={label} count={items.length} color={VOWEL_COLORS[key]} />
                    <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
                      {items.map((p, idx) => (
                        <PhonemeCard
                          key={p.symbol}
                          phoneme={p}
                          accent={accent}
                          onSpeak={handleSpeak}
                          isBusy={isBusy}
                          index={idx}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Legend Dot ─── */
function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-text-secondary font-bold text-[11px]">
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0 border border-border"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

/* ─── Section Header ─── */
function SectionHeader({
  label,
  count,
  color = "var(--accent)",
}: {
  label: string;
  count: number;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className="w-1 h-5 rounded-full shrink-0"
        style={{ background: color }}
      />
      <h3 className="m-0 font-black text-ink font-display text-sm uppercase tracking-wide">
        {label}
      </h3>
      <span
        className="text-[10px] font-extrabold rounded-full py-0.5 px-2.5 border"
        style={{
          background: `color-mix(in srgb, ${color} 8%, var(--surface-alt))`,
          color: color,
          borderColor: `color-mix(in srgb, ${color} 20%, var(--border))`,
        }}
      >
        {count}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
