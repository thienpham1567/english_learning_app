"use client";

import { useMemo } from "react";
import Link from "next/link";
import { RightOutlined, WarningOutlined } from "@ant-design/icons";
import { Tag, Flex, Typography } from "antd";
import { summarizeErrorPatterns } from "@repo/modules/learning";
import type { ErrorPatternInput } from "@repo/modules/learning";

const { Text } = Typography;

type Props = {
  errors: ErrorPatternInput[];
};

/**
 * Error Pattern Summary Section (Story 23.2, AC: 1-4)
 *
 * Shows top error patterns grouped by normalized category.
 * Each pattern shows frequency, examples, affected skill, and next action.
 */
export function ErrorPatternSummary({ errors }: Props) {
  const patterns = useMemo(() => summarizeErrorPatterns(errors), [errors]);

  if (patterns.length === 0) return null;

  // Show top 5 patterns
  const topPatterns = patterns.slice(0, 5);

  return (
    <div style={{ marginBottom: 16 }}>
      <Flex align="center" gap={8} style={{ marginBottom: 10 }}>
        <WarningOutlined style={{ color: "var(--warning)", fontSize: 14 }} />
        <Text style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
          Mẫu lỗi thường gặp
        </Text>
        <Tag style={{ borderRadius: 99, fontSize: 11, fontWeight: 600 }}>
          {patterns.length} mẫu
        </Tag>
      </Flex>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {topPatterns.map((pattern) => (
          <div
            key={pattern.category.key}
            style={{
              padding: "14px 16px",
              borderRadius: 14,
              background: "var(--card-bg)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
              transition: "box-shadow 0.15s",
            }}
          >
            {/* Pattern Header */}
            <Flex align="center" gap={8} style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>{pattern.category.emoji}</span>
              <Flex vertical style={{ flex: 1 }}>
                <Text style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>
                  {pattern.category.labelVi}
                </Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {pattern.totalCount} lỗi · {pattern.unresolvedCount} chưa nắm
                  {pattern.recentCount > 0 && ` · ${pattern.recentCount} gần đây`}
                </Text>
              </Flex>
              {pattern.unresolvedCount > 0 && (
                <Tag
                  color="error"
                  style={{ borderRadius: 6, fontSize: 11, fontWeight: 600, margin: 0 }}
                >
                  {pattern.unresolvedCount}
                </Tag>
              )}
            </Flex>

            {/* Examples (AC: 2) */}
            {pattern.examples.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                {pattern.examples.slice(0, 2).map((ex) => (
                  <div
                    key={ex.id}
                    style={{
                      fontSize: 12,
                      padding: "6px 10px",
                      borderRadius: 8,
                      background: "color-mix(in srgb, var(--accent) 4%, var(--surface))",
                      marginBottom: 4,
                      lineHeight: 1.5,
                    }}
                  >
                    <span style={{ color: "var(--text-secondary)" }}>{ex.questionStem.slice(0, 80)}</span>
                    <span style={{ color: "var(--error)", fontWeight: 600, marginLeft: 6 }}>
                      ✗ {ex.userAnswer}
                    </span>
                    <span style={{ color: "var(--success)", fontWeight: 600, marginLeft: 4 }}>
                      ✓ {ex.correctAnswer}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Affected Skill + Next Action (AC: 2) */}
            <Flex align="center" justify="space-between">
              <Text type="secondary" style={{ fontSize: 11 }}>
                Kỹ năng: {pattern.affectedSkillIds.join(", ")}
              </Text>
              <Link
                href={pattern.nextAction.href}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--accent)",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {pattern.nextAction.label} <RightOutlined style={{ fontSize: 10 }} />
              </Link>
            </Flex>
          </div>
        ))}
      </div>
    </div>
  );
}
