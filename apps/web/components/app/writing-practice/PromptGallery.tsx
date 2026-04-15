"use client";

import { Button, Card, Col, Flex, Row, Space, Spin, Typography } from "antd";
import { MailOutlined, EditOutlined, PictureOutlined, StarOutlined } from "@ant-design/icons";
import type { WritingCategory } from "@/lib/writing-practice/types";
import { CATEGORY_LABELS } from "@/lib/writing-practice/types";

const { Title, Text } = Typography;

const CATEGORIES: { id: WritingCategory; icon: typeof MailOutlined; desc: string }[] = [
  { id: "email-response", icon: MailOutlined, desc: "Trả lời email yêu cầu (TOEIC Q6-7)" },
  { id: "opinion-essay", icon: EditOutlined, desc: "Viết luận trình bày quan điểm (TOEIC Q8)" },
  { id: "describe-picture", icon: PictureOutlined, desc: "Mô tả hình ảnh bằng câu (TOEIC Q1-5)" },
  { id: "free", icon: StarOutlined, desc: "Tự do sáng tạo, chủ đề bất kỳ" },
];

type Props = {
  onSelect: (category: WritingCategory) => void;
  isLoading: boolean;
  loadingCategory: string | null;
};

export function PromptGallery({ onSelect, isLoading, loadingCategory }: Props) {
  return (
    <Flex vertical align="center" style={{ width: "100%", maxWidth: 520, margin: "0 auto" }}>
      <Title
        level={3}
        style={{ textAlign: "center", fontFamily: "var(--font-display)", fontStyle: "italic" }}
      >
        Chọn loại bài viết
      </Title>
      <Text type="secondary" style={{ textAlign: "center" }}>
        Luyện viết theo format TOEIC Speaking &amp; Writing
      </Text>

      <Row gutter={[12, 12]} style={{ marginTop: 24, width: "100%" }}>
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isBusy = isLoading && loadingCategory === cat.id;
          return (
            <Col key={cat.id} xs={24} sm={12}>
              <Card
                hoverable
                onClick={() => !isLoading && onSelect(cat.id)}
                style={{
                  opacity: isLoading ? 0.5 : 1,
                  cursor: isLoading ? "not-allowed" : "pointer",
                }}
                styles={{ body: { padding: 16 } }}
              >
                <Flex vertical gap={8} align="flex-start">
                  <Flex
                    align="center"
                    justify="center"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "var(--radius-sm)",
                      background: "var(--accent-muted)",
                      color: "var(--accent)",
                    }}
                  >
                    <Icon style={{ fontSize: 18 }} />
                  </Flex>
                  <Text strong>{CATEGORY_LABELS[cat.id]}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {cat.desc}
                  </Text>
                  {isBusy && (
                    <Space size={4}>
                      <Spin size="small" />
                      <Text type="success" style={{ fontSize: 11 }}>
                        Đang tạo đề...
                      </Text>
                    </Space>
                  )}
                </Flex>
              </Card>
            </Col>
          );
        })}
      </Row>
    </Flex>
  );
}
