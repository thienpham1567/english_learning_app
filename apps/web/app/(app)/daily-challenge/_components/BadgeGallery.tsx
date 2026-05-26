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
    <div className="rounded-(--radius-xl) border-2 border-border bg-(--surface) py-4 px-5" style={{boxShadow: "var(--shadow-sm)"}} >
      <div className="flex items-center gap-1.5 mb-4" >
        <Trophy className="text-[13px] text-accent" />
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-accent" >
          Huy hiệu thành tựu
        </span>
      </div>

      <div className="grid gap-2.5" style={{gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))"}} >
        {badges.map((b) => {
          const unlocked = b.unlocked;
          return (
            <m.div
              key={b.id}
              whileHover={unlocked ? { scale: 1.04, y: -2 } : {}} className="flex items-center gap-2.5 rounded-(--radius-lg) relative overflow-hidden" style={{padding: "10px 12px", border: unlocked ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid var(--border)", background: unlocked
                  ? "linear-gradient(135deg, rgba(245, 158, 11, 0.08), var(--surface))"
                  : "var(--surface-alt)", boxShadow: unlocked ? "0 4px 10px rgba(245, 158, 11, 0.06)" : "none", transition: "all 0.2s ease"}} >
              {/* Badge Icon Container */}
              <div className="w-[34px] h-[34px] rounded-full grid shrink-0" style={{background: unlocked ? "rgba(245, 158, 11, 0.12)" : "rgba(0,0,0,0.03)", placeItems: "center", boxShadow: unlocked ? "0 2px 8px rgba(245, 158, 11, 0.15)" : "none"}} >
                <BadgeIcon name={b.icon} unlocked={unlocked} />
              </div>

              {/* Text info */}
              <div className="flex-1 w-[0px]" >
                <Text
                  strong className="text-xs block overflow-hidden" style={{lineHeight: 1.2, color: unlocked ? "var(--text-primary)" : "var(--text-muted)", whiteSpace: "nowrap", textOverflow: "ellipsis"}} >
                  {b.label}
                </Text>
                <Text className="text-[10px] leading-none text-text-muted font-semibold block" style={{marginTop: 2}} >
                  Chuỗi {b.requiredStreak} ngày
                </Text>
              </div>

              {/* Locked Indicator overlay */}
              {!unlocked && (
                <div className="absolute text-[11px] text-text-muted" style={{right: 8, top: 8, opacity: 0.5}} >
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
