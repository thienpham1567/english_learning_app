"use client";

import { useState, useMemo, useCallback } from "react";
import { Tooltip } from "antd";
import { FontSizeOutlined } from "@ant-design/icons";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { useTextToSpeech, type TtsAccent } from "@/hooks/useTextToSpeech";
import {
  CONSONANTS,
  VOWELS,
  CONSONANT_SUBTYPE_LABELS,
  VOWEL_SUBTYPE_LABELS,
  type IpaPhoneme,
  type ConsonantSubtype,
  type VowelSubtype,
} from "./_data/phonemes";
import { PhonemeCard } from "./_components/PhonemeCard";

type TabKey = "consonants" | "vowels";

function groupBy<T extends IpaPhoneme>(items: T[], getKey: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const key = getKey(item);
    (result[key] ??= []).push(item);
  }
  return result;
}

// Color per vowel subtype key
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
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, flex: 1, overflow: "hidden" }}>
      <ModuleHeader
        icon={<FontSizeOutlined />}
        gradient="linear-gradient(135deg, var(--accent), var(--tertiary, #8B5CF6))"
        title="IPA Phonemic Chart"
        subtitle="Bảng phiên âm quốc tế · 44 âm vị tiếng Anh"
      />

      {/* Controls bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
        padding: "12px 20px",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
        flexShrink: 0,
      }}>
        {/* Tab pills */}
        <div style={{ display: "flex", gap: 4, padding: "3px", background: "var(--bg-deep)", borderRadius: 10 }}>
          {([
            { key: "consonants", label: "Consonants", count: CONSONANTS.length },
            { key: "vowels", label: "Vowels", count: VOWELS.length },
          ] as { key: TabKey; label: string; count: number }[]).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                padding: "6px 16px",
                borderRadius: 7,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                transition: "all 0.18s ease",
                background: tab === key ? "var(--surface)" : "transparent",
                color: tab === key ? "var(--accent)" : "var(--text-muted)",
                boxShadow: tab === key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {label}
              <span style={{
                fontSize: 10,
                padding: "1px 5px",
                borderRadius: 99,
                fontWeight: 700,
                background: tab === key ? "var(--accent-muted)" : "transparent",
                color: tab === key ? "var(--accent)" : "var(--text-muted)",
              }}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Accent switcher */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Accent
          </span>
          <div style={{ display: "flex", gap: 3, padding: "2px", background: "var(--bg-deep)", borderRadius: 8 }}>
            {([
              { value: "us", label: "🇺🇸 US" },
              { value: "uk", label: "🇬🇧 UK" },
            ] as { value: TtsAccent; label: string }[]).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setAccent(value)}
                style={{
                  padding: "4px 12px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  transition: "all 0.15s",
                  background: accent === value ? "var(--surface)" : "transparent",
                  color: accent === value ? "var(--accent)" : "var(--text-muted)",
                  boxShadow: accent === value ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "8px 20px",
        background: "var(--bg)",
        borderBottom: "1px solid var(--border)",
        flexWrap: "wrap",
        flexShrink: 0,
      }}>
        {tab === "consonants" ? (
          <>
            <LegendDot color="var(--success)" label="Voiced" />
            <LegendDot color="var(--warning)" label="Voiceless" />
          </>
        ) : (
          <>
            <LegendDot color="var(--accent)" label="Short vowel" />
            <LegendDot color="var(--info)" label="Long vowel" />
            <LegendDot color="var(--tertiary, #8B5CF6)" label="Diphthong" />
          </>
        )}
        <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>
          Nhấn vào thẻ để nghe phát âm
        </span>
      </div>

      {/* Chart content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 32px" }}>
        <div style={{ maxWidth: 940, margin: "0 auto" }}>
          {tab === "consonants" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {Object.entries(CONSONANT_SUBTYPE_LABELS).map(([key, label]) => {
                const items = consonantGroups[key];
                if (!items?.length) return null;
                return (
                  <section key={key}>
                    <SectionHeader label={label} count={items.length} />
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(128px, 1fr))",
                      gap: 10,
                    }}>
                      {items.map((p) => (
                        <PhonemeCard
                          key={p.symbol}
                          phoneme={p}
                          accent={accent}
                          onSpeak={handleSpeak}
                          isBusy={isBusy}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {Object.entries(VOWEL_SUBTYPE_LABELS).map(([key, label]) => {
                const items = vowelGroups[key];
                if (!items?.length) return null;
                return (
                  <section key={key}>
                    <SectionHeader label={label} count={items.length} color={VOWEL_COLORS[key]} />
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(128px, 1fr))",
                      gap: 10,
                    }}>
                      {items.map((p) => (
                        <PhonemeCard
                          key={p.symbol}
                          phoneme={p}
                          accent={accent}
                          onSpeak={handleSpeak}
                          isBusy={isBusy}
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

      <style>{`
        .ipa-card:hover {
          transform: translateY(-3px);
          border-color: var(--accent) !important;
          box-shadow: 0 6px 20px color-mix(in srgb, var(--accent) 14%, transparent) !important;
        }
        .ipa-card:active {
          transform: translateY(-1px);
        }
        @keyframes ipaCardPulse {
          0%   { transform: scale(1); }
          35%  { transform: scale(1.12); opacity: 0.7; }
          70%  { transform: scale(0.97); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 }}>
      <span style={{
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: color,
        flexShrink: 0,
      }} />
      {label}
    </span>
  );
}

function SectionHeader({ label, count, color = "var(--accent)" }: { label: string; count: number; color?: string }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
    }}>
      <div style={{
        width: 3,
        height: 20,
        borderRadius: 2,
        background: color,
        flexShrink: 0,
      }} />
      <h3 style={{
        margin: 0,
        fontSize: 14,
        fontWeight: 700,
        color: "var(--text-primary)",
        fontFamily: "var(--font-display)",
        letterSpacing: "-0.01em",
      }}>
        {label}
      </h3>
      <span style={{
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 7px",
        borderRadius: 99,
        background: `color-mix(in srgb, ${color} 10%, var(--bg-deep))`,
        color: color,
        letterSpacing: "0.03em",
      }}>
        {count}
      </span>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}
