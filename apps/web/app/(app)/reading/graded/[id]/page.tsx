"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  LoadingOutlined,
  BookOutlined,
  EditOutlined,
  FieldTimeOutlined,
  StarOutlined,
  FormOutlined,
} from "@ant-design/icons";
import { Card, Tag, Flex, Typography, Button, Spin } from "antd";
import { api } from "@/lib/api-client";
import { WordClickableText } from "@/app/(app)/reading/_components/WordClickableText";
import { useReadingSession } from "@/hooks/useReadingSession";

const { Text, Title } = Typography;

type PassageDetail = {
  id: string;
  title: string;
  body: string;
  cefrLevel: string;
  section: string;
  wordCount: number;
  isRead: boolean;
};

const LEVEL_COLORS: Record<string, string> = {
  A2: "var(--success)", B1: "var(--info)", B2: "var(--info)", C1: "var(--accent)", C2: "var(--module-grammar)",
};

export default function GradedPassagePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [passage, setPassage] = useState<PassageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [marked, setMarked] = useState(false);

  // Reading session tracking (Story 19.4.3)
  const { finish: finishSession } = useReadingSession(passage ? id : undefined);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get<PassageDetail>(`/reading/passages/${id}`)
      .then((data) => { setPassage(data); setMarked(data.isRead); })
      .catch(() => setPassage(null))
      .finally(() => setLoading(false));
  }, [id]);

  const markRead = useCallback(async () => {
    if (!id || marked) return;
    try {
      await api.post(`/reading/passages/${id}/read`, {});
      await finishSession();
      setMarked(true);
    } catch { /* ignore */ }
  }, [id, marked, finishSession]);

  const readTime = passage ? Math.max(1, Math.round(passage.wordCount / 200)) : 0;

  if (loading) {
    return (
      <Flex align="center" justify="center" style={{ height: "100%", padding: 60 }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 32, color: "var(--accent)" }} />} />
      </Flex>
    );
  }

  if (!passage) {
    return (
      <Flex vertical align="center" justify="center" gap={12} style={{ height: "100%", padding: 60 }}>
        <BookOutlined style={{ fontSize: 48, color: "var(--text-muted)" }} />
        <Text type="secondary">Không tìm thấy bài đọc</Text>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => router.push("/reading/graded")}>
          Quay lại danh sách
        </Button>
      </Flex>
    );
  }

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "var(--space-6)" }} className="anim-fade-up">
      <Flex vertical gap={20} style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* Back button */}
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push("/reading/graded")}
          style={{ alignSelf: "flex-start", color: "var(--text-muted)", fontSize: 13, borderRadius: 10 }}
        >
          Quay lại danh sách
        </Button>

        {/* Article header card */}
        <Card style={{ borderRadius: 20, overflow: "hidden" }} styles={{ body: { padding: 0 } }}>
          {/* Gradient banner */}
          <div style={{
            padding: "20px 24px 16px",
            background: `linear-gradient(135deg, ${LEVEL_COLORS[passage.cefrLevel] || "var(--accent)"}20, ${LEVEL_COLORS[passage.cefrLevel] || "var(--accent)"}08)`,
          }}>
            <Flex gap={10} align="center" style={{ marginBottom: 12 }}>
              <Tag style={{
                margin: 0, fontWeight: 700, fontSize: 11, borderRadius: 8,
                background: LEVEL_COLORS[passage.cefrLevel], color: "var(--text-on-accent, #fff)", border: "none",
                padding: "2px 12px",
              }}>
                {passage.cefrLevel}
              </Tag>
              <Flex align="center" gap={4}>
                <FieldTimeOutlined style={{ fontSize: 12, color: "var(--text-muted)" }} />
                <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>{readTime} phút · {passage.wordCount} từ</Text>
              </Flex>
              {marked && (
                <Tag style={{ margin: 0, marginLeft: "auto", borderRadius: 8, border: "none", background: "color-mix(in srgb, var(--success) 8%, transparent)", color: "var(--success)", fontWeight: 600 }}>
                  <CheckCircleFilled style={{ marginRight: 4 }} /> Đã đọc
                </Tag>
              )}
            </Flex>
            <Title level={3} style={{ margin: 0, lineHeight: 1.4, fontFamily: "var(--font-display)" }}>
              {passage.title}
            </Title>
          </div>

          {/* Body — click any word to define */}
          <div style={{ padding: "20px 24px 28px" }}>
            <WordClickableText
              text={passage.body}
              style={{
                fontSize: 16,
                lineHeight: 2,
                color: "var(--text)",
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            />
          </div>
        </Card>

        {/* Actions */}
        <Flex gap={12} justify="center" wrap>
          {!marked ? (
            <Button
              type="primary"
              size="large"
              icon={<CheckCircleFilled />}
              onClick={markRead}
              style={{ borderRadius: 12, fontWeight: 600, padding: "0 28px", height: 44 }}
            >
              Đánh dấu đã đọc
            </Button>
          ) : (
            <Card
              style={{
                borderRadius: 16, width: "100%",
                background: "linear-gradient(135deg, var(--accent), var(--secondary))",
                border: "none",
              }}
              styles={{ body: { padding: "20px 24px" } }}
            >
              <Flex vertical align="center" gap={10}>
                <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: 500 }}>
                  <StarOutlined /> Bạn đã đọc xong! Kiểm tra từ vựng ngay?
                </Text>
                <Button
                  size="large"
                  icon={<EditOutlined />}
                  onClick={() => router.push(`/reading/graded/${id}/cloze`)}
                  style={{
                    borderRadius: 12, fontWeight: 700, border: "2px solid var(--surface)",
                    background: "rgba(255,255,255,0.15)", color: "var(--text-on-accent, #fff)", height: 44,
                  }}
                >
                  <FormOutlined /> Làm bài cloze test
                </Button>
              </Flex>
            </Card>
          )}
        </Flex>
      </Flex>
    </div>
  );
}
