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
      {/* Control bar */}
      <div className="flex items-center gap-3 flex-wrap bg-surface shrink-0 z-[1] py-3.5 px-5 border-b-2 border-border shadow-sm">
        {/* Navigation Tabs */}
        <div className="flex gap-1 bg-surface-alt rounded-lg border-2 border-border p-[3px]">
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
                className={`border-none cursor-pointer text-[13px] font-extrabold flex items-center gap-2 py-2 px-4.5 rounded-md transition-all duration-200 ${
                  isActive
                    ? "bg-surface text-accent shadow-sm"
                    : "bg-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                <span>{label}</span>
                <span
                  className={`text-[10.5px] rounded-full font-extrabold py-0.5 px-1.5 ${
                    isActive
                      ? "bg-accent-light text-accent"
                      : "bg-border text-text-muted"
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
          <span className="text-[11px] text-text-muted font-extrabold uppercase tracking-widest hidden sm:inline">
            Default voice accent
          </span>
          <div className="flex bg-surface-alt border-2 border-border gap-[3px] p-[3px] rounded-md">
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
                  className={`rounded-md border-none cursor-pointer text-xs font-extrabold py-1.5 px-3.5 transition-all duration-150 ${
                    isActive
                      ? "bg-surface text-accent shadow-sm"
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

      {/* Legend guide */}
      <div className="flex items-center gap-4 bg-surface-alt flex-wrap shrink-0 z-[1] py-2.5 px-5 border-b border-border">
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
        <span className="text-text-muted font-semibold text-[11.5px] ml-auto hidden sm:flex items-center gap-1">
          <Lightbulb size={12} /> Click on each phoneme below to listen to its pronunciation
        </span>
      </div>

      {/* Chart grid */}
      <div className="flex-1 overflow-y-auto z-[1] py-6 px-5 pb-12">
        {/* Soft background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 0%, color-mix(in srgb, var(--accent) 4%, transparent) 0%, transparent 70%)",
          }}
        />

        <div className="w-full max-w-5xl mx-auto relative">
          {tab === "consonants" ? (
            <div className="flex flex-col gap-8">
              {Object.entries(CONSONANT_SUBTYPE_LABELS).map(([key, label]) => {
                const items = consonantGroups[key];
                if (!items?.length) return null;
                return (
                  <section key={key}>
                    <SectionHeader label={label} count={items.length} />
                    <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(136px,1fr))]">
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
                    <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(136px,1fr))]">
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

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-text-secondary font-bold text-[11.5px]">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
      {label}
    </span>
  );
}

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
    <div className="flex items-center gap-3 mb-3.5">
      <div className="w-[3.5px] h-[18px] rounded-full shrink-0" style={{ background: color }} />
      <h3 className="m-0 font-extrabold text-text-primary font-display text-[14.5px]">
        {label}
      </h3>
      <span
        className="text-[11px] font-extrabold rounded-full py-0.5 px-2"
        style={{
          background: `color-mix(in srgb, ${color} 8%, var(--surface-alt))`,
          color: color,
        }}
      >
        {count} phonemes
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
