// components/app/VocabularyDetailSheet.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Drawer, Flex, Skeleton, Space, Tag, Typography } from "antd";
import { BookOutlined, LinkOutlined, StarFilled, StarOutlined } from "@ant-design/icons";

import { api } from "@/lib/api-client";
import type { Vocabulary } from "@/lib/schemas/vocabulary";

const { Title, Text } = Typography;

type Props = {
  query: string | null;
  onClose: () => void;
  saved: boolean;
  onToggleSaved: () => void;
};

type Status = "idle" | "loading" | "ok" | "error";

const LEVEL_COLORS: Record<string, string> = {
  A1: "green",
  A2: "cyan",
  B1: "blue",
  B2: "gold",
  C1: "orange",
  C2: "volcano",
};

function getTypeLabel(data: Vocabulary): string {
  if (data.entryType === "idiom") return "idiom";
  if (data.entryType === "phrasal_verb") return "phrasal verb";
  return data.partOfSpeech ?? "word";
}

export function VocabularyDetailSheet({ query, onClose, saved, onToggleSaved }: Props) {
  const router = useRouter();
  const [data, setData] = useState<Vocabulary | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (!query) return;

    let cancelled = false;

    (async () => {
      try {
        setData(null);
        setStatus("loading");
        const payload = await api.get<{ data: Vocabulary }>(
          `/vocabulary/${encodeURIComponent(query)}`,
        );
        if (!cancelled) {
          setData(payload.data);
          setStatus("ok");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <Drawer
      open={query !== null}
      onClose={onClose}
      title="Chi tiết từ vựng"
      placement="right"
      width={384}
      extra={
        <Space>
          <Button
            type="text"
            icon={saved ? <StarFilled style={{ color: "var(--accent)" }} /> : <StarOutlined />}
            onClick={onToggleSaved}
          >
            {saved ? "Đã lưu" : "Lưu"}
          </Button>
          <Button
            type="text"
            icon={<LinkOutlined />}
            onClick={() => router.push(`/dictionary?q=${encodeURIComponent(query ?? "")}`)}
          >
            Tra cứu
          </Button>
        </Space>
      }
    >
      {status === "loading" && <Skeleton active paragraph={{ rows: 6 }} />}

      {status === "error" && (
        <Flex vertical gap={12}>
          <Text type="secondary">Định nghĩa không còn trong bộ nhớ đệm.</Text>
          <Text type="secondary">Hãy tra lại từ này để xem đầy đủ.</Text>
          <Button
            type="link"
            icon={<LinkOutlined />}
            href={`/dictionary?q=${encodeURIComponent(query ?? "")}`}
          >
            Tra lại
          </Button>
        </Flex>
      )}

      {status === "ok" && data && (
        <Flex vertical gap={20}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              {data.headword}
            </Title>
            {data.partOfSpeech && (
              <Text type="secondary" italic style={{ fontSize: 14 }}>
                {data.partOfSpeech}
              </Text>
            )}
          </div>

          {(data.phoneticsUs || data.phoneticsUk) && (
            <Space size={12}>
              {data.phoneticsUs && <Text type="secondary">🇺🇸 {data.phoneticsUs}</Text>}
              {data.phoneticsUk && <Text type="secondary">🇬🇧 {data.phoneticsUk}</Text>}
            </Space>
          )}

          <Space wrap size={8}>
            {data.level && <Tag color={LEVEL_COLORS[data.level] ?? "default"}>{data.level}</Tag>}
            <Tag>{getTypeLabel(data)}</Tag>
          </Space>

          <Flex vertical gap={20} style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
            {data.senses.map((sense) => (
              <Flex key={sense.id} vertical gap={8}>
                <Text
                  type="secondary"
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--accent)",
                  }}
                >
                  {sense.label}
                </Text>
                <Text type="secondary" style={{ fontSize: 14 }}>
                  {sense.definitionEn}
                </Text>
                {sense.examples.slice(0, 3).map((ex, i) => (
                  <div
                    key={i}
                    style={{
                      borderLeft: "2px solid color-mix(in srgb, var(--accent) 30%, transparent)",
                      paddingLeft: 12,
                      fontSize: 14,
                    }}
                  >
                    <Text>{ex.en}</Text>
                    <br />
                    <Text type="secondary">{ex.vi}</Text>
                  </div>
                ))}
              </Flex>
            ))}
          </Flex>

          <Button
            block
            icon={<LinkOutlined />}
            onClick={() => router.push(`/dictionary?q=${encodeURIComponent(query ?? "")}`)}
          >
            Xem trong từ điển
          </Button>
        </Flex>
      )}
    </Drawer>
  );
}
