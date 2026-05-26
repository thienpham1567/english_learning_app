"use client";

import { Drawer, Skeleton } from "antd";
import * as m from "motion/react-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { Vocabulary } from "@/lib/schemas/vocabulary";
import { ArrowRight, Link as LinkIcon, Star, Volume2 } from "lucide-react";;

type Props = {
  query: string | null;
  onClose: () => void;
  saved: boolean;
  onToggleSaved: () => void;
};

type Status = "idle" | "loading" | "ok" | "error";

const LEVEL_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  A1: {
    bg: "rgba(16, 185, 129, 0.08)",
    color: "var(--success)",
    border: "rgba(16, 185, 129, 0.2)",
  },
  A2: {
    bg: "rgba(16, 185, 129, 0.06)",
    color: "var(--success)",
    border: "rgba(16, 185, 129, 0.15)",
  },
  B1: { bg: "var(--accent-light)", color: "var(--accent)", border: "var(--accent-muted)" },
  B2: {
    bg: "rgba(245, 158, 11, 0.08)",
    color: "var(--warning)",
    border: "rgba(245, 158, 11, 0.2)",
  },
  C1: { bg: "rgba(139, 92, 246, 0.08)", color: "var(--xp)", border: "rgba(139, 92, 246, 0.2)" },
  C2: { bg: "rgba(239, 68, 68, 0.08)", color: "var(--error)", border: "rgba(239, 68, 68, 0.2)" },
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

  const levelStyle = data?.level ? LEVEL_COLORS[data.level] : null;

  return (
    <Drawer
      open={query !== null}
      onClose={onClose}
      title={
        <span
          style={{
            fontSize: 16,
            fontWeight: 900,
            color: "var(--text-primary)",
            fontFamily: "var(--font-display)",
          }}
        >
          Chi tiết từ vựng
        </span>
      }
      placement="right"
      width={380}
      styles={{
        body: { padding: "20px 24px", background: "var(--surface)" },
        header: { borderBottom: "1px solid var(--border)", background: "var(--surface)" },
      }}
      extra={
        <div style={{ display: "flex", gap: 6 }}>
          <m.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleSaved}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "5px 12px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: saved ? "var(--accent-light)" : "var(--surface-alt)",
              color: saved ? "var(--accent)" : "var(--text-secondary)",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {saved ? <Star style={{ color: "var(--accent)" }} /> : <Star />}
            <span>{saved ? "Đã lưu" : "Lưu"}</span>
          </m.button>

          <m.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(`/dictionary?q=${encodeURIComponent(query ?? "")}`)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "5px 12px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface-alt)",
              color: "var(--text-secondary)",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            <LinkIcon />
            <span>Tra cứu</span>
          </m.button>
        </div>
      }
    >
      <style>{`
        .ant-drawer-content {
          background-color: var(--surface) !important;
        }
        .ant-drawer-header-title .ant-drawer-close {
          color: var(--text-secondary) !important;
        }
      `}</style>

      {status === "loading" && <Skeleton active paragraph={{ rows: 6 }} />}

      {status === "error" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500, margin: 0 }}>
            Định nghĩa không còn trong bộ nhớ đệm hoặc bị lỗi.
          </p>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
            Hãy tra lại từ này trong từ điển để xem chi tiết đầy đủ.
          </p>
          <m.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(`/dictionary?q=${encodeURIComponent(query ?? "")}`)}
            style={{
              marginTop: 8,
              height: 38,
              borderRadius: 8,
              border: "none",
              background: "var(--accent)",
              color: "var(--text-on-accent)",
              fontWeight: 800,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <LinkIcon /> Tra lại ngay
          </m.button>
        </div>
      )}

      {status === "ok" && data && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <h3
              style={{
                fontSize: 26,
                fontWeight: 900,
                fontFamily: "var(--font-display)",
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              {data.headword}
            </h3>
            {data.partOfSpeech && (
              <span
                style={{
                  fontSize: 13.5,
                  fontStyle: "italic",
                  color: "var(--text-muted)",
                  fontWeight: 600,
                }}
              >
                ({data.partOfSpeech})
              </span>
            )}
          </div>

          {(data.phoneticsUs || data.phoneticsUk) && (
            <div
              style={{
                display: "flex",
                gap: 14,
                background: "var(--surface-alt)",
                padding: "10px 14px",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border)",
              }}
            >
              {data.phoneticsUs && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 13,
                    color: "var(--text-secondary)",
                    fontWeight: 700,
                  }}
                >
                  <span>🇺🇸 {data.phoneticsUs}</span>
                </div>
              )}
              {data.phoneticsUk && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 13,
                    color: "var(--text-secondary)",
                    fontWeight: 700,
                  }}
                >
                  <span>🇬🇧 {data.phoneticsUk}</span>
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {levelStyle && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "3px 8px",
                  borderRadius: 6,
                  background: levelStyle.bg,
                  color: levelStyle.color,
                  border: `1px solid ${levelStyle.border}`,
                }}
              >
                Trình độ: {data.level}
              </span>
            )}
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                padding: "3px 8px",
                borderRadius: 6,
                background: "var(--surface-alt)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              {getTypeLabel(data)}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              borderTop: "1.5px dashed var(--border)",
              paddingTop: 20,
            }}
          >
            {data.senses.map((sense) => (
              <div key={sense.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--accent)",
                  }}
                >
                  {sense.label || "Nghĩa"}
                </span>

                <p
                  style={{
                    fontSize: 14.5,
                    color: "var(--text-primary)",
                    fontWeight: 700,
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {sense.definitionEn}
                </p>
                {sense.shortMeaningsVi && sense.shortMeaningsVi.length > 0 && (
                  <p
                    style={{
                      fontSize: 13.5,
                      color: "var(--text-secondary)",
                      fontWeight: 500,
                      margin: "2px 0 0",
                      lineHeight: 1.5,
                    }}
                  >
                    {sense.shortMeaningsVi.join(", ")}
                  </p>
                )}

                {sense.examples.slice(0, 3).map((ex, i) => (
                  <div
                    key={i}
                    style={{
                      borderLeft: "2.5px solid var(--accent-muted)",
                      paddingLeft: 12,
                      marginTop: 6,
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontStyle: "italic",
                        color: "var(--text-secondary)",
                        fontWeight: 600,
                      }}
                    >
                      {ex.en}
                    </span>
                    {ex.vi && (
                      <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
                        {ex.vi}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <m.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(`/dictionary?q=${encodeURIComponent(query ?? "")}`)}
            style={{
              marginTop: "auto",
              height: 40,
              borderRadius: "var(--radius-lg)",
              border: "none",
              background: "linear-gradient(135deg, var(--accent), var(--secondary))",
              color: "var(--text-on-accent)",
              fontWeight: 800,
              fontSize: 13.5,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              boxShadow: "0 2px 8px var(--accent-muted)",
            }}
          >
            <span>Xem chi tiết trong Từ điển</span>
            <ArrowRight />
          </m.button>
        </div>
      )}
    </Drawer>
  );
}
