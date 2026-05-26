"use client";

import { useState } from "react";

import { Tooltip } from "antd";
import type { IpaPhoneme } from "../_data/phonemes";
import type { TtsAccent } from "@/hooks/useTextToSpeech";
import * as m from "motion/react-client";
import { Loader2, Volume2 } from "lucide-react";

type Props = {
  phoneme: IpaPhoneme;
  accent: TtsAccent;
  onSpeak: (text: string, accent: TtsAccent) => void;
  isBusy: boolean;
  index: number;
};

export function PhonemeCard({ phoneme, accent, onSpeak, isBusy, index }: Props) {
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
    ? isDiphthong ? "nguyên âm đôi" : isLong ? "âm dài" : "âm ngắn"
    : voiced ? "hữu thanh" : "vô thanh";

  const handleClick = (selectedAccent: TtsAccent, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isBusy) return;
    onSpeak(exampleWord, selectedAccent);
    setPulsing(true);
    setTimeout(() => setPulsing(false), 500);
  };

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.4), type: "spring", stiffness: 200, damping: 18 }}
      whileHover={{
        scale: 1.03,
        y: -3,
        borderColor: accentColor,
        boxShadow: `0 8px 24px color-mix(in srgb, ${accentColor} 12%, transparent)`,
      }}
      whileTap={{ scale: 0.98 }}
      onClick={() => handleClick(accent)}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        borderRadius: "var(--radius-xl)",
        border: "1.5px solid var(--border)",
        background: "var(--surface)",
        cursor: isBusy ? "wait" : "pointer",
        overflow: "hidden",
        userSelect: "none",
        padding: "16px 12px 14px",
      }}
    >
      {/* Accent color bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: accentColor,
        }}
      />

      {/* Voice Type indicator */}
      <span
        style={{
          fontSize: 9,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          padding: "2px 6px",
          borderRadius: 6,
          background: `color-mix(in srgb, ${accentColor} 8%, transparent)`,
          color: accentColor,
          marginBottom: 10,
          alignSelf: "flex-end",
        }}
      >
        {typeLabel}
      </span>

      {/* Phoneme Symbol */}
      <m.div
        animate={pulsing ? { scale: [1, 1.15, 1], rotate: [0, 2, -2, 0] } : {}}
        transition={{ duration: 0.4 }}
        style={{
          fontSize: 34,
          fontWeight: 900,
          fontFamily: "var(--font-mono)",
          color: accentColor,
          lineHeight: 1,
          textAlign: "center",
          marginBottom: 6,
        }}
      >
        /{symbol}/
      </m.div>

      {/* Highlighted keyword */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: 8,
        }}
      >
        {before}
        <span
          style={{
            color: accentColor,
            borderBottom: `2px solid ${accentColor}`,
            paddingBottom: 1,
            fontWeight: 800,
          }}
        >
          {match}
        </span>
        {after}
      </div>

      {/* Helper description / tip */}
      <Tooltip title={tip} placement="bottom" mouseEnterDelay={0.3}>
        <p
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            textAlign: "center",
            lineHeight: 1.4,
            margin: "0 0 12px",
            minHeight: 30,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            fontWeight: 500,
          }}
        >
          {tip}
        </p>
      </Tooltip>

      {/* Play Accent triggers */}
      <div
        style={{
          display: "flex",
          gap: 6,
          width: "100%",
          justifyContent: "center",
          marginTop: "auto",
        }}
      >
        {(["us", "uk"] as TtsAccent[]).map((voiceAcc) => {
          const isActive = accent === voiceAcc;
          return (
            <m.button
              key={voiceAcc}
              onClick={(e) => handleClick(voiceAcc, e)}
              disabled={isBusy}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                flex: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                padding: "5px 0",
                borderRadius: 8,
                border: `1.5px solid ${isActive ? accentColor : "var(--border)"}`,
                background: isActive
                  ? `color-mix(in srgb, ${accentColor} 8%, var(--surface))`
                  : "var(--surface-alt)",
                color: isActive ? accentColor : "var(--text-secondary)",
                cursor: isBusy ? "wait" : "pointer",
                fontSize: 10.5,
                fontWeight: 700,
                transition: "border-color 0.15s, background 0.15s, color 0.15s",
              }}
            >
              {isBusy && accent === voiceAcc ? (
                <Loader2 className="animate-spin" size={9} />
              ) : (
                <Volume2 size={10} />
              )}
              {voiceAcc.toUpperCase()}
            </m.button>
          );
        })}
      </div>
    </m.div>
  );
}
