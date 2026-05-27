"use client";

import { Tooltip } from "antd";
import { Loader2, Volume2 } from "lucide-react";
import * as m from "motion/react-client";
import { useState } from "react";
import type { TtsAccent } from "@/hooks/useTextToSpeech";
import type { IpaPhoneme } from "../_data/phonemes";

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
    ? isDiphthong
      ? "var(--tertiary, #8B5CF6)"
      : isLong
        ? "var(--info)"
        : "var(--accent)"
    : voiced
      ? "var(--success)"
      : "var(--warning)";

  const typeLabel = isVowel
    ? isDiphthong
      ? "diphthong"
      : isLong
        ? "long vowel"
        : "short vowel"
    : voiced
      ? "voiced"
      : "voiceless";

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
      transition={{
        delay: Math.min(index * 0.02, 0.4),
        type: "spring",
        stiffness: 200,
        damping: 18,
      }}
      whileHover={{
        scale: 1.03,
        y: -3,
        borderColor: accentColor,
        boxShadow: `0 8px 24px color-mix(in srgb, ${accentColor} 12%, transparent)`,
      }}
      whileTap={{ scale: 0.98 }}
      onClick={() => handleClick(accent)}
      className="relative flex flex-col items-center rounded-(--radius-xl) bg-(--surface) overflow-hidden"
      style={{
        border: "1.5px solid var(--border)",
        cursor: isBusy ? "wait" : "pointer",
        userSelect: "none",
        padding: "16px 12px 14px",
      }}
    >
      {/* Accent color bar */}
      <div
        className="absolute h-[3px]"
        style={{ top: 0, left: 0, right: 0, background: accentColor }}
      />

      {/* Voice Type indicator */}
      <span
        className="text-[9px] font-extrabold uppercase rounded-md mb-2.5"
        style={{
          letterSpacing: "0.06em",
          padding: "2px 6px",
          background: `color-mix(in srgb, ${accentColor} 8%, transparent)`,
          color: accentColor,
          alignSelf: "flex-end",
        }}
      >
        {typeLabel}
      </span>

      {/* Phoneme Symbol */}
      <m.div
        animate={pulsing ? { scale: [1, 1.15, 1], rotate: [0, 2, -2, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="font-black font-mono leading-none text-center mb-1.5"
        style={{ fontSize: 34, color: accentColor }}
      >
        /{symbol}/
      </m.div>

      {/* Highlighted keyword */}
      <div className="text-[13px] font-bold text-text-primary mb-2">
        {before}
        <span
          className="font-extrabold"
          style={{ color: accentColor, borderBottom: `2px solid ${accentColor}`, paddingBottom: 1 }}
        >
          {match}
        </span>
        {after}
      </div>

      {/* Helper description / tip */}
      <Tooltip title={tip} placement="bottom" mouseEnterDelay={0.3}>
        <p
          className="text-[11px] text-text-muted text-center mb-3 h-[30px] overflow-hidden font-medium"
          style={{
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {tip}
        </p>
      </Tooltip>

      {/* Play Accent triggers */}
      <div className="flex gap-1.5 w-full justify-center" style={{ marginTop: "auto" }}>
        {(["us", "uk"] as TtsAccent[]).map((voiceAcc) => {
          const isActive = accent === voiceAcc;
          return (
            <m.button
              key={voiceAcc}
              onClick={(e) => handleClick(voiceAcc, e)}
              disabled={isBusy}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-1 items-center justify-center gap-1 rounded-lg text-[10.5px] font-bold"
              style={{
                display: "inline-flex",
                padding: "5px 0",
                border: `1.5px solid ${isActive ? accentColor : "var(--border)"}`,
                background: isActive
                  ? `color-mix(in srgb, ${accentColor} 8%, var(--surface))`
                  : "var(--surface-alt)",
                color: isActive ? accentColor : "var(--text-secondary)",
                cursor: isBusy ? "wait" : "pointer",
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
