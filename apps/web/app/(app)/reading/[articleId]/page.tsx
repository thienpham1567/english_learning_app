"use client";

import { Modal, Select } from "antd";
import { ArrowLeft, BookOpenText, Clock, Globe, Lightbulb, Loader2, Volume2 } from "lucide-react";
import * as m from "motion/react-client";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api-client";

type Article = {
  id: string;
  title: string;
  trailText: string;
  author: string;
  date: string;
  thumbnail: string | null;
  section: string;
  wordCount: number;
  readTime: number;
  difficulty: string;
  paragraphs: string[];
};

type GrammarPattern = {
  name: string;
  explanation: string;
  phrase: string;
  color: string;
};

const PATTERN_COLORS: Record<string, string> = {
  green: "var(--success)",
  blue: "var(--info)",
  yellow: "var(--warning)",
  purple: "var(--accent)",
};

const DIFFICULTY_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  B1: {
    bg: "rgba(16, 185, 129, 0.08)",
    color: "var(--success)",
    border: "rgba(16, 185, 129, 0.2)",
  },
  B2: {
    bg: "rgba(245, 158, 11, 0.08)",
    color: "var(--warning)",
    border: "rgba(245, 158, 11, 0.2)",
  },
  C1: { bg: "rgba(239, 68, 68, 0.08)", color: "var(--error)", border: "rgba(239, 68, 68, 0.2)" },
};

export default function ArticleReaderPage() {
  const router = useRouter();
  const params = useParams<{ articleId: string }>();
  const articleId = params.articleId;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grammarResults, setGrammarResults] = useState<Record<number, GrammarPattern[]>>({});
  const [grammarLoading, setGrammarLoading] = useState<Set<number>>(new Set());
  const [ttsAccent, setTtsAccent] = useState("us");
  const [grammarPopup, setGrammarPopup] = useState<number | null>(null);

  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [loadingAudioIdx, setLoadingAudioIdx] = useState<number | null>(null);
  const paragraphAudioRef = useRef<HTMLAudioElement | null>(null);
  const paragraphAudioUrlRef = useRef<string | null>(null);
  const analyzedSetRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!articleId) return;
    setLoading(true);
    setGrammarResults({});
    analyzedSetRef.current.clear();
    api
      .get<Article>(`/reading/article/${articleId}`)
      .then((data) => setArticle(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [articleId]);

  const analyzeGrammar = useCallback(async (index: number, text: string) => {
    if (analyzedSetRef.current.has(index)) return;
    analyzedSetRef.current.add(index);
    setGrammarLoading((prev) => new Set(prev).add(index));

    try {
      const data = await api.post<{ patterns?: GrammarPattern[] }>("/reading/grammar", {
        paragraph: text,
      });
      const patterns = data.patterns ?? [];
      setGrammarResults((prev) => ({ ...prev, [index]: patterns }));
      if (patterns.length > 0) setGrammarPopup(index);
    } catch {
      setGrammarResults((prev) => ({ ...prev, [index]: [] }));
    } finally {
      setGrammarLoading((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  }, []);

  useEffect(() => {
    return () => {
      if (paragraphAudioRef.current) paragraphAudioRef.current.pause();
      if (paragraphAudioUrlRef.current) URL.revokeObjectURL(paragraphAudioUrlRef.current);
    };
  }, []);

  const handleSpeakParagraph = useCallback(
    async (idx: number, text: string) => {
      if (speakingIdx === idx) {
        if (paragraphAudioRef.current) paragraphAudioRef.current.pause();
        if (paragraphAudioUrlRef.current) URL.revokeObjectURL(paragraphAudioUrlRef.current);
        paragraphAudioRef.current = null;
        paragraphAudioUrlRef.current = null;
        setSpeakingIdx(null);
        return;
      }

      if (paragraphAudioRef.current) paragraphAudioRef.current.pause();
      if (paragraphAudioUrlRef.current) URL.revokeObjectURL(paragraphAudioUrlRef.current);
      paragraphAudioRef.current = null;
      paragraphAudioUrlRef.current = null;

      setLoadingAudioIdx(idx);
      setSpeakingIdx(null);

      try {
        const res = await fetch("/api/reading/audio/paragraph", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, accent: ttsAccent }),
        });
        if (!res.ok) throw new Error("TTS failed");

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);

        paragraphAudioRef.current = audio;
        paragraphAudioUrlRef.current = url;

        audio.onended = () => {
          setSpeakingIdx(null);
          URL.revokeObjectURL(url);
          paragraphAudioRef.current = null;
          paragraphAudioUrlRef.current = null;
        };
        audio.onerror = () => {
          setSpeakingIdx(null);
          URL.revokeObjectURL(url);
          paragraphAudioRef.current = null;
          paragraphAudioUrlRef.current = null;
        };

        await audio.play();
        setSpeakingIdx(idx);
      } catch {
        setSpeakingIdx(null);
      } finally {
        setLoadingAudioIdx(null);
      }
    },
    [speakingIdx, ttsAccent],
  );

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4">
        <Loader2 className="animate-spin text-accent" size={32} />
        <span className="text-text-secondary font-bold" style={{ fontSize: 13.5 }}>
          Đang tải nội dung bài báo...
        </span>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 p-8">
        <span className="text-base font-extrabold text-text-secondary">
          Không tìm thấy bài viết yêu cầu.
        </span>
        <m.button
          onClick={() => router.push("/reading")}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="rounded-lg border-none font-extrabold cursor-pointer"
          style={{
            padding: "8px 24px",
            background: "var(--accent)",
            color: "var(--text-on-accent)",
          }}
        >
          Quay lại danh sách
        </m.button>
      </div>
    );
  }

  const diffStyle = DIFFICULTY_COLORS[article.difficulty] ?? DIFFICULTY_COLORS.B1;

  return (
    <div className="relative flex h-full h-[0px] flex-1 flex-col overflow-hidden">
      <div className="grain-overlay" style={{ opacity: 0.03, zIndex: 0 }} />

      {/* Reader Scroll Container */}
      <div
        className="relative h-[0px] flex-1 overflow-y-auto z-[1]"
        style={{ padding: "24px 20px 80px" }}
      >
        <style>{`
          .ant-select-selector {
            background-color: var(--surface-alt) !important;
            border-color: var(--border) !important;
            color: var(--text-primary) !important;
            font-weight: 700 !important;
          }
          .ant-select-arrow {
            color: var(--text-muted) !important;
          }
          .ant-modal-content {
            background-color: var(--surface) !important;
            padding: 0 !important;
            overflow: hidden;
            border-radius: var(--radius-xl) !important;
            border: 1px solid var(--border) !important;
          }
        `}</style>

        <div className="w-[720px] mx-auto flex flex-col gap-5">
          {/* Header Action Menu */}
          <div
            className="flex items-center justify-between"
            style={{ borderBottom: "1px solid var(--border)", paddingBottom: 14 }}
          >
            <m.button
              onClick={() => router.push("/reading")}
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
              className="items-center gap-2 py-1.5 px-3.5 rounded-lg border-2 border-border bg-(--surface) text-text-secondary font-extrabold cursor-pointer"
              style={{ display: "inline-flex", fontSize: 12.5 }}
            >
              <ArrowLeft />
              <span>Quay lại</span>
            </m.button>

            <span
              className="text-[11px] font-black rounded-md text-accent uppercase tracking-wider"
              style={{
                padding: "4px 10px",
                background: "var(--accent-light)",
                border: "1.5px solid var(--accent-muted)",
              }}
            >
              <BookOpenText style={{ marginRight: 6 }} /> {article.section}
            </span>
          </div>

          {/* Title and Metadata */}
          <div className="flex flex-col gap-2.5">
            <h2
              className="font-display text-text-primary m-0"
              style={{ fontSize: 26, fontWeight: 950, lineHeight: 1.3 }}
            >
              {article.title}
            </h2>

            {article.trailText && (
              <p className="text-[15px] leading-normal text-text-secondary font-medium m-0">
                {article.trailText.replace(/<[^>]*>/g, "")}
              </p>
            )}

            <div
              className="flex gap-3 flex-wrap mt-1.5 pb-4"
              style={{ alignContent: "center", borderBottom: "1px dashed var(--border)" }}
            >
              {article.author && (
                <span className="text-text-muted font-bold" style={{ fontSize: 12.5 }}>
                  By {article.author}
                </span>
              )}
              <span style={{ color: "var(--border-strong)" }}>|</span>
              <div
                className="items-center gap-1 text-text-muted font-bold"
                style={{ display: "inline-flex", fontSize: 12.5 }}
              >
                <Clock />
                <span>{article.readTime} phút đọc</span>
              </div>
              <span style={{ color: "var(--border-strong)" }}>|</span>
              <span
                className="text-[11px] font-extrabold rounded-md"
                style={{
                  padding: "2px 8px",
                  background: diffStyle.bg,
                  color: diffStyle.color,
                  border: `1.5px solid ${diffStyle.border}`,
                }}
              >
                Trình độ: {article.difficulty}
              </span>

              <div style={{ marginLeft: "auto" }}>
                <Select
                  value={ttsAccent}
                  onChange={(v) => {
                    setTtsAccent(v);
                    if (speakingIdx !== null || paragraphAudioRef.current) {
                      if (paragraphAudioRef.current) paragraphAudioRef.current.pause();
                      if (paragraphAudioUrlRef.current)
                        URL.revokeObjectURL(paragraphAudioUrlRef.current);
                      paragraphAudioRef.current = null;
                      paragraphAudioUrlRef.current = null;
                      setSpeakingIdx(null);
                    }
                  }}
                  size="small"
                  options={[
                    { value: "us", label: "🇺🇸 US English" },
                    { value: "uk", label: "🇬🇧 UK English" },
                    { value: "au", label: "🇦🇺 AU English" },
                  ]}
                  className="w-[140px]"
                />
              </div>
            </div>
          </div>

          {/* Main Thumbnail Image */}
          {article.thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.thumbnail}
              alt={article.title}
              className="w-full h-[340px] rounded-(--radius-xl)"
              style={{ objectFit: "cover", border: "1.5px solid var(--border)" }}
            />
          )}

          {/* Reader Body Content */}
          <div
            className="font-medium text-text-primary flex flex-col gap-5"
            style={{ fontSize: 16.5, lineHeight: 1.85, letterSpacing: "0.01em" }}
          >
            {article.paragraphs.map((para, idx) => (
              <div key={idx} className="relative" style={{ paddingRight: 60 }}>
                <p className="m-0" style={{ textAlign: "justify" }}>
                  {para}
                </p>

                {/* Floating control buttons per paragraph */}
                <div
                  className="absolute flex flex-col gap-1.5"
                  style={{ right: 0, top: "50%", transform: "translateY(-50%)" }}
                >
                  {/* Grammar Analysis trigger */}
                  <m.button
                    onClick={() => {
                      if (grammarLoading.has(idx)) return;
                      if (grammarResults[idx] === undefined) {
                        analyzeGrammar(idx, para);
                      } else if (grammarResults[idx]?.length) {
                        setGrammarPopup(idx);
                      }
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Phân tích ngữ pháp"
                    className="w-[26px] h-[26px] rounded-full border-2 border-border flex items-center justify-center"
                    style={{
                      background: grammarResults[idx]?.length
                        ? "linear-gradient(135deg, var(--accent), var(--secondary))"
                        : "var(--surface)",
                      color: grammarResults[idx]?.length
                        ? "var(--text-on-accent)"
                        : "var(--text-muted)",
                      cursor: grammarLoading.has(idx) ? "wait" : "pointer",
                    }}
                  >
                    {grammarLoading.has(idx) ? (
                      <Loader2 className="animate-spin" size={10} />
                    ) : (
                      <Lightbulb style={{ fontSize: 11.5 }} />
                    )}
                  </m.button>

                  {/* Play Speech trigger */}
                  <m.button
                    onClick={() => handleSpeakParagraph(idx, para)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Nghe đoạn này"
                    className="w-[26px] h-[26px] rounded-full border-2 border-border flex items-center justify-center"
                    style={{
                      background:
                        speakingIdx === idx
                          ? "linear-gradient(135deg, var(--info), var(--accent))"
                          : "var(--surface)",
                      color: speakingIdx === idx ? "var(--text-on-accent)" : "var(--text-muted)",
                      cursor: loadingAudioIdx === idx ? "wait" : "pointer",
                    }}
                  >
                    {loadingAudioIdx === idx ? (
                      <Loader2 className="animate-spin" size={10} />
                    ) : speakingIdx === idx ? (
                      <Volume2 size={11} />
                    ) : (
                      <Volume2 size={11} />
                    )}
                  </m.button>
                </div>
              </div>
            ))}
          </div>

          {/* Grammar Popup Modal */}
          <Modal
            open={grammarPopup !== null}
            onCancel={() => setGrammarPopup(null)}
            footer={null}
            centered
            width={600}
            closeIcon={
              <span className="text-[13px] font-black" style={{ color: "var(--text-on-accent)" }}>
                ✕
              </span>
            }
          >
            {grammarPopup !== null && grammarResults[grammarPopup] && (
              <div>
                {/* Header banner */}
                <div
                  className="py-4 px-5 flex items-center gap-2"
                  style={{
                    background: "linear-gradient(135deg, var(--accent), var(--secondary))",
                    color: "var(--text-on-accent)",
                  }}
                >
                  <Lightbulb size={16} />
                  <span className="font-black" style={{ fontSize: 14.5 }}>
                    Phân tích ngữ pháp của đoạn văn
                  </span>
                  <span
                    className="rounded-xl text-[10.5px] font-extrabold"
                    style={{ background: "rgba(255,255,255,0.2)", padding: "2px 8px" }}
                  >
                    {grammarResults[grammarPopup].length} cấu trúc
                  </span>
                </div>

                {/* Body details list */}
                <div
                  className="flex flex-col gap-3 h-[380px] overflow-y-auto bg-(--surface)"
                  style={{ padding: 20 }}
                >
                  {grammarResults[grammarPopup].map((pattern, pi) => (
                    <div
                      key={pi}
                      className="rounded-lg bg-surface-alt"
                      style={{
                        borderLeft: `4.5px solid ${PATTERN_COLORS[pattern.color] ?? "var(--border)"}`,
                        borderTop: "1px solid var(--border)",
                        borderRight: "1px solid var(--border)",
                        borderBottom: "1px solid var(--border)",
                        padding: "12px 14px",
                      }}
                    >
                      <span
                        className="font-black block mb-1.5"
                        style={{
                          fontSize: 13.5,
                          color: PATTERN_COLORS[pattern.color] ?? "var(--accent)",
                        }}
                      >
                        {pattern.name}
                      </span>

                      <div
                        className="bg-(--surface) rounded-md py-1.5 px-2.5 mb-2 font-bold text-text-primary border-2 border-border"
                        style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 12.5 }}
                      >
                        &quot;{pattern.phrase}&quot;
                      </div>

                      <p className="text-[13px] text-text-secondary leading-normal m-0 font-medium">
                        {pattern.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Modal>

          {/* Footer attribution */}
          <div
            className="flex justify-center mt-6"
            style={{ padding: "16px 0", borderTop: "1px solid var(--border)" }}
          >
            <span className="text-[11px] text-text-muted font-semibold">
              Powered by The Guardian Open Platform API
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
