"use client";

import { useState } from "react";
import { LoadingOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import type { IpaPhoneme } from "../_data/phonemes";
import type { TtsAccent } from "@/hooks/useTextToSpeech";

type Props = {
  phoneme: IpaPhoneme;
  accent: TtsAccent;
  onSpeak: (text: string, accent: TtsAccent) => void;
  isBusy: boolean;
};

export function PhonemeCard({ phoneme, accent, onSpeak, isBusy }: Props) {
  const { symbol, exampleWord, exampleHighlight, tip, voiced, subtype } = phoneme;
  const [pulsing, setPulsing] = useState(false);

  const idx = exampleWord.toLowerCase().indexOf(exampleHighlight.toLowerCase());
  const before = idx > 0 ? exampleWord.slice(0, idx) : "";
  const match = idx >= 0 ? exampleWord.slice(idx, idx + exampleHighlight.length) : exampleWord;
  const after = idx >= 0 ? exampleWord.slice(idx + exampleHighlight.length) : "";

  const isVowel = phoneme.type === "vowel";
  const isDiphthong = subtype === "diphthong";
  const isLong = subtype === "monophthong-long";

  const accentColor = isVowel
    ? isDiphthong ? "var(--tertiary, #8B5CF6)" : isLong ? "var(--info)" : "var(--accent)"
    : voiced ? "var(--success)" : "var(--warning)";

  const typeLabel = isVowel
    ? isDiphthong ? "diphthong" : isLong ? "long" : "short"
    : voiced ? "voiced" : "voiceless";

  const handleClick = (selectedAccent: TtsAccent, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isBusy) return;
    onSpeak(exampleWord, selectedAccent);
    setPulsing(true);
    setTimeout(() => setPulsing(false), 600);
  };

  return (
    <div
      className="ipa-card"
      onClick={() => handleClick(accent)}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        borderRadius: 14,
        border: "1px solid var(--border)",
        background: "var(--surface)",
        cursor: isBusy ? "wait" : "pointer",
        transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {/* Subtle colored top bar */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: 2,
        background: accentColor,
        opacity: 0.5,
      }} />

      {/* Type badge — top right */}
      <div style={{
        position: "absolute",
        top: 8,
        right: 8,
        fontSize: 9,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        padding: "2px 6px",
        borderRadius: 99,
        background: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
        color: accentColor,
        lineHeight: 1.4,
      }}>
        {typeLabel}
      </div>

      {/* IPA Symbol — hero */}
      <div style={{
        paddingTop: 22,
        paddingBottom: 6,
        fontSize: 38,
        fontWeight: 700,
        fontFamily: "'Noto Serif', 'Noto Sans', Georgia, 'Times New Roman', serif",
        color: accentColor,
        lineHeight: 1,
        letterSpacing: "-0.01em",
        textAlign: "center",
        animation: pulsing ? "ipaCardPulse 0.5s ease-out" : "none",
        transition: "color 0.15s",
      }}>
        /{symbol}/
      </div>

      {/* Example word */}
      <div style={{
        fontSize: 13,
        fontWeight: 500,
        lineHeight: 1,
        marginBottom: 6,
        color: "var(--text-primary)",
        letterSpacing: "0.01em",
      }}>
        {before}
        <span style={{
          color: accentColor,
          fontWeight: 700,
          borderBottom: `1.5px solid ${accentColor}`,
          paddingBottom: 1,
        }}>
          {match}
        </span>
        {after}
      </div>

      {/* Tip */}
      <Tooltip title={tip} placement="bottom">
        <div style={{
          fontSize: 10.5,
          color: "var(--text-muted)",
          textAlign: "center",
          lineHeight: 1.35,
          padding: "0 10px",
          minHeight: 28,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {tip}
        </div>
      </Tooltip>

      {/* Play buttons */}
      <div style={{
        display: "flex",
        gap: 5,
        padding: "10px 10px 12px",
        width: "100%",
        justifyContent: "center",
      }}>
        {(["us", "uk"] as TtsAccent[]).map((a) => (
          <button
            key={a}
            onClick={(e) => handleClick(a, e)}
            disabled={isBusy}
            aria-label={`Play ${exampleWord} ${a.toUpperCase()}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              padding: "4px 10px",
              borderRadius: 7,
              border: `1px solid ${accent === a ? accentColor : "var(--border)"}`,
              background: accent === a
                ? `color-mix(in srgb, ${accentColor} 10%, var(--surface))`
                : "transparent",
              color: accent === a ? accentColor : "var(--text-muted)",
              cursor: isBusy ? "wait" : "pointer",
              fontSize: 11,
              fontWeight: 600,
              opacity: isBusy ? 0.45 : 1,
              transition: "all 0.15s ease",
              letterSpacing: "0.02em",
            }}
          >
            {isBusy
              ? <LoadingOutlined spin style={{ fontSize: 9 }} />
              : <span style={{ fontSize: 9 }}>▶</span>
            }
            {a.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
