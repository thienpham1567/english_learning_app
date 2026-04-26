"use client";

import { Flex, Tag, Typography } from "antd";
import { FireOutlined, TrophyOutlined } from "@ant-design/icons";
import type { Badge } from "@/lib/daily-challenge/types";

const { Text } = Typography;

function BadgeIcon({ name }: { name: string }) {
  if (name === "TrophyOutlined") return <TrophyOutlined />;
  return <FireOutlined />;
}

type Props = { badges: Badge[] };

export function BadgeGallery({ badges }: Props) {
  return (
    <Flex wrap gap={8}>
      {badges.map((b) => (
        <Tag
          key={b.id}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 12px",
            borderRadius: "var(--radius)",
            fontSize: 13,
            border: b.unlocked ? "1px solid var(--xp)" : "1px solid var(--border)",
            background: b.unlocked ? "color-mix(in srgb, var(--xp) 10%, var(--surface))" : "var(--bg-deep)",
            opacity: b.unlocked ? 1 : 0.5,
            filter: b.unlocked ? "none" : "grayscale(1)",
          }}
        >
          <span style={{ fontSize: 16 }}><BadgeIcon name={b.icon} /></span>
          <Flex vertical gap={0}>
            <Text strong style={{ fontSize: 11, lineHeight: 1.2 }}>{b.label}</Text>
            <Text type="secondary" style={{ fontSize: 10, lineHeight: 1 }}>{b.requiredStreak}d</Text>
          </Flex>
        </Tag>
      ))}
    </Flex>
  );
}
