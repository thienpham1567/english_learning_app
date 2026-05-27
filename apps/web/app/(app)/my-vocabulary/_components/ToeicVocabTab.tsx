"use client";

import { Progress } from "antd";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  BookOpen,
  Building2,
  CheckCircle,
  ChevronRight,
  Coins,
  Factory,
  Laptop,
  Loader2,
  Megaphone,
  Plane,
  Search,
  Star,
  Utensils,
  Volume2,
} from "lucide-react";
import * as m from "motion/react-client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { api } from "@/lib/api-client";

type ToeicWord = {
  id: string;
  word: string;
  pos: string;
  ipa: string | null;
  meaningVi: string;
  meaningEn: string;
  exampleEn: string | null;
  exampleVi: string | null;
  topic: string;
  level: string;
  audioUrl: string | null;
  frequency: number;
};

type WordProgress = {
  status: string;
  dueAt: string | null;
  attemptCount: number;
  easeFactor: number;
};

const TOPIC_META: Record<string, { icon: React.ComponentType<{ className?: string; size?: number }>; label: string; color: string }> = {
  office: { icon: Building2, label: "Office", color: "var(--module-assessment)" },
  business: { icon: BarChart3, label: "Business", color: "#0ea5e9" },
  finance: { icon: Coins, label: "Finance", color: "var(--warning)" },
  marketing: { icon: Megaphone, label: "Marketing", color: "#ec4899" },
  manufacturing: { icon: Factory, label: "Manufacturing", color: "#78716c" },
  travel: { icon: Plane, label: "Travel", color: "#14b8a6" },
  restaurants: { icon: Utensils, label: "Restaurants", color: "var(--fire)" },
  health: { icon: Activity, label: "Health", color: "#22c55e" },
  technology: { icon: Laptop, label: "Technology", color: "#8b5cf6" },
  general: { icon: BookOpen, label: "General", color: "#64748b" },
};

type Pack = { topic: string; total: number; learned: number };

export function ToeicVocabTab() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [words, setWords] = useState<ToeicWord[]>([]);
  const [progress, setProgress] = useState<Record<string, WordProgress>>({});
  const [wordsLoading, setWordsLoading] = useState(false);
  const [expandedWord, setExpandedWord] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { speak } = useAudioPlayer();

  // Load topic packs
  useEffect(() => {
    api
      .get<{ packs: Pack[] }>("/toeic-vocab/due")
      .then((data) => {
        // The /due endpoint might not have packs, use a simpler approach
      })
      .catch(() => {});

    // Fetch topic counts from a simple endpoint
    fetch("/api/toeic-vocab/pack/office")
      .then((r) => r.json())
      .then(() => {})
      .catch(() => {});
  }, []);

  // Load all topics
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Load all topics by fetching each pack
        const topics = Object.keys(TOPIC_META);
        const results: Pack[] = [];
        for (const topic of topics) {
          try {
            const data = await api.get<{
              words: ToeicWord[];
              progress: Record<string, WordProgress>;
            }>(`/toeic-vocab/pack/${topic}`);
            results.push({
              topic,
              total: data.words?.length ?? 0,
              learned: Object.keys(data.progress ?? {}).length,
            });
          } catch {
            // topic might not exist
          }
        }
        if (!cancelled) {
          setPacks(results.filter((p) => p.total > 0));
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load words for selected topic
  const loadTopic = useCallback(async (topic: string) => {
    setActiveTopic(topic);
    setWordsLoading(true);
    setExpandedWord(null);
    setSearchQuery("");
    try {
      const data = await api.get<{ words: ToeicWord[]; progress: Record<string, WordProgress> }>(
        `/toeic-vocab/pack/${topic}`,
      );
      setWords(data.words ?? []);
      setProgress(data.progress ?? {});
    } catch {
      setWords([]);
      setProgress({});
    } finally {
      setWordsLoading(false);
    }
  }, []);

  const filteredWords = words.filter(
    (w) =>
      !searchQuery ||
      w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.meaningVi.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalLearned = packs.reduce((acc, p) => acc + p.learned, 0);
  const totalWords = packs.reduce((acc, p) => acc + p.total, 0);
  const overallPct = totalWords > 0 ? Math.round((totalLearned / totalWords) * 100) : 0;

  if (loading) {
    return (
      <div className="flex justify-center" style={{ padding: 60 }}>
        <Loader2 className="animate-spin text-accent" size={24} />
      </div>
    );
  }

  // Topic detail view
  if (activeTopic) {
    const meta = TOPIC_META[activeTopic] ?? {
      icon: BookOpen,
      label: activeTopic,
      color: "var(--accent)",
    };
    const topicPack = packs.find((p) => p.topic === activeTopic);
    const topicPct =
      topicPack && topicPack.total > 0
        ? Math.round((topicPack.learned / topicPack.total) * 100)
        : 0;

    return (
      <div className="w-[700px] mx-auto w-full">
        {/* Back button + header */}
        <div className="flex items-center gap-3 mb-5">
          <button
            type="button"
            onClick={() => setActiveTopic(null)}
            className="w-[36px] h-[36px] border-2 border-border bg-(--surface) text-text-secondary cursor-pointer grid text-sm"
            style={{ borderRadius: 10, placeItems: "center" }}
          >
            <ArrowLeft />
          </button>
          <div className="flex items-center gap-2">
            <div className="text-lg font-extrabold text-ink flex items-center gap-2">
              <span style={{ color: meta.color }}><meta.icon size={20} /></span>
              <span>{meta.label}</span>
            </div>
            <div className="text-text-muted text-xs">
              {topicPack?.learned ?? 0}/{topicPack?.total ?? 0} words learned · {topicPct}%
            </div>
          </div>
          <Link
            href={`/toeic/vocab/learn?pack=${encodeURIComponent(activeTopic)}&mode=new`}
            className="rounded-full text-[13px] font-bold"
            style={{
              marginLeft: "auto",
              padding: "8px 18px",
              background: meta.color,
              color: "#fff",
              textDecoration: "none",
            }}
          >
            Learn Now
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search
            className="absolute text-text-muted text-sm"
            style={{ left: 14, top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            type="text"
            placeholder="Search words in this topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border-2 border-border bg-(--surface) text-sm text-ink"
            style={{ padding: "10px 14px 10px 40px", outline: "none" }}
          />
        </div>

        {wordsLoading ? (
          <div className="flex justify-center" style={{ padding: 40 }}>
            <Loader2 className="animate-spin text-accent" size={24} />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {filteredWords.map((w, i) => {
              const isLearned = !!progress[w.id];
              const isExpanded = expandedWord === w.id;
              return (
                <m.div
                  key={w.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.5) }}
                  className="border-2 border-border overflow-hidden"
                  style={{
                    borderRadius: 14,
                    background: isExpanded
                      ? "color-mix(in srgb, var(--accent) 4%, var(--surface))"
                      : "var(--surface)",
                    transition: "background 0.2s",
                  }}
                >
                  {/* Row */}
                  <button
                    type="button"
                    onClick={() => setExpandedWord(isExpanded ? null : w.id)}
                    className="w-full flex items-center gap-3 py-3 px-4 border-none bg-transparent cursor-pointer text-left"
                  >
                    <div
                      className="w-[28px] h-[28px] rounded-lg grid shrink-0 text-xs"
                      style={{
                        placeItems: "center",
                        background: isLearned
                          ? "color-mix(in srgb, var(--success) 12%, var(--surface))"
                          : "var(--bg-deep)",
                        color: isLearned ? "var(--success)" : "var(--text-muted)",
                      }}
                    >
                      {isLearned ? (
                        <CheckCircle />
                      ) : (
                        <span className="font-extrabold text-[11px]">{i + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 w-[0px]">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-bold text-ink">{w.word}</span>
                        <span className="text-[11px] text-text-muted italic">{w.pos}</span>
                      </div>
                      <div
                        className="text-[13px] text-text-secondary overflow-hidden"
                        style={{ marginTop: 2, textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      >
                        {w.meaningVi}
                      </div>
                    </div>
                    <ChevronRight
                      className="text-[10px] text-text-muted"
                      style={{
                        transform: isExpanded ? "rotate(90deg)" : "none",
                        transition: "transform 0.2s",
                      }}
                    />
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div
                      className="anim-fade-in flex flex-col gap-2.5"
                      style={{ padding: "0 16px 16px" }}
                    >
                      <div className="h-[1px]" style={{ background: "var(--border)" }} />

                      {/* IPA + Audio */}
                      <div className="flex items-center gap-2.5">
                        {w.ipa && (
                          <span
                            className="rounded-md bg-bg-deep font-mono text-[13px] text-accent"
                            style={{ padding: "2px 8px" }}
                          >
                            {w.ipa}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            speak(w.word, "en-US");
                          }}
                          className="w-[28px] h-[28px] rounded-md border-2 border-border bg-(--surface) cursor-pointer grid text-accent text-[13px]"
                          style={{ placeItems: "center" }}
                        >
                          <Volume2 />
                        </button>
                      </div>

                      {/* Meanings */}
                      <div className="flex flex-col gap-1.5">
                        <div className="text-xs font-bold text-text-muted uppercase tracking-widest">
                          English Definition
                        </div>
                        <div className="text-sm text-ink leading-normal">{w.meaningEn}</div>
                      </div>

                      {/* Example */}
                      {w.exampleEn && (
                        <div
                          className="bg-bg-deep"
                          style={{
                            padding: "10px 14px",
                            borderRadius: 10,
                            borderLeft: "3px solid var(--accent)",
                          }}
                        >
                          <div className="text-[13px] text-ink italic leading-normal">
                            &ldquo;{w.exampleEn}&rdquo;
                          </div>
                          {w.exampleVi && (
                            <div className="text-xs text-text-muted mt-1">→ {w.exampleVi}</div>
                          )}
                        </div>
                      )}

                      {/* Action */}
                      <Link
                        href={`/toeic/vocab/learn?pack=${encodeURIComponent(activeTopic)}&mode=new`}
                        className="items-center gap-1.5 rounded-full text-xs font-bold"
                        style={{
                          display: "inline-flex",
                          padding: "7px 16px",
                          background: meta.color,
                          color: "#fff",
                          textDecoration: "none",
                          alignSelf: "flex-start",
                        }}
                      >
                        <BookOpen size={14} /> Learn this word
                      </Link>
                    </div>
                  )}
                </m.div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Topics grid
  return (
    <div className="w-[700px] mx-auto w-full">
      {/* Overall progress */}
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-(--surface) border-2 border-border mb-5"
        style={{ padding: "20px 22px", borderRadius: 18 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-bold text-ink">Overall Progress</div>
            <div className="text-xs text-text-muted" style={{ marginTop: 2 }}>
              {totalLearned} / {totalWords} words learned
            </div>
          </div>
          <div className="text-[28px] font-black text-accent font-display">{overallPct}%</div>
        </div>
        <div className="h-[6px]" style={{ borderRadius: 3, background: "var(--border)" }}>
          <div
            className="h-full"
            style={{
              width: `${overallPct}%`,
              borderRadius: 3,
              background: "linear-gradient(90deg, var(--accent), var(--secondary))",
              transition: "width 0.5s ease",
            }}
          />
        </div>
      </m.div>

      {/* Topics grid */}
      <div
        className="grid gap-2.5"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}
      >
        {packs.map((pack, i) => {
          const meta = TOPIC_META[pack.topic] ?? {
            icon: BookOpen,
            label: pack.topic,
            color: "var(--accent)",
          };
          const pct = pack.total > 0 ? Math.round((pack.learned / pack.total) * 100) : 0;
          return (
            <m.button
              key={pack.topic}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -3, boxShadow: "var(--shadow-md)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => loadTopic(pack.topic)}
              className="rounded-2xl text-left border-2 border-border bg-(--surface) cursor-pointer flex flex-col gap-2.5"
              style={{ padding: "18px 16px" }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-[40px] h-[40px] rounded-xl grid shrink-0 text-xl"
                  style={{
                    placeItems: "center",
                    background: `color-mix(in srgb, ${meta.color} 10%, var(--surface))`,
                    color: meta.color,
                  }}
                >
                  <meta.icon size={20} />
                </div>
                <div>
                  <div className="text-sm font-bold text-ink">{meta.label}</div>
                  <div className="text-text-muted text-[11px]">
                    {pack.learned}/{pack.total} words
                  </div>
                </div>
              </div>
              <Progress
                percent={pct}
                size="small"
                showInfo={false}
                strokeColor={
                  pct < 30 ? "var(--error)" : pct < 70 ? "var(--warning)" : "var(--success)"
                }
                className="m-0"
              />
            </m.button>
          );
        })}
      </div>

      {/* Learn button */}
      <div className="flex justify-center mt-6">
        <Link
          href="/toeic/vocab/learn?mode=review"
          className="rounded-full text-sm font-bold"
          style={{
            padding: "12px 28px",
            background: "var(--accent)",
            color: "var(--text-on-accent)",
            textDecoration: "none",
          }}
        >
          Review Vocabulary
        </Link>
      </div>
    </div>
  );
}
