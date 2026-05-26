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
        <span className="text-base font-black text-text-primary font-display" >
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
        <div className="flex gap-1.5" >
          <m.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleSaved} className="items-center gap-1 rounded-lg border border-(--border) text-xs font-extrabold cursor-pointer" style={{display: "inline-flex", padding: "5px 12px", background: saved ? "var(--accent-light)" : "var(--surface-alt)", color: saved ? "var(--accent)" : "var(--text-secondary)"}} >
            {saved ? <Star className="text-accent" /> : <Star />}
            <span>{saved ? "Đã lưu" : "Lưu"}</span>
          </m.button>

          <m.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(`/dictionary?q=${encodeURIComponent(query ?? "")}`)} className="items-center gap-1 rounded-lg border border-(--border) bg-surface-alt text-text-secondary text-xs font-extrabold cursor-pointer" style={{display: "inline-flex", padding: "5px 12px"}} >
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
        <div className="flex flex-col gap-3" >
          <p className="text-[13px] text-text-secondary font-medium m-0" >
            Định nghĩa không còn trong bộ nhớ đệm hoặc bị lỗi.
          </p>
          <p className="text-xs text-text-muted m-0" >
            Hãy tra lại từ này trong từ điển để xem chi tiết đầy đủ.
          </p>
          <m.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(`/dictionary?q=${encodeURIComponent(query ?? "")}`)} className="mt-2 h-[38px] rounded-lg border-none font-extrabold text-[13px] cursor-pointer flex items-center justify-center gap-1.5" style={{background: "var(--accent)", color: "var(--text-on-accent)"}} >
            <LinkIcon /> Tra lại ngay
          </m.button>
        </div>
      )}

      {status === "ok" && data && (
        <div className="flex flex-col gap-5" >
          <div>
            <h3 className="font-black font-display text-text-primary m-0" style={{fontSize: 26}} >
              {data.headword}
            </h3>
            {data.partOfSpeech && (
              <span className="italic text-text-muted font-semibold" style={{fontSize: 13.5}} >
                ({data.partOfSpeech})
              </span>
            )}
          </div>

          {(data.phoneticsUs || data.phoneticsUk) && (
            <div className="flex gap-3.5 bg-surface-alt rounded-(--radius-lg) border border-(--border)" style={{padding: "10px 14px"}} >
              {data.phoneticsUs && (
                <div className="flex items-center gap-1 text-[13px] text-text-secondary font-bold" >
                  <span>🇺🇸 {data.phoneticsUs}</span>
                </div>
              )}
              {data.phoneticsUk && (
                <div className="flex items-center gap-1 text-[13px] text-text-secondary font-bold" >
                  <span>🇬🇧 {data.phoneticsUk}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-1.5 flex-wrap" >
            {levelStyle && (
              <span className="text-[11px] font-extrabold rounded-md" style={{padding: "3px 8px", background: levelStyle.bg, color: levelStyle.color, border: `1px solid ${levelStyle.border}`}} >
                Trình độ: {data.level}
              </span>
            )}
            <span className="text-[11px] font-extrabold rounded-md bg-surface-alt text-text-secondary border border-(--border)" style={{padding: "3px 8px"}} >
              {getTypeLabel(data)}
            </span>
          </div>

          <div className="flex flex-col gap-5" style={{borderTop: "1.5px dashed var(--border)", paddingTop: 20}} >
            {data.senses.map((sense) => (
              <div key={sense.id} className="flex flex-col gap-1.5" >
                <span className="text-[10.5px] font-black uppercase tracking-widest text-accent" >
                  {sense.label || "Nghĩa"}
                </span>

                <p className="text-text-primary font-bold m-0 leading-normal" style={{fontSize: 14.5}} >
                  {sense.definitionEn}
                </p>
                {sense.shortMeaningsVi && sense.shortMeaningsVi.length > 0 && (
                  <p className="text-text-secondary font-medium leading-normal" style={{fontSize: 13.5, margin: "2px 0 0"}} >
                    {sense.shortMeaningsVi.join(", ")}
                  </p>
                )}

                {sense.examples.slice(0, 3).map((ex, i) => (
                  <div
                    key={i} className="mt-1.5 flex flex-col" style={{borderLeft: "2.5px solid var(--accent-muted)", paddingLeft: 12, gap: 2}} >
                    <span className="text-[13px] italic text-text-secondary font-semibold" >
                      {ex.en}
                    </span>
                    {ex.vi && (
                      <span className="text-xs text-text-muted font-medium" >
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
            onClick={() => router.push(`/dictionary?q=${encodeURIComponent(query ?? "")}`)} className="h-[40px] rounded-(--radius-lg) border-none font-extrabold cursor-pointer flex items-center justify-center gap-1.5" style={{marginTop: "auto", background: "linear-gradient(135deg, var(--accent), var(--secondary))", color: "var(--text-on-accent)", fontSize: 13.5, boxShadow: "0 2px 8px var(--accent-muted)"}} >
            <span>Xem chi tiết trong Từ điển</span>
            <ArrowRight />
          </m.button>
        </div>
      )}
    </Drawer>
  );
}
