"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, Flex, Typography, Tag, Button, Spin, message } from "antd";
import {
  BookOutlined,
  SaveOutlined,
  CheckOutlined,
  SoundOutlined,
  CloseOutlined,
} from "@ant-design/icons";

import { api } from "@/lib/api-client";
import http from "@/lib/http";

const { Text, Title } = Typography;

// CEFR level tag colors
const LEVEL_COLORS: Record<string, string> = {
  A1: "green",
  A2: "cyan",
  B1: "blue",
  B2: "gold",
  C1: "orange",
  C2: "volcano",
};

type WordData = {
  headword: string;
  phonetic: string | null;
  partOfSpeech: string | null;
  overviewVi: string;
  level: string | null;
};

type Props = {
  word: string;
  anchorRect: DOMRect | null;
  visible: boolean;
  onClose: () => void;
  onSave?: (word: string) => void;
};

const CARD_WIDTH = 320;
const CARD_MAX_HEIGHT = 220;
const EDGE_MARGIN = 12;

function calculatePosition(anchorRect: DOMRect | null) {
  if (!anchorRect) return { top: 0, left: 0 };

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Default: centered below the word
  let top = anchorRect.bottom + 8;
  let left = anchorRect.left + anchorRect.width / 2 - CARD_WIDTH / 2;

  // If too close to bottom → show above
  if (top + CARD_MAX_HEIGHT > vh - EDGE_MARGIN) {
    top = anchorRect.top - CARD_MAX_HEIGHT - 8;
  }

  // Clamp to stay within viewport horizontally
  if (left < EDGE_MARGIN) left = EDGE_MARGIN;
  if (left + CARD_WIDTH > vw - EDGE_MARGIN)
    left = vw - CARD_WIDTH - EDGE_MARGIN;

  // Ensure top is never negative
  if (top < EDGE_MARGIN) top = EDGE_MARGIN;

  return { top, left };
}

export function MiniDictionary({
  word,
  anchorRect,
  visible,
  onClose,
  onSave,
}: Props) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const [data, setData] = useState<WordData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch word data when word changes and visible
  useEffect(() => {
    if (!visible || !word) return;

    let cancelled = false;
    setLoading(true);
    setError(false);
    setData(null);
    setSaved(false);

    // Use POST /dictionary which upserts userVocabulary row (B1 fix)
    http
      .post<{ data: Record<string, unknown>; saved: boolean }>("/dictionary", {
        word,
      })
      .then(({ data: res }) => {
        if (!cancelled) {
          const payload = res.data;
          setData({
            headword: (payload.headword as string) ?? word,
            phonetic:
              (payload.phonetic as string) ??
              (payload.phoneticsUs as string) ??
              null,
            partOfSpeech: (payload.partOfSpeech as string) ?? null,
            overviewVi: (payload.overviewVi as string) ?? "",
            level: (payload.level as string) ?? null,
          });
          setSaved(res.saved);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [word, visible]);

  // Click-outside-to-close (AC: #4)
  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Delay to avoid closing on the same click that opened it
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [visible, onClose]);

  // Save word (AC: #2)
  const handleSave = useCallback(async () => {
    if (saving || saved) return;
    setSaving(true);
    try {
      await api.patch(`/vocabulary/${encodeURIComponent(word)}/saved`, {
        saved: true,
      });
      setSaved(true);
      onSave?.(word);
      messageApi.success("Đã lưu từ!");
    } catch {
      messageApi.error("Không thể lưu từ");
    } finally {
      setSaving(false);
    }
  }, [word, saving, saved, messageApi]);

  // Navigate to dictionary (AC: #3)
  const handleLookup = useCallback(() => {
    router.push(`/dictionary?q=${encodeURIComponent(word)}`);
    onClose();
  }, [word, router, onClose]);

  if (!visible) return null;

  const position = calculatePosition(anchorRect);

  return (
    <>
      {contextHolder}
      <div
        ref={cardRef}
        className="anim-scale-in"
        style={{
          position: "fixed",
          top: position.top,
          left: position.left,
          width: CARD_WIDTH,
          zIndex: 1050,
        }}
      >
        <Card
          style={{
            borderRadius: "var(--radius-xl)",
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)",
            border: "1px solid var(--border)",
          }}
          styles={{ body: { padding: "16px 18px" } }}
        >
          {/* Close button */}
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={onClose}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              color: "var(--text-muted)",
              fontSize: 12,
            }}
          />

          {loading && (
            <Flex align="center" justify="center" style={{ minHeight: 80 }}>
              <Spin size="small" />
            </Flex>
          )}

          {error && (
            <Flex
              vertical
              align="center"
              gap={8}
              style={{ minHeight: 80, justifyContent: "center" }}
            >
              <Text type="secondary" style={{ fontSize: 13 }}>
                Không tìm thấy từ này
              </Text>
              <Button size="small" type="link" onClick={handleLookup}>
                Tra cứu đầy đủ →
              </Button>
            </Flex>
          )}

          {data && (
            <Flex vertical gap={8}>
              {/* Headword + Level */}
              <Flex align="baseline" gap={8}>
                <Title level={5} style={{ margin: 0, fontWeight: 700 }}>
                  {data.headword}
                </Title>
                {data.level && (
                  <Tag
                    color={LEVEL_COLORS[data.level] ?? "default"}
                    style={{ fontSize: 10, lineHeight: "16px", margin: 0 }}
                  >
                    {data.level}
                  </Tag>
                )}
              </Flex>

              {/* Phonetic + Part of Speech */}
              <Flex align="center" gap={8}>
                {data.phonetic && (
                  <Text
                    type="secondary"
                    style={{ fontSize: 12, fontFamily: "var(--font-mono)" }}
                  >
                    <SoundOutlined style={{ marginRight: 4, fontSize: 11 }} />
                    {data.phonetic}
                  </Text>
                )}
                {data.partOfSpeech && (
                  <Tag style={{ fontSize: 10, fontStyle: "italic", margin: 0 }}>
                    {data.partOfSpeech}
                  </Tag>
                )}
              </Flex>

              {/* Vietnamese translation */}
              <Text style={{ fontSize: 13, lineHeight: 1.5 }}>
                {data.overviewVi}
              </Text>

              {/* Action buttons */}
              <Flex gap={8} style={{ marginTop: 4 }}>
                <Button
                  size="small"
                  type={saved ? "default" : "primary"}
                  icon={saved ? <CheckOutlined /> : <SaveOutlined />}
                  loading={saving}
                  disabled={saved}
                  onClick={handleSave}
                  style={{ flex: 1 }}
                >
                  {saved ? "Đã lưu" : "Lưu"}
                </Button>
                <Button
                  size="small"
                  icon={<BookOutlined />}
                  onClick={handleLookup}
                  style={{ flex: 1 }}
                >
                  Tra cứu
                </Button>
              </Flex>
            </Flex>
          )}
        </Card>
      </div>
    </>
  );
}
