"use client";

import { Info, User, Volume2 } from "lucide-react";
import * as m from "motion/react-client";
import { VOICES, type VoiceOption } from "../_data/voices";

interface VoiceSelectorProps {
  selectedRole: string;
  onSelectRole: (role: string) => void;
}

export function VoiceSelector({ selectedRole, onSelectRole }: VoiceSelectorProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="read-aloud-panel bg-surface rounded-xl border-2 border-border flex flex-col p-5 gap-4 shadow-md"
    >
      <span className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
        <m.span
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
          className="inline-flex text-accent"
        >
          <Volume2 size={13} />
        </m.span>
        Select Voice
      </span>

      <div className="voice-grid">
        {VOICES.map((v) => (
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
      whileHover={{ scale: 1.02, x: 2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`relative flex items-center gap-3 rounded-lg cursor-pointer text-left py-3 px-3.5 transition-all duration-250 ${
        isActive
          ? "border-2 border-accent bg-accent-light"
          : "border border-border bg-surface-alt"
      }`}
    >
      <img
        src={v.avatar}
        alt={v.name}
        width={36}
        height={36}
        className="shrink-0 rounded-[10px] object-cover"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-sm ${
              isActive ? "font-extrabold text-accent" : "font-bold text-text-primary"
            }`}
          >
            {v.name}
          </span>
          <span className="text-[13px]">{v.flag}</span>
          <span
            className="text-[10px] rounded-lg font-bold inline-flex items-center gap-0.5 py-px px-1.5"
            style={{
              background:
                v.gender === "m" ? "rgba(59, 130, 246, 0.15)" : "rgba(236, 72, 153, 0.15)",
              color: v.gender === "m" ? "var(--info)" : "#db2777",
            }}
          >
            <User size={10} />
            {v.gender === "m" ? "Male" : "Female"}
          </span>
        </div>
        <span
          className={`text-[11px] block overflow-hidden whitespace-nowrap text-ellipsis mt-0.5 ${
            isActive ? "text-accent" : "text-text-muted"
          }`}
        >
          {v.accentLabel} • {v.label}
        </span>
      </div>

      <span className="text-sm text-text-muted opacity-60 cursor-help" title={v.description}>
        <Info size={14} onClick={(e) => e.stopPropagation()} />
      </span>

      {isActive && (
        <m.div
          layoutId="selected-indicator"
          className="absolute w-[3px] right-0 top-[30%] bottom-[30%] bg-accent rounded-l"
        />
      )}
    </m.button>
  );
}
