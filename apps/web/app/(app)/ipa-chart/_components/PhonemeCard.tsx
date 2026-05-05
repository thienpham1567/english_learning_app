"use client";

import { SoundOutlined, LoadingOutlined } from "@ant-design/icons";
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

  // Highlight the example word
  const idx = exampleWord.toLowerCase().indexOf(exampleHighlight.toLowerCase());
  const before = idx > 0 ? exampleWord.slice(0, idx) : "";
  const match = idx >= 0 ? exampleWord.slice(idx, idx + exampleHighlight.length) : exampleWord;
  const after = idx >= 0 ? exampleWord.slice(idx + exampleHighlight.length) : "";

  const isVowel = phoneme.type === "vowel";
  const isDiphthong = subtype === "diphthong";
  const isLong = subtype === "monophthong-long";

  // Color coding
  const accentColor = isVowel
    ? isDiphthong
      ? "var(--tertiary)"
      : isLong
        ? "var(--info)"
        : "var(--accent)"
    : voiced
      ? "var(--success)"
      : "var(--warning)";

  const accentBg = isVowel
    ? isDiphthong
      ? "color-mix(in srgb, var(--tertiary) 8%, var(--surface))"
      : isLong
        ? "color-mix(in srgb, var(--info) 8%, var(--surface))"
        : "color-mix(in srgb, var(--accent) 8%, var(--surface))"
    : voiced
      ? "color-mix(in srgb, var(--success) 8%, var(--surface))"
      : "color-mix(in srgb, var(--warning) 8%, var(--surface))";

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        padding: "20px 12px 16px",
        borderRadius: 16,
        border: `1px solid var(--border)`,
        background: "var(--card-bg)",
        cursor: "pointer",
        transition: "all 0.2s ease",
        overflow: "hidden",
      }}
      className="ipa-card"
      onClick={() => onSpeak(exampleWord, accent)}
    >
      {/* Top accent strip */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: accentColor,
          opacity: 0.6,
        }}
      />

      {/* IPA Symbol */}
      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          fontFamily: "'Noto Sans', 'Segoe UI', system-ui, sans-serif",
          color: accentColor,
          lineHeight: 1,
        }}
      >
        /{symbol}/
      </div>

      {/* Example word */}
      <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.3 }}>
        {before}
        <span style={{ color: accentColor, fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3 }}>
          {match}
        </span>
        {after}
      </div>

      {/* Tip */}
      <Tooltip title={tip} placement="bottom">
        <div
          style={{
            fontSize: 11,
            color: "var(--text-secondary)",
            textAlign: "center",
            lineHeight: 1.3,
            maxHeight: 28,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {tip}
        </div>
      </Tooltip>

      {/* Accent play buttons */}
      <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSpeak(exampleWord, "us");
          }}
          disabled={isBusy}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 10px",
            borderRadius: 6,
            border: `1px solid ${accent === "us" ? accentColor : "var(--border)"}`,
            background: accent === "us" ? accentBg : "transparent",
            color: accent === "us" ? accentColor : "var(--text-secondary)",
            cursor: isBusy ? "not-allowed" : "pointer",
            fontSize: 11,
            fontWeight: 500,
            opacity: isBusy ? 0.5 : 1,
            transition: "all 0.15s ease",
          }}
          aria-label={`Play ${exampleWord} US accent`}
        >
          {isBusy ? <LoadingOutlined spin style={{ fontSize: 10 }} /> : <SoundOutlined style={{ fontSize: 10 }} />}
          US
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSpeak(exampleWord, "uk");
          }}
          disabled={isBusy}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 10px",
            borderRadius: 6,
            border: `1px solid ${accent === "uk" ? accentColor : "var(--border)"}`,
            background: accent === "uk" ? accentBg : "transparent",
            color: accent === "uk" ? accentColor : "var(--text-secondary)",
            cursor: isBusy ? "not-allowed" : "pointer",
            fontSize: 11,
            fontWeight: 500,
            opacity: isBusy ? 0.5 : 1,
            transition: "all 0.15s ease",
          }}
          aria-label={`Play ${exampleWord} UK accent`}
        >
          {isBusy ? <LoadingOutlined spin style={{ fontSize: 10 }} /> : <SoundOutlined style={{ fontSize: 10 }} />}
          UK
        </button>
      </div>
    </div>
  );
}
