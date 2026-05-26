"use client";

import { Flex, Typography, Tooltip } from "antd";

import * as m from "motion/react-client";
import { VOICES, type VoiceOption } from "../_data/voices";
import { Info, User } from "lucide-react";

const { Text } = Typography;

interface VoiceSelectorProps {
  selectedRole: string;
  onSelectRole: (role: string) => void;
}

export function VoiceSelector({ selectedRole, onSelectRole }: VoiceSelectorProps) {
  return (
    <m.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="read-aloud-panel bg-(--surface) rounded-(--radius-xl) border-2 border-border flex flex-col" style={{padding: "var(--space-5)", boxShadow: "var(--shadow-md)", gap: "var(--space-4)"}} >
      <Text className="text-xs font-bold text-text-muted uppercase tracking-widest block" >
        🗣️ Chọn giọng đọc
      </Text>

      <div className="voice-grid">
        {VOICES.map((v) => (
          <VoiceCard key={v.role} voice={v} isActive={selectedRole === v.role} onSelect={() => onSelectRole(v.role)} />
        ))}
      </div>
    </m.div>
  );
}

function VoiceCard({ voice: v, isActive, onSelect }: { voice: VoiceOption; isActive: boolean; onSelect: () => void }) {
  return (
    <m.button
      whileHover={{ scale: 1.02, x: 2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect} className="relative flex items-center gap-3 rounded-(--radius-lg) cursor-pointer text-left" style={{padding: "12px 14px", border: isActive ? "2px solid var(--accent)" : "1px solid var(--border)", background: isActive ? "var(--accent-light)" : "var(--surface-alt)", transition: "all 0.25s ease"}} >
      <img
          src={v.avatar}
          alt={v.name}
          width={36}
          height={36} className="shrink-0" style={{borderRadius: 10, objectFit: "cover"}} />
      <div className="flex-1 w-[0px]" >
        <Flex align="center" gap={6}>
          <Text className="text-sm" style={{fontWeight: isActive ? 800 : 700, color: isActive ? "var(--accent)" : "var(--text-primary)"}} >
            {v.name}
          </Text>
          <span className="text-[13px]" >{v.flag}</span>
          <span className="text-[10px] rounded-lg font-bold items-center" style={{background: v.gender === "m" ? "rgba(59, 130, 246, 0.15)" : "rgba(236, 72, 153, 0.15)", color: v.gender === "m" ? "var(--info)" : "#db2777", padding: "1px 6px", display: "inline-flex", gap: 2}} >
            {v.gender === "m" ? <User /> : <User />}
            {v.gender === "m" ? "Nam" : "Nữ"}
          </span>
        </Flex>
        <Text className="text-[11px] block overflow-hidden" style={{color: isActive ? "var(--accent)" : "var(--text-muted)", marginTop: 2, whiteSpace: "nowrap", textOverflow: "ellipsis"}} >
          Giọng {v.accentLabel} • {v.label}
        </Text>
      </div>

      <Tooltip title={v.description} placement="left">
        <Info
          
          onClick={(e) => e.stopPropagation()} className="text-sm text-text-muted" style={{opacity: 0.6, cursor: "help"}} />
      </Tooltip>

      {isActive && (
        <m.div
          layoutId="selected-indicator" className="absolute w-[3px]" style={{right: 0, top: "30%", bottom: "30%", background: "var(--accent)", borderRadius: "4px 0 0 4px"}} />
      )}
    </m.button>
  );
}
