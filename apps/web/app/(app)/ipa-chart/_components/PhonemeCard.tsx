"use client";

import { Loader2, Volume2 } from "lucide-react";
import * as m from "motion/react-client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
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
      ? "var(--tertiary)"
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
      initial={{ opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        delay: Math.min(index * 0.02, 0.4),
        type: "spring",
        stiffness: 220,
        damping: 20,
      }}
      whileTap={{ scale: 0.97 }}
      onClick={() => handleClick(accent)}
    >
      <Card
        interactive
        shadowSize="sm"
        className={`relative flex flex-col items-center overflow-hidden select-none pt-5 pb-3.5 px-3 group ${isBusy ? "cursor-wait" : "cursor-pointer"}`}
      >
        {/* Top accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-[3px] transition-all duration-200 group-hover:h-1.5"
          style={{ background: accentColor }}
        />

        {/* Type label badge */}
        <span
          className="text-[8.5px] font-black uppercase tracking-wider rounded-lg mb-3 self-end py-0.5 px-2 border-2"
          style={{
            background: `color-mix(in srgb, ${accentColor} 8%, transparent)`,
            color: accentColor,
            borderColor: `color-mix(in srgb, ${accentColor} 20%, var(--border))`,
          }}
        >
          {typeLabel}
        </span>

        {/* Phoneme Symbol */}
        <m.div
          animate={pulsing ? { scale: [1, 1.18, 1], rotate: [0, 2, -2, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="font-black font-mono leading-none text-center text-[36px] mb-1.5"
          style={{ color: accentColor }}
        >
          /{symbol}/
        </m.div>

        {/* Example word with highlight */}
        <div className="text-[13px] font-bold text-text-primary mb-2">
          {before}
          <span
            className="font-extrabold border-b-2 pb-px"
            style={{ color: accentColor, borderColor: accentColor }}
          >
            {match}
          </span>
          {after}
        </div>

        {/* Tip */}
        <p
          className="text-[10.5px] text-text-muted text-center mb-3.5 h-[28px] overflow-hidden font-medium leading-snug line-clamp-2"
          title={tip}
        >
          {tip}
        </p>

        {/* Accent play buttons */}
        <div className="flex gap-1.5 w-full justify-center mt-auto">
          {(["us", "uk"] as TtsAccent[]).map((voiceAcc) => {
            const isActive = accent === voiceAcc;
            return (
              <m.button
                key={voiceAcc}
                onClick={(e) => handleClick(voiceAcc, e)}
                disabled={isBusy}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                className={`flex-1 inline-flex items-center justify-center gap-1 rounded-xl text-[10px] font-extrabold border-2 py-1.5 transition-all duration-100 ${isBusy ? "cursor-wait" : "cursor-pointer"} ${
                  isActive
                    ? "border-border text-ink font-black shadow-sm"
                    : "border-border bg-surface-alt text-text-secondary hover:bg-surface-hover"
                }`}
                style={
                  isActive
                    ? {
                        background: `color-mix(in srgb, ${accentColor} 12%, var(--surface))`,
                      }
                    : undefined
                }
              >
                {isBusy && accent === voiceAcc ? (
                  <Loader2 className="animate-spin" size={9} />
                ) : (
                  <Volume2
                    size={10}
                    style={{ color: isActive ? accentColor : "var(--text-muted)" }}
                  />
                )}
                {voiceAcc.toUpperCase()}
              </m.button>
            );
          })}
        </div>
      </Card>
    </m.div>
  );
}
