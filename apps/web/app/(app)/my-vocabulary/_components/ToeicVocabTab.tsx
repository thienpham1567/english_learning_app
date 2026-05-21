"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import * as m from "motion/react-client";
import {
  BookOutlined,
  SearchOutlined,
  StarFilled,
  StarOutlined,
  SoundOutlined,
  CheckCircleFilled,
  LoadingOutlined,
  RightOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { Progress } from "antd";
import { api } from "@/lib/api-client";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

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

const TOPIC_META: Record<string, { emoji: string; label: string; color: string }> = {
  office: { emoji: "🏢", label: "Văn phòng", color: "var(--module-assessment)" },
  business: { emoji: "📊", label: "Kinh doanh", color: "#0ea5e9" },
  finance: { emoji: "💰", label: "Tài chính", color: "var(--warning)" },
  marketing: { emoji: "📣", label: "Marketing", color: "#ec4899" },
  manufacturing: { emoji: "🏭", label: "Sản xuất", color: "#78716c" },
  travel: { emoji: "✈️", label: "Du lịch", color: "#14b8a6" },
  restaurants: { emoji: "🍽️", label: "Nhà hàng", color: "var(--fire)" },
  health: { emoji: "🏥", label: "Sức khỏe", color: "#22c55e" },
  technology: { emoji: "💻", label: "Công nghệ", color: "#8b5cf6" },
  general: { emoji: "📚", label: "Chung", color: "#64748b" },
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
    api.get<{ packs: Pack[] }>("/toeic-vocab/due")
      .then(data => {
        // The /due endpoint might not have packs, use a simpler approach
      })
      .catch(() => {});

    // Fetch topic counts from a simple endpoint
    fetch("/api/toeic-vocab/pack/office")
      .then(r => r.json())
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
            const data = await api.get<{ words: ToeicWord[]; progress: Record<string, WordProgress> }>(
              `/toeic-vocab/pack/${topic}`
            );
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
          setPacks(results.filter(p => p.total > 0));
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load words for selected topic
  const loadTopic = useCallback(async (topic: string) => {
    setActiveTopic(topic);
    setWordsLoading(true);
    setExpandedWord(null);
    setSearchQuery("");
    try {
      const data = await api.get<{ words: ToeicWord[]; progress: Record<string, WordProgress> }>(
        `/toeic-vocab/pack/${topic}`
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

  const filteredWords = words.filter(w =>
    !searchQuery || w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.meaningVi.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalLearned = packs.reduce((acc, p) => acc + p.learned, 0);
  const totalWords = packs.reduce((acc, p) => acc + p.total, 0);
  const overallPct = totalWords > 0 ? Math.round((totalLearned / totalWords) * 100) : 0;

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
        <LoadingOutlined style={{ fontSize: 24, color: "var(--accent)" }} spin />
      </div>
    );
  }

  // Topic detail view
  if (activeTopic) {
    const meta = TOPIC_META[activeTopic] ?? { emoji: "📖", label: activeTopic, color: "var(--accent)" };
    const topicPack = packs.find(p => p.topic === activeTopic);
    const topicPct = topicPack && topicPack.total > 0
      ? Math.round((topicPack.learned / topicPack.total) * 100) : 0;

    return (
      <div style={{ maxWidth: 700, margin: "0 auto", width: "100%" }}>
        {/* Back button + header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button
            type="button"
            onClick={() => setActiveTopic(null)}
            style={{
              width: 36, height: 36, borderRadius: 10,
              border: "1px solid var(--border)", background: "var(--surface)",
              color: "var(--text-secondary)", cursor: "pointer",
              display: "grid", placeItems: "center", fontSize: 14,
            }}
          >
            <ArrowLeftOutlined />
          </button>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)" }}>
              {meta.emoji} {meta.label}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {topicPack?.learned ?? 0}/{topicPack?.total ?? 0} từ đã học · {topicPct}%
            </div>
          </div>
          <Link
            href={`/toeic/vocab/learn?pack=${encodeURIComponent(activeTopic)}&mode=new`}
            style={{
              marginLeft: "auto", padding: "8px 18px", borderRadius: 99,
              fontSize: 13, fontWeight: 700, background: meta.color,
              color: "#fff", textDecoration: "none",
            }}
          >
            Học ngay
          </Link>
        </div>

        {/* Search */}
        <div style={{
          position: "relative", marginBottom: 16,
        }}>
          <SearchOutlined style={{
            position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
            color: "var(--text-muted)", fontSize: 14,
          }} />
          <input
            type="text"
            placeholder="Tìm từ trong chủ đề..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: "100%", padding: "10px 14px 10px 40px", borderRadius: 12,
              border: "1px solid var(--border)", background: "var(--surface)",
              fontSize: 14, color: "var(--ink)", outline: "none",
            }}
          />
        </div>

        {wordsLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
            <LoadingOutlined style={{ fontSize: 24, color: "var(--accent)" }} spin />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {filteredWords.map((w, i) => {
              const isLearned = !!progress[w.id];
              const isExpanded = expandedWord === w.id;
              return (
                <m.div
                  key={w.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.5) }}
                  style={{
                    borderRadius: 14, border: "1px solid var(--border)",
                    background: isExpanded
                      ? "color-mix(in srgb, var(--accent) 4%, var(--surface))"
                      : "var(--surface)",
                    overflow: "hidden",
                    transition: "background 0.2s",
                  }}
                >
                  {/* Row */}
                  <button
                    type="button"
                    onClick={() => setExpandedWord(isExpanded ? null : w.id)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center",
                      gap: 12, padding: "12px 16px", border: "none",
                      background: "transparent", cursor: "pointer", textAlign: "left",
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, display: "grid",
                      placeItems: "center", flexShrink: 0, fontSize: 12,
                      background: isLearned
                        ? "color-mix(in srgb, var(--success) 12%, var(--surface))"
                        : "var(--bg-deep)",
                      color: isLearned ? "var(--success)" : "var(--text-muted)",
                    }}>
                      {isLearned ? <CheckCircleFilled /> : <span style={{ fontWeight: 800, fontSize: 11 }}>{i + 1}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
                          {w.word}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>
                          {w.pos}
                        </span>
                      </div>
                      <div style={{
                        fontSize: 13, color: "var(--text-secondary)", marginTop: 2,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {w.meaningVi}
                      </div>
                    </div>
                    <RightOutlined style={{
                      fontSize: 10, color: "var(--text-muted)",
                      transform: isExpanded ? "rotate(90deg)" : "none",
                      transition: "transform 0.2s",
                    }} />
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="anim-fade-in" style={{
                      padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 10,
                    }}>
                      <div style={{ height: 1, background: "var(--border)" }} />

                      {/* IPA + Audio */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {w.ipa && (
                          <span style={{
                            padding: "2px 8px", borderRadius: 6,
                            background: "var(--bg-deep)", fontFamily: "var(--font-mono)",
                            fontSize: 13, color: "var(--accent)",
                          }}>
                            {w.ipa}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); speak(w.word, "en-US"); }}
                          style={{
                            width: 28, height: 28, borderRadius: 6, border: "1px solid var(--border)",
                            background: "var(--surface)", cursor: "pointer", display: "grid",
                            placeItems: "center", color: "var(--accent)", fontSize: 13,
                          }}
                        >
                          <SoundOutlined />
                        </button>
                      </div>

                      {/* Meanings */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          Nghĩa tiếng Anh
                        </div>
                        <div style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.5 }}>
                          {w.meaningEn}
                        </div>
                      </div>

                      {/* Example */}
                      {w.exampleEn && (
                        <div style={{
                          padding: "10px 14px", borderRadius: 10,
                          background: "var(--bg-deep)", borderLeft: "3px solid var(--accent)",
                        }}>
                          <div style={{ fontSize: 13, color: "var(--ink)", fontStyle: "italic", lineHeight: 1.5 }}>
                            &ldquo;{w.exampleEn}&rdquo;
                          </div>
                          {w.exampleVi && (
                            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                              → {w.exampleVi}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action */}
                      <Link
                        href={`/toeic/vocab/learn?pack=${encodeURIComponent(activeTopic)}&mode=new`}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          padding: "7px 16px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                          background: meta.color, color: "#fff", textDecoration: "none",
                          alignSelf: "flex-start",
                        }}
                      >
                        <BookOutlined /> Học từ này
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
    <div style={{ maxWidth: 700, margin: "0 auto", width: "100%" }}>
      {/* Overall progress */}
      <m.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        style={{
          padding: "20px 22px", borderRadius: 18,
          background: "var(--surface)", border: "1px solid var(--border)",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
              Tiến độ tổng thể
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              {totalLearned} / {totalWords} từ đã học
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "var(--accent)", fontFamily: "var(--font-display)" }}>
            {overallPct}%
          </div>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: "var(--border)" }}>
          <div style={{
            width: `${overallPct}%`, height: "100%", borderRadius: 3,
            background: "linear-gradient(90deg, var(--accent), var(--secondary))",
            transition: "width 0.5s ease",
          }} />
        </div>
      </m.div>

      {/* Topics grid */}
      <div style={{
        display: "grid", gap: 10,
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
      }}>
        {packs.map((pack, i) => {
          const meta = TOPIC_META[pack.topic] ?? { emoji: "📖", label: pack.topic, color: "var(--accent)" };
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
              style={{
                padding: "18px 16px", borderRadius: 16, textAlign: "left",
                border: "1px solid var(--border)", background: "var(--surface)",
                cursor: "pointer", display: "flex", flexDirection: "column", gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, display: "grid",
                  placeItems: "center", fontSize: 20,
                  background: `color-mix(in srgb, ${meta.color} 10%, var(--surface))`,
                }}>
                  {meta.emoji}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
                    {meta.label}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {pack.learned}/{pack.total} từ
                  </div>
                </div>
              </div>
              <Progress
                percent={pct}
                size="small"
                showInfo={false}
                strokeColor={pct < 30 ? "var(--error)" : pct < 70 ? "var(--warning)" : "var(--success)"}
                style={{ margin: 0 }}
              />
            </m.button>
          );
        })}
      </div>

      {/* Learn button */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
        <Link
          href="/toeic/vocab/learn?mode=review"
          style={{
            padding: "12px 28px", borderRadius: 99, fontSize: 14, fontWeight: 700,
            background: "var(--accent)", color: "var(--text-on-accent)", textDecoration: "none",
          }}
        >
          Ôn tập từ vựng
        </Link>
      </div>
    </div>
  );
}
