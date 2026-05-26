"use client";

import { Button, Card, Flex, Spin, Tag, Typography } from "antd";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  ClipboardList,
  Loader2,
  Pencil,
  Star,
  Timer,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useReadingSession } from "@/hooks/useReadingSession";
import { api } from "@/lib/api-client";

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
  A2: "var(--success)",
  B1: "var(--info)",
  B2: "var(--info)",
  C1: "var(--accent)",
  C2: "var(--module-grammar)",
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
    api
      .get<PassageDetail>(`/reading/passages/${id}`)
      .then((data) => {
        setPassage(data);
        setMarked(data.isRead);
      })
      .catch(() => setPassage(null))
      .finally(() => setLoading(false));
  }, [id]);

  const markRead = useCallback(async () => {
    if (!id || marked) return;
    try {
      await api.post(`/reading/passages/${id}/read`, {});
      await finishSession();
      setMarked(true);
    } catch {
      /* ignore */
    }
  }, [id, marked, finishSession]);

  const readTime = passage ? Math.max(1, Math.round(passage.wordCount / 200)) : 0;

  if (loading) {
    return (
      <Flex align="center" justify="center" className="h-full" style={{ padding: 60 }}>
        <Spin indicator={<Loader2 className="animate-spin text-accent" size={32} />} />
      </Flex>
    );
  }

  if (!passage) {
    return (
      <Flex
        vertical
        align="center"
        justify="center"
        gap={12}
        className="h-full"
        style={{ padding: 60 }}
      >
        <BookOpen size={48} className="text-text-muted" />
        <Text type="secondary">Không tìm thấy bài đọc</Text>
        <Button type="link" icon={<ArrowLeft />} onClick={() => router.push("/reading/graded")}>
          Quay lại danh sách
        </Button>
      </Flex>
    );
  }

  return (
    <div className="anim-fade-up h-full overflow-y-auto" style={{ padding: "var(--space-6)" }}>
      <Flex vertical gap={20} className="w-[720px] mx-auto">
        {/* Back button */}
        <Button
          type="text"
          icon={<ArrowLeft />}
          onClick={() => router.push("/reading/graded")}
          className="text-text-muted text-[13px]"
          style={{ alignSelf: "flex-start", borderRadius: 10 }}
        >
          Quay lại danh sách
        </Button>

        {/* Article header card */}
        <Card
          styles={{ body: { padding: 0 } }}
          className="overflow-hidden"
          style={{ borderRadius: 20 }}
        >
          {/* Gradient banner */}
          <div
            style={{
              padding: "20px 24px 16px",
              background: `linear-gradient(135deg, ${LEVEL_COLORS[passage.cefrLevel] || "var(--accent)"}20, ${LEVEL_COLORS[passage.cefrLevel] || "var(--accent)"}08)`,
            }}
          >
            <Flex gap={10} align="center" className="mb-3">
              <Tag
                className="m-0 font-bold text-[11px] rounded-lg border-none"
                style={{
                  background: LEVEL_COLORS[passage.cefrLevel],
                  color: "var(--text-on-accent)",
                  padding: "2px 12px",
                }}
              >
                {passage.cefrLevel}
              </Tag>
              <Flex align="center" gap={4}>
                <Timer size={12} className="text-text-muted" />
                <Text className="text-text-muted text-xs">
                  {readTime} phút · {passage.wordCount} từ
                </Text>
              </Flex>
              {marked && (
                <Tag
                  className="m-0 rounded-lg border-none text-emerald-500 font-semibold"
                  style={{
                    marginLeft: "auto",
                    background: "color-mix(in srgb, var(--success) 8%, transparent)",
                  }}
                >
                  <CheckCircle className="mr-1" /> Đã đọc
                </Tag>
              )}
            </Flex>
            <Title level={3} className="m-0 font-display" style={{ lineHeight: 1.4 }}>
              {passage.title}
            </Title>
          </div>

          <div style={{ padding: "20px 24px 28px" }}>
            <div
              className="text-base"
              style={{
                lineHeight: 2,
                color: "var(--text)",
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            >
              {passage.body.split("\n").map((para, i) => (
                <p key={i} style={{ margin: i === 0 ? 0 : "16px 0 0" }}>
                  {para}
                </p>
              ))}
            </div>
          </div>
        </Card>

        {/* Actions */}
        <Flex gap={12} justify="center" wrap>
          {!marked ? (
            <Button
              type="primary"
              size="large"
              icon={<CheckCircle />}
              onClick={markRead}
              className="rounded-xl font-semibold h-[44px]"
              style={{ padding: "0 28px" }}
            >
              Đánh dấu đã đọc
            </Button>
          ) : (
            <Card
              styles={{ body: { padding: "20px 24px" } }}
              className="rounded-2xl w-full border-none"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--secondary))" }}
            >
              <Flex vertical align="center" gap={10}>
                <Text className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.9)" }}>
                  <Star /> Bạn đã đọc xong! Kiểm tra từ vựng ngay?
                </Text>
                <Button
                  size="large"
                  icon={<Pencil />}
                  onClick={() => router.push(`/reading/graded/${id}/cloze`)}
                  className="rounded-xl font-bold h-[44px]"
                  style={{
                    border: "2px solid var(--surface)",
                    background: "rgba(255,255,255,0.15)",
                    color: "var(--text-on-accent)",
                  }}
                >
                  <ClipboardList /> Làm bài cloze test
                </Button>
              </Flex>
            </Card>
          )}
        </Flex>
      </Flex>
    </div>
  );
}
