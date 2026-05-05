"use client";

import { useState, useMemo, useCallback } from "react";
import { Segmented, Tag } from "antd";
import { SoundOutlined } from "@ant-design/icons";
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

// Group phonemes by subtype
function groupBy<T extends IpaPhoneme>(items: T[], getKey: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const key = getKey(item);
    (result[key] ??= []).push(item);
  }
  return result;
}

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
        icon={<SoundOutlined />}
        gradient="linear-gradient(135deg, var(--accent), var(--tertiary))"
        title="IPA Phonemic Chart"
        subtitle="Bảng phiên âm quốc tế · 44 âm vị tiếng Anh"
      />

      {/* Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          padding: "16px 24px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
        }}
      >
        <Segmented
          value={tab}
          onChange={(v) => setTab(v as TabKey)}
          options={[
            { label: `Consonants (${CONSONANTS.length})`, value: "consonants" },
            { label: `Vowels (${VOWELS.length})`, value: "vowels" },
          ]}
        />

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>Accent:</span>
          <Segmented
            size="small"
            value={accent}
            onChange={(v) => setAccent(v as TtsAccent)}
            options={[
              { label: "🇺🇸 US", value: "us" },
              { label: "🇬🇧 UK", value: "uk" },
            ]}
          />
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          padding: "10px 24px",
          background: "color-mix(in srgb, var(--accent) 3%, var(--surface))",
          borderBottom: "1px solid var(--border)",
          fontSize: 11,
          color: "var(--text-secondary)",
        }}
      >
        {tab === "consonants" ? (
          <>
            <Tag color="success" style={{ fontSize: 11 }}>● Voiced</Tag>
            <Tag color="warning" style={{ fontSize: 11 }}>● Voiceless</Tag>
            <span>Nhấn vào thẻ hoặc nút US/UK để nghe phát âm</span>
          </>
        ) : (
          <>
            <Tag color="blue" style={{ fontSize: 11 }}>● Short</Tag>
            <Tag color="cyan" style={{ fontSize: 11 }}>● Long</Tag>
            <Tag color="purple" style={{ fontSize: 11 }}>● Diphthong</Tag>
            <span>Nhấn vào thẻ hoặc nút US/UK để nghe phát âm</span>
          </>
        )}
      </div>

      {/* Chart Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          {tab === "consonants" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {Object.entries(CONSONANT_SUBTYPE_LABELS).map(([key, label]) => {
                const items = consonantGroups[key];
                if (!items?.length) return null;
                return (
                  <section key={key}>
                    <h3
                      style={{
                        margin: "0 0 12px",
                        fontSize: 15,
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          width: 4,
                          height: 18,
                          borderRadius: 2,
                          background: "var(--accent)",
                          flexShrink: 0,
                        }}
                      />
                      {label}
                      <Tag style={{ fontSize: 10, fontWeight: 500 }}>{items.length} sounds</Tag>
                    </h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                        gap: 12,
                      }}
                    >
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
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {Object.entries(VOWEL_SUBTYPE_LABELS).map(([key, label]) => {
                const items = vowelGroups[key];
                if (!items?.length) return null;
                return (
                  <section key={key}>
                    <h3
                      style={{
                        margin: "0 0 12px",
                        fontSize: 15,
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          width: 4,
                          height: 18,
                          borderRadius: 2,
                          background: key === "diphthong" ? "var(--tertiary)" : key === "monophthong-long" ? "var(--info)" : "var(--accent)",
                          flexShrink: 0,
                        }}
                      />
                      {label}
                      <Tag style={{ fontSize: 10, fontWeight: 500 }}>{items.length} sounds</Tag>
                    </h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                        gap: 12,
                      }}
                    >
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

      {/* CSS for hover */}
      <style>{`
        .ipa-card:hover {
          border-color: var(--accent) !important;
          box-shadow: 0 4px 16px color-mix(in srgb, var(--accent) 15%, transparent);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
