"use client";

import { Info, Mic, User, Volume2, Zap } from "lucide-react";
import * as m from "motion/react-client";
import { getVoicesByProvider, type TtsProvider, type VoiceOption } from "../_data/voices";

interface VoiceSelectorProps {
  selectedRole: string;
  onSelectRole: (role: string) => void;
  provider: TtsProvider;
  onProviderChange: (provider: TtsProvider) => void;
}

const PROVIDERS: { key: TtsProvider; label: string; icon: typeof Zap; color: string }[] = [
  { key: "groq", label: "Groq", icon: Zap, color: "text-success" },
  { key: "elevenlabs", label: "ElevenLabs", icon: Mic, color: "text-accent" },
];

export function VoiceSelector({
  selectedRole,
  onSelectRole,
  provider,
  onProviderChange,
}: VoiceSelectorProps) {
  const voices = getVoicesByProvider(provider);

  return (
    <m.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="read-aloud-panel bg-surface border-2 border-border flex flex-col p-5 gap-3.5 shadow-[4px_4px_0_var(--shadow-color)]"
    >
      <span className="text-[11px] font-bold text-text-muted uppercase tracking-[0.18em] flex items-center gap-1.5 font-mono">
        <span className="text-accent">◆</span>
        Chọn giọng đọc
      </span>

      {/* ── Provider Toggle ── */}
      <div className="flex gap-1 bg-bg-deep p-1 border-2 border-border">
        {PROVIDERS.map((p) => {
          const isActive = provider === p.key;
          return (
            <m.button
              key={p.key}
              whileTap={{ scale: 0.97 }}
              onClick={() => onProviderChange(p.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 font-mono text-[11px] font-black uppercase tracking-wide cursor-pointer transition-all duration-150 border-2 ${
                isActive
                  ? "bg-surface border-border shadow-[2px_2px_0_var(--shadow-color)] text-ink"
                  : "bg-transparent border-transparent text-text-muted hover:text-text-secondary"
              }`}
            >
              <p.icon size={13} className={isActive ? p.color : ""} />
              {p.label}
              {p.key === "elevenlabs" && (
                <span className="text-[8px] font-black bg-accent text-text-on-accent border border-border px-1 py-0.5">
                  HD
                </span>
              )}
            </m.button>
          );
        })}
      </div>

      {/* ── Voice List ── */}
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

      {/* ── Provider Info ── */}
      {provider === "elevenlabs" && (
        <m.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="font-mono text-[10px] text-text-muted bg-accent-light px-3 py-2 border-2 border-border"
        >
          🎙 ElevenLabs — giọng chất lượng cao. Gói free: 10,000 ký tự/tháng.
        </m.div>
      )}
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
      whileHover={{ x: -1, y: -1 }}
      whileTap={{ x: 0, y: 0 }}
      onClick={onSelect}
      className={`relative flex items-center gap-3 cursor-pointer text-left transition-all duration-150 py-3 px-3.5 border-2 border-border ${
        isActive
          ? "bg-accent-light shadow-[3px_3px_0_var(--shadow-color)]"
          : "bg-surface-alt shadow-[2px_2px_0_var(--shadow-color)] hover:shadow-[3px_3px_0_var(--shadow-color)]"
      }`}
    >
      <img
        src={v.avatar}
        alt={v.name}
        width={40}
        height={40}
        className="shrink-0 object-cover border-2 border-border"
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
            className={`text-[9px] font-black inline-flex items-center gap-0.5 py-0.5 px-1.5 border-2 ${
              v.gender === "m"
                ? "bg-info/10 text-info border-info/30"
                : "bg-fire/10 text-fire border-fire/30"
            }`}
          >
            <User size={8} />
            {v.gender === "m" ? "M" : "F"}
          </span>
        </div>
        <span
          className={`text-[11px] block overflow-hidden whitespace-nowrap text-ellipsis mt-0.5 ${
            isActive ? "text-text-secondary font-semibold" : "text-text-muted"
          }`}
        >
          {v.accentLabel} • {v.name}
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
          className="absolute w-[4px] right-0 top-[20%] bottom-[20%] bg-accent"
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        />
      )}
    </m.button>
  );
}
