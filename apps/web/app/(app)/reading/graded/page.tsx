"use client";

import {
  Archive,
  BookOpen,
  CheckCircle,
  ChevronRight,
  Cloud,
  Coffee,
  FileText,
  Filter,
  FlaskConical,
  Heart,
  Home,
  Laptop,
  Loader2,
  MapPin,
  Star,
  Store,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";

type PassageItem = {
  id: string;
  title: string;
  cefrLevel: string;
  section: string;
  wordCount: number;
  newWordsCount: number;
  isRead: boolean;
  score: number;
};

const LEVELS = ["", "A2", "B1", "B2", "C1", "C2"] as const;

const LEVEL_COLORS: Record<string, string> = {
  A2: "var(--success)",
  B1: "var(--info)",
  B2: "var(--info)",
  C1: "var(--accent)",
  C2: "var(--module-grammar)",
};

const LEVEL_LABELS: Record<string, string> = {
  "": "All Levels",
  A2: "A2 · Elementary",
  B1: "B1 · Intermediate",
  B2: "B2 · Upper-Int",
  C1: "C1 · Advanced",
  C2: "C2 · Proficiency",
};

const SECTION_ICONS: Record<string, React.ReactNode> = {
  lifestyle: <Home size={12} />,
  travel: <MapPin size={12} />,
  food: <Coffee size={12} />,
  health: <Heart size={12} />,
  technology: <Laptop size={12} />,
  environment: <Cloud size={12} />,
  education: <Archive size={12} />,
  science: <FlaskConical size={12} />,
  business: <Store size={12} />,
};

export default function GradedReaderPage() {
  const router = useRouter();
  const [passages, setPassages] = useState<PassageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState("");

  const fetchPassages = useCallback(async (lv: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort: "priority" });
      if (lv) params.set("level", lv);
      const data = await api.get<{ passages: PassageItem[] }>(`/reading/passages?${params}`);
      setPassages(data.passages ?? []);
    } catch {
      setPassages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPassages(level);
  }, [level, fetchPassages]);

  const readCount = passages.filter((p) => p.isRead).length;

  return (
    <div className="anim-fade-up h-full overflow-y-auto p-6">
      <div className="w-full max-w-[800px] mx-auto flex flex-col gap-5">
        {/* Hero header */}
        <div
          className="border-none rounded-[20px] py-6 px-7"
          style={{
            background: "linear-gradient(135deg, var(--accent), var(--secondary))",
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 flex items-center justify-center rounded-[14px]"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              <BookOpen className="text-3xl" style={{ color: "var(--text-on-accent)" }} />
            </div>
            <div>
              <span
                className="text-[11px] uppercase block"
                style={{ letterSpacing: "0.12em", color: "rgba(255,255,255,0.7)" }}
              >
                GRADED READER
              </span>
              <h3
                className="m-0 font-display italic"
                style={{ color: "var(--text-on-accent)" }}
              >
                Read by CEFR Level
              </h3>
            </div>
            {passages.length > 0 && (
              <div className="text-center ml-auto">
                <span className="text-2xl font-bold" style={{ color: "var(--text-on-accent)" }}>
                  {readCount}/{passages.length}
                </span>
                <br />
                <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.7)" }}>
                  read
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Level filter pills */}
        <div className="rounded-2xl py-3 px-4 border border-border">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="text-text-muted text-sm" />
            {LEVELS.map((lv) => {
              const active = level === lv;
              const color = LEVEL_COLORS[lv] || "var(--accent)";
              return (
                <button
                  key={lv}
                  type="button"
                  onClick={() => setLevel(lv)}
                  className="text-xs font-semibold cursor-pointer py-1.5 px-4 rounded-[20px] transition-all duration-200"
                  style={{
                    border: active ? `2px solid ${color}` : "1px solid var(--border)",
                    background: active ? color : "transparent",
                    color: active ? "var(--text-on-accent)" : "var(--text-secondary)",
                  }}
                >
                  {LEVEL_LABELS[lv]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Passages list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-accent" size={32} />
          </div>
        ) : passages.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-15">
            <BookOpen className="text-text-muted" size={48} />
            <span className="text-text-muted text-sm">No passages available for this level</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {passages.map((p) => (
              <div
                key={p.id}
                onClick={() => router.push(`/reading/graded/${p.id}`)}
                className="rounded-2xl cursor-pointer py-3.5 px-5 border border-border hover:border-accent hover:bg-accent-light transition-all duration-200"
                style={{ opacity: p.isRead ? 0.75 : 1 }}
              >
                <div className="flex items-center gap-3.5">
                  {/* Read indicator icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: p.isRead
                        ? "linear-gradient(135deg, var(--success)20, var(--success)10)"
                        : `linear-gradient(135deg, ${LEVEL_COLORS[p.cefrLevel] || "var(--accent)"}15, ${LEVEL_COLORS[p.cefrLevel] || "var(--accent)"}08)`,
                    }}
                  >
                    {p.isRead ? (
                      <CheckCircle className="text-xl text-emerald-500" />
                    ) : (
                      <FileText
                        className="text-lg"
                        style={{ color: LEVEL_COLORS[p.cefrLevel] || "var(--accent)" }}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold overflow-hidden text-ellipsis whitespace-nowrap block">
                      {p.title}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="m-0 text-[10px] font-bold rounded-md border-none py-px px-1.5"
                        style={{
                          background: LEVEL_COLORS[p.cefrLevel] || undefined,
                          color: LEVEL_COLORS[p.cefrLevel] ? "var(--text-on-accent)" : undefined,
                        }}
                      >
                        {p.cefrLevel}
                      </span>
                      <span className="text-[11px] text-text-muted flex items-center gap-1">
                        {SECTION_ICONS[p.section]} {p.wordCount} words
                      </span>
                    </div>
                  </div>

                  {/* New words badge */}
                  {p.newWordsCount > 0 && (
                    <span
                      className="m-0 rounded-xl border-none text-accent font-semibold text-[11px] flex items-center gap-1 py-0.5 px-2.5"
                      style={{
                        background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                      }}
                    >
                      <Star size={10} />
                      {p.newWordsCount} new
                    </span>
                  )}

                  <ChevronRight className="text-xs text-text-muted shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
