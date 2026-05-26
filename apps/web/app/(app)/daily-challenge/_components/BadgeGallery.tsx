"use client";

import { Flex, Typography } from "antd";

import type { Badge } from "@/lib/daily-challenge/types";
import * as m from "motion/react-client";
import { Flame, Lock, Trophy } from "lucide-react";

const { Text } = Typography;

function BadgeIcon({ name, unlocked }: { name: string; unlocked: boolean }) {
  const iconStyle = {
    fontSize: 18,
    color: unlocked ? "var(--xp)" : "var(--text-muted)",
  };
  if (name === "Trophy") return <Trophy style={iconStyle} />;
  return <Flame style={iconStyle} />;
}

type Props = { badges: Badge[] };

export function BadgeGallery({ badges }: Props) {
  return (
    <div
      style={{
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--border)",
        background: "var(--surface)",
        padding: "16px 20px",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
        <Trophy style={{ fontSize: 13, color: "var(--accent)" }} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--accent)",
          }}
        >
          Huy hiệu thành tựu
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
          gap: 10,
        }}
      >
        {badges.map((b) => {
          const unlocked = b.unlocked;
          return (
            <m.div
              key={b.id}
              whileHover={unlocked ? { scale: 1.04, y: -2 } : {}}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: "var(--radius-lg)",
                border: unlocked ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid var(--border)",
                background: unlocked
                  ? "linear-gradient(135deg, rgba(245, 158, 11, 0.08), var(--surface))"
                  : "var(--surface-alt)",
                boxShadow: unlocked ? "0 4px 10px rgba(245, 158, 11, 0.06)" : "none",
                position: "relative",
                overflow: "hidden",
                transition: "all 0.2s ease",
              }}
            >
              {/* Badge Icon Container */}
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: unlocked ? "rgba(245, 158, 11, 0.12)" : "rgba(0,0,0,0.03)",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  boxShadow: unlocked ? "0 2px 8px rgba(245, 158, 11, 0.15)" : "none",
                }}
              >
                <BadgeIcon name={b.icon} unlocked={unlocked} />
              </div>

              {/* Text info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text
                  strong
                  style={{
                    fontSize: 12,
                    lineHeight: 1.2,
                    color: unlocked ? "var(--text-primary)" : "var(--text-muted)",
                    display: "block",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {b.label}
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    lineHeight: 1,
                    color: "var(--text-muted)",
                    fontWeight: 600,
                    marginTop: 2,
                    display: "block",
                  }}
                >
                  Chuỗi {b.requiredStreak} ngày
                </Text>
              </div>

              {/* Locked Indicator overlay */}
              {!unlocked && (
                <div
                  style={{
                    position: "absolute",
                    right: 8,
                    top: 8,
                    fontSize: 11,
                    color: "var(--text-muted)",
                    opacity: 0.5,
                  }}
                >
                  <Lock />
                </div>
              )}
            </m.div>
          );
        })}
      </div>
    </div>
  );
}
