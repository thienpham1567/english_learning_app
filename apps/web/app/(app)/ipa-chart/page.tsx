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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        flex: 1,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div className="grain-overlay" style={{ opacity: 0.03, zIndex: 0 }} />

      {/* Page Header */}
      <div style={{ position: "relative", zIndex: 1 }}>
      </div>

      {/* Control bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          padding: "14px 20px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          flexShrink: 0,
          zIndex: 1,
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {/* Navigation Tabs */}
        <div style={{ display: "flex", gap: 4, padding: "3px", background: "var(--surface-alt)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
          {([
            { key: "consonants", label: "Phụ âm (Consonants)", count: CONSONANTS.length },
            { key: "vowels", label: "Nguyên âm (Vowels)", count: VOWELS.length },
          ] as { key: TabKey; label: string; count: number }[]).map(({ key, label, count }) => {
            const isActive = tab === key;
            return (
              <m.button
                key={key}
                onClick={() => setTab(key)}
                whileTap={{ scale: 0.97 }}
                style={{
                  padding: "8px 18px",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 800,
                  transition: "all 0.2s",
                  background: isActive ? "var(--surface)" : "transparent",
                  color: isActive ? "var(--accent)" : "var(--text-secondary)",
                  boxShadow: isActive ? "var(--shadow-sm)" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>{label}</span>
                <span
                  style={{
                    fontSize: 10.5,
                    padding: "2px 6px",
                    borderRadius: 99,
                    fontWeight: 800,
                    background: isActive ? "var(--accent-light)" : "var(--border)",
                    color: isActive ? "var(--accent)" : "var(--text-muted)",
                  }}
                >
                  {count}
                </span>
              </m.button>
            );
          })}
        </div>

        {/* Accent Picker */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Giọng đọc mặc định
          </span>
          <div style={{ display: "flex", gap: 3, padding: "3px", background: "var(--surface-alt)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
            {([
              { value: "us", label: "🇺🇸 US" },
              { value: "uk", label: "🇬🇧 UK" },
            ] as { value: TtsAccent; label: string }[]).map(({ value, label }) => {
              const isActive = accent === value;
              return (
                <m.button
                  key={value}
                  onClick={() => setAccent(value)}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: "5px 14px",
                    borderRadius: 6,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 800,
                    transition: "all 0.15s",
                    background: isActive ? "var(--surface)" : "transparent",
                    color: isActive ? "var(--accent)" : "var(--text-secondary)",
                    boxShadow: isActive ? "var(--shadow-sm)" : "none",
                  }}
                >
                  {label}
                </m.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend guide */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "10px 20px",
          background: "var(--surface-alt)",
          borderBottom: "1px solid var(--border)",
          flexWrap: "wrap",
          flexShrink: 0,
          zIndex: 1,
        }}
      >
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
        <span style={{ fontSize: 11.5, color: "var(--text-muted)", marginLeft: "auto", fontWeight: 600 }}>
          💡 Nhấp vào mỗi âm vị bên dưới để nghe cách phát âm
        </span>
      </div>

      {/* Chart grid */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 20px 48px",
          zIndex: 1,
        }}
      >
        {/* Soft background glow */}
        <div
          style={{
            pointerEvents: "none",
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse 60% 40% at 50% 0%, color-mix(in srgb, var(--accent) 4%, transparent) 0%, transparent 70%)",
          }}
        />

        <div style={{ maxWidth: 940, margin: "0 auto", position: "relative" }}>
          {tab === "consonants" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {Object.entries(CONSONANT_SUBTYPE_LABELS).map(([key, label]) => {
                const items = consonantGroups[key];
                if (!items?.length) return null;
                return (
                  <section key={key}>
                    <SectionHeader label={label} count={items.length} />
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(136px, 1fr))",
                        gap: 12,
                      }}
                    >
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
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {Object.entries(VOWEL_SUBTYPE_LABELS).map(([key, label]) => {
                const items = vowelGroups[key];
                if (!items?.length) return null;
                return (
                  <section key={key}>
                    <SectionHeader label={label} count={items.length} color={VOWEL_COLORS[key]} />
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(136px, 1fr))",
                        gap: 12,
                      }}
                    >
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
    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--text-secondary)", fontWeight: 700 }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}

function SectionHeader({ label, count, color = "var(--accent)" }: { label: string; count: number; color?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 14,
      }}
    >
      <div
        style={{
          width: 3.5,
          height: 18,
          borderRadius: 99,
          background: color,
          flexShrink: 0,
        }}
      />
      <h3
        style={{
          margin: 0,
          fontSize: 14.5,
          fontWeight: 800,
          color: "var(--text-primary)",
          fontFamily: "var(--font-display)",
        }}
      >
        {label}
      </h3>
      <span
        style={{
          fontSize: 11,
          fontWeight: 800,
          padding: "2px 8px",
          borderRadius: 99,
          background: `color-mix(in srgb, ${color} 8%, var(--surface-alt))`,
          color: color,
        }}
      >
        {count} âm
      </span>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}
