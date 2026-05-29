"use client";

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
import { Card } from "@/components/ui/card";

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

const TOPIC_META: Record<
  string,
  { icon: React.ComponentType<{ className?: string; size?: number }>; label: string; color: string }
> = {
  office: { icon: Building2, label: "Office", color: "var(--module-assessment)" },
  business: { icon: BarChart3, label: "Business", color: "var(--module-reading)" },
  finance: { icon: Coins, label: "Finance", color: "var(--warning)" },
  marketing: { icon: Megaphone, label: "Marketing", color: "var(--module-review)" },
  manufacturing: { icon: Factory, label: "Manufacturing", color: "var(--tertiary)" },
  travel: { icon: Plane, label: "Travel", color: "var(--module-reading)" },
  restaurants: { icon: Utensils, label: "Restaurants", color: "var(--fire)" },
  health: { icon: Activity, label: "Health", color: "var(--success)" },
  technology: { icon: Laptop, label: "Technology", color: "var(--module-grammar)" },
  general: { icon: BookOpen, label: "General", color: "var(--text-muted)" },
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
      .then(() => {})
      .catch(() => {});

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
      <div className="flex justify-center py-16">
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
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-4">
        {/* Back button + header */}
        <Card
          className="flex-col sm:flex-row sm:items-center gap-4 bg-surface p-5 rounded-2xl"
          shadowSize="sm"
        >
          <button
            type="button"
            onClick={() => setActiveTopic(null)}
            className="w-9 h-9 border-2 border-border bg-surface hover:bg-surface-hover text-text-secondary cursor-pointer flex items-center justify-center rounded-xl shadow-sm transition-colors shrink-0"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="w-6 h-6 rounded-lg flex items-center justify-center border-2 border-border/10"
                style={{ color: meta.color }}
              >
                <meta.icon size={18} />
              </span>
              <h2 className="text-lg font-black text-text-primary font-display leading-tight">
                {meta.label}
              </h2>
            </div>
            <p className="text-text-muted text-[10px] font-extrabold uppercase mt-1 font-mono tracking-wider">
              {topicPack?.learned ?? 0}/{topicPack?.total ?? 0} words learned · {topicPct}% complete
            </p>
          </div>

          <Link
            href={`/toeic/vocab/learn?pack=${encodeURIComponent(activeTopic)}&mode=new`}
            className="inline-flex items-center justify-center shrink-0 px-5 py-2.5 rounded-xl text-xs font-black text-white hover:-translate-y-0.5 transition-all cursor-pointer shadow-sm no-underline"
            style={{ background: meta.color }}
          >
            Learn Now
          </Link>
        </Card>

        {/* Search */}
        <div className="relative w-full">
          <Search className="absolute text-text-muted h-4 w-4 left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search words in this topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border-2 border-border bg-surface text-xs font-bold text-ink pl-10 pr-4 py-3 shadow-sm outline-none focus:border-accent transition-colors"
          />
        </div>

        {wordsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-accent" size={24} />
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filteredWords.map((w, i) => {
              const isLearned = !!progress[w.id];
              const isExpanded = expandedWord === w.id;
              return (
                <m.div
                  key={w.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.4) }}
                >
                  <Card
                    shadowSize="sm"
                    bgType={isExpanded ? "accent-light" : "default"}
                    className="p-0 gap-0 overflow-hidden bg-surface"
                  >
                    {/* Row */}
                    <button
                      type="button"
                      onClick={() => setExpandedWord(isExpanded ? null : w.id)}
                      className="w-full flex items-center gap-3 py-3 px-4 border-none bg-transparent cursor-pointer text-left"
                    >
                      <div
                        className={`w-7 h-7 rounded-lg border-2 border-border grid shrink-0 text-xs font-black place-items-center ${
                          isLearned
                            ? "bg-success/10 border-success/30 text-success"
                            : "bg-bg-deep text-text-muted"
                        }`}
                      >
                        {isLearned ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <span className="font-mono text-[10px]">{i + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-text-primary">{w.word}</span>
                          <span className="text-[10px] text-text-muted font-bold italic font-mono">
                            ({w.pos})
                          </span>
                        </div>
                        <div className="text-xs text-text-secondary mt-1 truncate max-w-full font-semibold">
                          {w.meaningVi}
                        </div>
                      </div>
                      <ChevronRight
                        className={`text-text-muted h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                      />
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="flex flex-col gap-3.5 px-4 pb-4.5 pt-1.5 border-t-2 border-dashed border-border/40">
                        {/* IPA + Audio */}
                        <div className="flex items-center gap-2 mt-1">
                          {w.ipa && (
                            <span className="rounded-lg bg-bg-deep border-2 border-border/20 font-mono text-[11px] font-extrabold text-ink px-2.5 py-0.5">
                              /{w.ipa}/
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              speak(w.word, "en-US");
                            }}
                            className="w-7 h-7 rounded-lg border-2 border-border bg-surface hover:bg-surface-hover text-text-secondary hover:text-accent hover:border-accent cursor-pointer flex items-center justify-center shadow-sm transition-colors"
                          >
                            <Volume2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Meanings */}
                        <div className="flex flex-col gap-1">
                          <div className="text-[9px] font-extrabold text-text-muted uppercase tracking-wider font-display">
                            English Definition
                          </div>
                          <div className="text-xs md:text-sm text-text-primary leading-normal font-semibold">
                            {w.meaningEn}
                          </div>
                        </div>

                        {/* Example */}
                        {w.exampleEn && (
                          <Card
                            size="sm"
                            bgType="alt"
                            accentColor="accent"
                            accentPosition="left"
                            shadowSize="sm"
                            className="gap-1 p-3.5"
                          >
                            <div className="text-xs md:text-sm text-text-primary italic leading-normal font-semibold">
                              &ldquo;{w.exampleEn}&rdquo;
                            </div>
                            {w.exampleVi && (
                              <div className="text-[10px] text-text-muted font-bold mt-1">
                                → {w.exampleVi}
                              </div>
                            )}
                          </Card>
                        )}

                        {/* Action */}
                        <Link
                          href={`/toeic/vocab/learn?pack=${encodeURIComponent(activeTopic)}&mode=new`}
                          className="inline-flex items-center gap-2 rounded-xl text-xs font-black px-4 py-2 text-white hover:opacity-90 w-fit shadow-sm no-underline"
                          style={{ background: meta.color }}
                        >
                          <BookOpen size={13} className="shrink-0" />
                          <span>Learn this word</span>
                        </Link>
                      </div>
                    )}
                  </Card>
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
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-5">
      {/* Overall progress */}
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card shadowSize="default" className="bg-surface p-6 gap-3.5 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-text-primary font-display uppercase tracking-wider">
                Overall Progress
              </h3>
              <p className="text-xs text-text-secondary font-semibold mt-1">
                {totalLearned} / {totalWords} words learned
              </p>
            </div>
            <div className="text-2xl font-black text-text-primary font-mono leading-none">
              {overallPct}%
            </div>
          </div>
          <div className="h-3 rounded-full bg-bg-deep overflow-hidden relative border-2 border-border">
            <div
              style={{ width: `${overallPct}%` }}
              className="h-full rounded-full bg-gradient-to-r from-accent to-secondary transition-all duration-500 ease-out"
            />
          </div>
        </Card>
      </m.div>

      {/* Topics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
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
              whileHover={{
                y: -3,
                x: -1,
                rotate: i % 2 === 0 ? 0.5 : -0.5,
                boxShadow: "var(--shadow)",
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => loadTopic(pack.topic)}
              className="text-left border-none bg-transparent cursor-pointer p-0 block w-full"
            >
              <Card shadowSize="sm" className="bg-surface gap-3 p-5 h-full group text-left">
                <div className="flex items-center gap-3.5 w-full">
                  <div
                    className="w-11 h-11 rounded-xl border-2 border-border grid shrink-0 place-items-center text-xl shadow-sm animate-none"
                    style={{
                      background: `color-mix(in srgb, ${meta.color} 10%, var(--surface))`,
                      borderColor: `color-mix(in srgb, ${meta.color} 30%, var(--border))`,
                      color: meta.color,
                    }}
                  >
                    <meta.icon size={20} className="group-hover:animate-bounce" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-black text-text-primary font-display truncate leading-tight">
                      {meta.label}
                    </div>
                    <div className="text-text-muted text-[10px] font-extrabold mt-1.5 uppercase font-mono leading-none tracking-wider">
                      {pack.learned}/{pack.total} words
                    </div>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-bg-deep border-2 border-border overflow-hidden relative">
                  <div
                    style={{ width: `${pct}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      pct < 30 ? "bg-error" : pct < 70 ? "bg-warning" : "bg-success"
                    }`}
                  />
                </div>
              </Card>
            </m.button>
          );
        })}
      </div>

      {/* Review Button */}
      <div className="flex justify-center mt-4">
        <Link
          href="/toeic/vocab/learn?mode=review"
          className="rounded-2xl text-sm font-black px-8 py-3.5 bg-accent border-2 border-border text-ink shadow-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 cursor-pointer no-underline"
        >
          Review Vocabulary
        </Link>
      </div>
    </div>
  );
}
