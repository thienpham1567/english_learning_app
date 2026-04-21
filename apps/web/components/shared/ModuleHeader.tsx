"use client";

import type { ReactNode } from "react";
import { Card, Flex, Typography } from "antd";

const { Text, Title } = Typography;

interface ModuleHeaderProps {
  icon: ReactNode;
  gradient: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  /** Optional tag label displayed next to icon, e.g. "BETA" */
  badge?: string;
}

export function ModuleHeader({
  icon,
  gradient,
  title,
  subtitle,
  action,
  badge,
}: ModuleHeaderProps) {
  return (
    <Card
      className="anim-fade-up"
      style={{
        borderRadius: 20,
        background: gradient,
        border: "none",
        flexShrink: 0,
      }}
      styles={{ body: { padding: "20px 24px" } }}
    >
      <Flex align="center" gap={14}>
        {/* Icon container */}
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            background: "rgba(255, 255, 255, 0.2)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: 22,
            color: "#fff",
          }}
        >
          {icon}
        </div>

        {/* Title + subtitle */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {badge && (
            <Text
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "rgba(255, 255, 255, 0.6)",
                display: "block",
                marginBottom: 2,
              }}
            >
              {badge}
            </Text>
          )}
          <Title
            level={4}
            style={{
              margin: 0,
              color: "#fff",
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: 18,
              lineHeight: 1.3,
            }}
          >
            {title}
          </Title>
          {subtitle && (
            <Text
              style={{
                fontSize: 13,
                color: "rgba(255, 255, 255, 0.75)",
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </Text>
          )}
        </div>

        {/* Optional action slot */}
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </Flex>
    </Card>
  );
}
