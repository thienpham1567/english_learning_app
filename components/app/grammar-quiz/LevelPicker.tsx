"use client";

import { Button, Card, Flex, Space, Typography } from "antd";

const { Title, Text } = Typography;

const LEVELS = [
  { id: "easy", label: "Dễ", desc: "Ngữ pháp cơ bản", color: "#9AB17A" },
  { id: "medium", label: "Trung bình", desc: "Ngữ pháp nâng cao", color: "#C3CC9B" },
  { id: "hard", label: "Khó", desc: "Ngữ pháp chuyên sâu", color: "#E4DFB5" },
] as const;

type Props = {
  selected: string;
  onSelect: (level: string) => void;
  onStart: () => void;
  isLoading: boolean;
};

export function LevelPicker({ selected, onSelect, onStart, isLoading }: Props) {
  return (
    <Flex
      vertical
      align="center"
      className="anim-fade-up"
      style={{ maxWidth: 480, margin: "0 auto" }}
    >
      <Title level={3} style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>
        TOEIC Part 5
      </Title>
      <Text type="secondary">Incomplete Sentences — Chọn độ khó để bắt đầu</Text>

      <Flex vertical gap={10} style={{ marginTop: 24, width: "100%" }}>
        {LEVELS.map((lvl, i) => {
          const isSelected = selected === lvl.id;
          return (
            <Card
              key={lvl.id}
              hoverable
              className={`anim-fade-left anim-delay-${i + 1}`}
              onClick={() => onSelect(lvl.id)}
              style={{
                borderWidth: isSelected ? 2 : 1,
                borderColor: isSelected ? lvl.color : undefined,
                background: isSelected ? `${lvl.color}18` : undefined,
              }}
              styles={{ body: { padding: "14px 20px" } }}
            >
              <Space size={12}>
                <Text strong style={{ fontSize: 18, color: isSelected ? lvl.color : undefined }}>
                  {lvl.label}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {lvl.desc}
                </Text>
              </Space>
            </Card>
          );
        })}
      </Flex>

      <Button
        type="primary"
        size="large"
        className="anim-fade-up anim-delay-4"
        onClick={onStart}
        disabled={isLoading}
        loading={isLoading}
        style={{ marginTop: 32, borderRadius: 999, paddingInline: 40 }}
      >
        {isLoading ? "Đang tạo đề..." : "🚀 Bắt đầu"}
      </Button>
    </Flex>
  );
}
