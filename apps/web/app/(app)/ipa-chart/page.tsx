"use client";

import { useState, useMemo, useCallback } from "react";

import { useTextToSpeech, type TtsAccent } from "@/hooks/useTextToSpeech";
import {
  CONSONANTS,
  VOWELS,
  CONSONANT_SUBTYPE_LABELS,
  VOWEL_SUBTYPE_LABELS,
  type IpaPhoneme,
} from "./_data/phonemes";
import { PhonemeCard } from "./_components/PhonemeCard";
import * as m from "motion/react-client";
import { Type } from "lucide-react";

type TabKey = "consonants" | "vowels";

function groupBy<T extends IpaPhoneme>(items: T[], getKey: (item: T) => string): Record<string, T[]> {
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
    <div className="flex flex-col h-full h-[0px] flex-1 overflow-hidden relative" >
      <div className="grain-overlay" style={{ opacity: 0.03, zIndex: 0 }} />

      {/* Page Header */}
      <div className="relative z-[1]" >
      </div>

      {/* Control bar */}
      <div className="flex items-center gap-3 flex-wrap bg-(--surface) shrink-0 z-[1]" style={{padding: "14px 20px", borderBottom: "1px solid var(--border)", boxShadow: "var(--shadow-sm)"}} >
        {/* Navigation Tabs */}
        <div className="flex gap-1 bg-surface-alt rounded-(--radius-lg) border border-(--border)" style={{padding: "3px"}} >
          {([
            { key: "consonants", label: "Phụ âm (Consonants)", count: CONSONANTS.length },
            { key: "vowels", label: "Nguyên âm (Vowels)", count: VOWELS.length },
          ] as { key: TabKey; label: string; count: number }[]).map(({ key, label, count }) => {
            const isActive = tab === key;
            return (
              <m.button
                key={key}
                onClick={() => setTab(key)}
                whileTap={{ scale: 0.97 }} className="border-none cursor-pointer text-[13px] font-extrabold flex items-center gap-2" style={{padding: "8px 18px", borderRadius: "var(--radius-md)", transition: "all 0.2s", background: isActive ? "var(--surface)" : "transparent", color: isActive ? "var(--accent)" : "var(--text-secondary)", boxShadow: isActive ? "var(--shadow-sm)" : "none"}} >
                <span>{label}</span>
                <span className="text-[10.5px] rounded-full font-extrabold" style={{padding: "2px 6px", background: isActive ? "var(--accent-light)" : "var(--border)", color: isActive ? "var(--accent)" : "var(--text-muted)"}} >
                  {count}
                </span>
              </m.button>
            );
          })}
        </div>

        {/* Accent Picker */}
        <div className="flex items-center gap-2.5" style={{marginLeft: "auto"}} >
          <span className="text-[11px] text-text-muted font-extrabold uppercase tracking-widest" >
            Giọng đọc mặc định
          </span>
          <div className="flex bg-surface-alt border border-(--border)" style={{gap: 3, padding: "3px", borderRadius: "var(--radius-md)"}} >
            {([
              { value: "us", label: "🇺🇸 US" },
              { value: "uk", label: "🇬🇧 UK" },
            ] as { value: TtsAccent; label: string }[]).map(({ value, label }) => {
              const isActive = accent === value;
              return (
                <m.button
                  key={value}
                  onClick={() => setAccent(value)}
                  whileTap={{ scale: 0.95 }} className="rounded-md border-none cursor-pointer text-xs font-extrabold" style={{padding: "5px 14px", transition: "all 0.15s", background: isActive ? "var(--surface)" : "transparent", color: isActive ? "var(--accent)" : "var(--text-secondary)", boxShadow: isActive ? "var(--shadow-sm)" : "none"}} >
                  {label}
                </m.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend guide */}
      <div className="flex items-center gap-4 bg-surface-alt flex-wrap shrink-0 z-[1]" style={{padding: "10px 20px", borderBottom: "1px solid var(--border)"}} >
        {tab === "consonants" ? (
          <>
            <LegendDot color="var(--success)" label="Hữu thanh (Voiced)" />
            <LegendDot color="var(--warning)" label="Vô thanh (Voiceless)" />
          </>
        ) : (
          <>
            <LegendDot color="var(--accent)" label="Nguyên âm ngắn (Short)" />
            <LegendDot color="var(--info)" label="Nguyên âm dài (Long)" />
            <LegendDot color="var(--tertiary, #8B5CF6)" label="Nguyên âm đôi (Diphthong)" />
          </>
        )}
        <span className="text-text-muted font-semibold" style={{fontSize: 11.5, marginLeft: "auto"}} >
          💡 Nhấp vào mỗi âm vị bên dưới để nghe cách phát âm
        </span>
      </div>

      {/* Chart grid */}
      <div className="flex-1 overflow-y-auto z-[1]" style={{padding: "24px 20px 48px"}} >
        {/* Soft background glow */}
        <div className="absolute" style={{pointerEvents: "none", inset: 0, background: "radial-gradient(ellipse 60% 40% at 50% 0%, color-mix(in srgb, var(--accent) 4%, transparent) 0%, transparent 70%)"}} />

        <div className="w-[940px] mx-auto relative" >
          {tab === "consonants" ? (
            <div className="flex flex-col gap-8" >
              {Object.entries(CONSONANT_SUBTYPE_LABELS).map(([key, label]) => {
                const items = consonantGroups[key];
                if (!items?.length) return null;
                return (
                  <section key={key}>
                    <SectionHeader label={label} count={items.length} />
                    <div className="grid gap-3" style={{gridTemplateColumns: "repeat(auto-fill, minmax(136px, 1fr))"}} >
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
            <div className="flex flex-col gap-8" >
              {Object.entries(VOWEL_SUBTYPE_LABELS).map(([key, label]) => {
                const items = vowelGroups[key];
                if (!items?.length) return null;
                return (
                  <section key={key}>
                    <SectionHeader label={label} count={items.length} color={VOWEL_COLORS[key]} />
                    <div className="grid gap-3" style={{gridTemplateColumns: "repeat(auto-fill, minmax(136px, 1fr))"}} >
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
    <span className="flex items-center gap-1.5 text-text-secondary font-bold" style={{fontSize: 11.5}} >
      <span className="w-[8px] h-[8px] rounded-full shrink-0" style={{background: color}} />
      {label}
    </span>
  );
}

function SectionHeader({ label, count, color = "var(--accent)" }: { label: string; count: number; color?: string }) {
  return (
    <div className="flex items-center gap-3" style={{marginBottom: 14}} >
      <div className="h-[18px] rounded-full shrink-0" style={{width: 3.5, background: color}} />
      <h3 className="m-0 font-extrabold text-text-primary font-display" style={{fontSize: 14.5}} >
        {label}
      </h3>
      <span className="text-[11px] font-extrabold rounded-full" style={{padding: "2px 8px", background: `color-mix(in srgb, ${color} 8%, var(--surface-alt))`, color: color}} >
        {count} âm
      </span>
      <div className="flex-1 h-[1px]" style={{background: "var(--border)"}} />
    </div>
  );
}
