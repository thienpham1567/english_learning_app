"use client";

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
      <div className="h-full flex items-center justify-center p-15">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  if (!passage) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 p-15">
        <BookOpen size={48} className="text-text-muted" />
        <span className="text-text-secondary">Reading passage not found</span>
        <button
          type="button"
          onClick={() => router.push("/reading/graded")}
          className="text-accent font-bold cursor-pointer bg-transparent border-none flex items-center gap-1.5"
        >
          <ArrowLeft size={14} /> Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="anim-fade-up h-full overflow-y-auto p-6">
      <div className="w-full max-w-[720px] mx-auto flex flex-col gap-5">
        {/* Back button */}
        <button
          type="button"
          onClick={() => router.push("/reading/graded")}
          className="text-text-muted text-[13px] self-start rounded-[10px] bg-transparent border-none cursor-pointer flex items-center gap-1.5"
        >
          <ArrowLeft size={12} /> Back to List
        </button>

        {/* Article header card */}
        <div className="overflow-hidden rounded-[20px] border border-border">
          {/* Gradient banner */}
          <div
            className="py-5 px-6 pb-4"
            style={{
              background: `linear-gradient(135deg, ${LEVEL_COLORS[passage.cefrLevel] || "var(--accent)"}20, ${LEVEL_COLORS[passage.cefrLevel] || "var(--accent)"}08)`,
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span
                className="m-0 font-bold text-[11px] rounded-lg border-none py-0.5 px-3"
                style={{
                  background: LEVEL_COLORS[passage.cefrLevel],
                  color: "var(--text-on-accent)",
                }}
              >
                {passage.cefrLevel}
              </span>
              <div className="flex items-center gap-1">
                <Timer size={12} className="text-text-muted" />
                <span className="text-text-muted text-xs">
                  {readTime} min · {passage.wordCount} words
                </span>
              </div>
              {marked && (
                <span
                  className="m-0 rounded-lg border-none text-success font-semibold ml-auto flex items-center gap-1 text-xs py-0.5 px-2"
                  style={{
                    background: "color-mix(in srgb, var(--success) 8%, transparent)",
                  }}
                >
                  <CheckCircle size={12} /> Read
                </span>
              )}
            </div>
            <h3 className="m-0 font-display leading-snug">{passage.title}</h3>
          </div>

          <div className="py-5 px-6 pb-7">
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
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {!marked ? (
            <button
              type="button"
              onClick={markRead}
              className="rounded-xl font-semibold h-11 px-7 border-none bg-accent text-[var(--text-on-accent)] cursor-pointer flex items-center gap-2"
            >
              <CheckCircle size={16} /> Mark as Read
            </button>
          ) : (
            <div
              className="rounded-2xl w-full border-none py-5 px-6"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--secondary))" }}
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <span
                  className="text-sm font-medium flex items-center gap-1.5"
                  style={{ color: "rgba(255,255,255,0.9)" }}
                >
                  <Star size={16} /> You&apos;ve completed the reading! Check your vocabulary now?
                </span>
                <button
                  type="button"
                  onClick={() => router.push(`/reading/graded/${id}/cloze`)}
                  className="rounded-xl font-bold h-11 px-5 cursor-pointer flex items-center gap-2"
                  style={{
                    border: "2px solid var(--surface)",
                    background: "rgba(255,255,255,0.15)",
                    color: "var(--text-on-accent)",
                  }}
                >
                  <ClipboardList size={14} /> Take Cloze Test
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
