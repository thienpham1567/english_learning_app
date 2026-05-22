"use client";

import { Flex, Typography, Tooltip } from "antd";
import { ManOutlined, WomanOutlined, InfoCircleOutlined } from "@ant-design/icons";
import * as m from "motion/react-client";
import { VOICES, type VoiceOption } from "../_data/voices";

const { Text } = Typography;

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
      style={{
        background: "var(--surface)",
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--border)",
        padding: "var(--space-5)",
        boxShadow: "var(--shadow-md)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block" }}>
        🗣️ Chọn giọng đọc
      </Text>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
      onClick={onSelect}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        borderRadius: "var(--radius-lg)",
        border: isActive ? "2px solid var(--accent)" : "1px solid var(--border)",
        background: isActive ? "var(--accent-light)" : "var(--surface-alt)",
        cursor: "pointer",
        transition: "all 0.25s ease",
        textAlign: "left",
      }}
    >
      <span style={{ fontSize: 24, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }}>
        {v.flag}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Flex align="center" gap={6}>
          <Text style={{ fontWeight: isActive ? 800 : 700, fontSize: 14, color: isActive ? "var(--accent)" : "var(--text-primary)" }}>
            {v.name}
          </Text>
          <span
            style={{
              fontSize: 10,
              background: v.gender === "m" ? "rgba(59, 130, 246, 0.15)" : "rgba(236, 72, 153, 0.15)",
              color: v.gender === "m" ? "var(--info)" : "#db2777",
              padding: "1px 6px",
              borderRadius: 8,
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            {v.gender === "m" ? <ManOutlined /> : <WomanOutlined />}
            {v.gender === "m" ? "Nam" : "Nữ"}
          </span>
        </Flex>
        <Text
          style={{
            fontSize: 11,
            color: isActive ? "var(--accent)" : "var(--text-muted)",
            display: "block",
            marginTop: 2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          Giọng {v.accentLabel} • {v.label}
        </Text>
      </div>

      <Tooltip title={v.description} placement="left">
        <InfoCircleOutlined
          style={{ fontSize: 14, color: "var(--text-muted)", opacity: 0.6, cursor: "help" }}
          onClick={(e) => e.stopPropagation()}
        />
      </Tooltip>

      {isActive && (
        <m.div
          layoutId="selected-indicator"
          style={{
            position: "absolute",
            right: 0,
            top: "30%",
            bottom: "30%",
            width: 3,
            background: "var(--accent)",
            borderRadius: "4px 0 0 4px",
          }}
        />
      )}
    </m.button>
  );
}
