"use client";

import { Info, User, Volume2, Zap, Cpu } from "lucide-react";
import * as m from "motion/react-client";
import {
  GROQ_VOICES,
  KOKORO_VOICES,
  type TtsProvider,
  type VoiceOption,
} from "../_data/voices";

interface VoiceSelectorProps {
  selectedRole: string;
  onSelectRole: (role: string) => void;
  provider: TtsProvider;
  onProviderChange: (provider: TtsProvider) => void;
}

const PROVIDERS: { key: TtsProvider; label: string; icon: typeof Zap; desc: string; color: string }[] = [
  { key: "groq", label: "Groq Orpheus", icon: Zap, desc: "Cloud · Fast · 6 voices", color: "text-[#f77f00]" },
  { key: "kokoro", label: "Kokoro", icon: Cpu, desc: "Unlimited · 4 voices", color: "text-[#4ade80]" },
];

export function VoiceSelector({
  selectedRole,
  onSelectRole,
  provider,
  onProviderChange,
}: VoiceSelectorProps) {
  const voices = provider === "groq" ? GROQ_VOICES : KOKORO_VOICES;

  return (
    <m.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="read-aloud-panel bg-surface rounded-2xl border-2 border-border flex flex-col p-5 gap-3.5 shadow-sm"
    >
      <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest flex items-center gap-2 font-display">
        <m.span
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
          className="inline-flex text-accent"
        >
          <Volume2 size={13} />
        </m.span>
        TTS Engine & Voice
      </span>

      {/* ── Provider Toggle ── */}
      <div className="flex gap-1.5 bg-surface-alt rounded-xl p-1 border border-border">
        {PROVIDERS.map((p) => {
          const isActive = provider === p.key;
          return (
            <m.button
              key={p.key}
              whileTap={{ scale: 0.97 }}
              onClick={() => onProviderChange(p.key)}
              className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
                isActive
                  ? "bg-accent text-text-on-accent shadow-sm"
                  : "bg-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              <p.icon size={14} className={isActive ? "" : p.color} />
              <div className="text-left min-w-0">
                <div className={`text-[11px] ${isActive ? "font-extrabold" : "font-bold"}`}>
                  {p.label}
                </div>
                <div className={`text-[9px] ${isActive ? "opacity-70" : "opacity-50"}`}>
                  {p.desc}
                </div>
              </div>
            </m.button>
          );
        })}
      </div>

      {/* ── Voice List (filtered by provider) ── */}
      <div className="flex flex-col gap-2">
        {voices.map((v) => (
          <VoiceCard
            key={v.role}
            voice={v}
            isActive={selectedRole === v.role}
            onSelect={() => onSelectRole(v.role)}
          />
        ))}
      </div>
    </m.div>
  );
}

function VoiceCard({
  voice: v,
  isActive,
  onSelect,
}: {
  voice: VoiceOption;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <m.button
      whileHover={{ scale: 1.01, x: 2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`relative flex items-center gap-3 rounded-xl cursor-pointer text-left py-3 px-3.5 transition-all duration-200 ${
        isActive
          ? "border-2 border-accent bg-accent-light shadow-sm"
          : "border-2 border-border bg-surface-alt hover:border-accent/30"
      }`}
    >
      <img
        src={v.avatar}
        alt={v.name}
        width={40}
        height={40}
        className="shrink-0 rounded-xl object-cover border-2 border-border"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[13px] ${
              isActive ? "font-extrabold text-ink" : "font-bold text-text-primary"
            }`}
          >
            {v.name}
          </span>
          <span className="text-[13px]">{v.flag}</span>
          <span
            className={`text-[9.5px] rounded-md font-extrabold inline-flex items-center gap-0.5 py-0.5 px-1.5 border ${
              v.gender === "m"
                ? "bg-info/10 text-info border-info/20"
                : "bg-fire/10 text-fire border-fire/20"
            }`}
          >
            <User size={9} />
            {v.gender === "m" ? "Male" : "Female"}
          </span>
        </div>
        <span
          className={`text-[11px] block overflow-hidden whitespace-nowrap text-ellipsis mt-0.5 ${
            isActive ? "text-text-secondary font-semibold" : "text-text-muted"
          }`}
        >
          {v.accentLabel} • {v.voiceId}
        </span>
      </div>

      <span
        className="text-text-muted opacity-50 cursor-help hover:opacity-80 transition-opacity"
        title={v.description}
      >
        <Info size={14} onClick={(e) => e.stopPropagation()} />
      </span>

      {isActive && (
        <m.div
          layoutId="selected-voice-indicator"
          className="absolute w-[3px] right-0 top-[25%] bottom-[25%] bg-accent rounded-l-full"
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        />
      )}
    </m.button>
  );
}
