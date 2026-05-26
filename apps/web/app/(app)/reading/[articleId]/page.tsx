"use client";

import { Modal, Select } from "antd";
import * as m from "motion/react-client";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api-client";
import {
  ArrowLeft,
  BookOpenText,
  Clock,
  Globe,
  Lightbulb,
  Loader2,
  Volume2,
} from "lucide-react";

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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <Loader2 className="animate-spin text-[var(--accent)]" size={32} />
        <span style={{ fontSize: 13.5, color: "var(--text-secondary)", fontWeight: 700 }}>
          Đang tải nội dung bài báo...
        </span>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 32,
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text-secondary)" }}>
          Không tìm thấy bài viết yêu cầu.
        </span>
        <m.button
          onClick={() => router.push("/reading")}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            padding: "8px 24px",
            borderRadius: 8,
            border: "none",
            background: "var(--accent)",
            color: "var(--text-on-accent)",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Quay lại danh sách
        </m.button>
      </div>
    );
  }

  const diffStyle = DIFFICULTY_COLORS[article.difficulty] ?? DIFFICULTY_COLORS.B1;

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        height: "100%",
        minHeight: 0,
        flex: 1,
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div className="grain-overlay" style={{ opacity: 0.03, zIndex: 0 }} />

      {/* Reader Scroll Container */}
      <div
        style={{
          position: "relative",
          minHeight: 0,
          flex: 1,
          overflowY: "auto",
          padding: "24px 20px 80px",
          zIndex: 1,
        }}
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

        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Header Action Menu */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid var(--border)",
              paddingBottom: 14,
            }}
          >
            <m.button
              onClick={() => router.push("/reading")}
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text-secondary)",
                fontSize: 12.5,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              <ArrowLeft />
              <span>Quay lại</span>
            </m.button>

            <span
              style={{
                fontSize: 11,
                fontWeight: 900,
                padding: "4px 10px",
                borderRadius: 6,
                background: "var(--accent-light)",
                color: "var(--accent)",
                border: "1.5px solid var(--accent-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              <BookOpenText style={{ marginRight: 6 }} /> {article.section}
            </span>
          </div>

          {/* Title and Metadata */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h2
              style={{
                fontSize: 26,
                fontWeight: 950,
                fontFamily: "var(--font-display)",
                lineHeight: 1.3,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              {article.title}
            </h2>

            {article.trailText && (
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.5,
                  color: "var(--text-secondary)",
                  fontWeight: 500,
                  margin: 0,
                }}
              >
                {article.trailText.replace(/<[^>]*>/g, "")}
              </p>
            )}

            <div
              style={{
                display: "flex",
                alignContent: "center",
                gap: 12,
                flexWrap: "wrap",
                marginTop: 6,
                borderBottom: "1px dashed var(--border)",
                paddingBottom: 16,
              }}
            >
              {article.author && (
                <span style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 700 }}>
                  By {article.author}
                </span>
              )}
              <span style={{ color: "var(--border-strong)" }}>|</span>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12.5,
                  color: "var(--text-muted)",
                  fontWeight: 700,
                }}
              >
                <Clock />
                <span>{article.readTime} phút đọc</span>
              </div>
              <span style={{ color: "var(--border-strong)" }}>|</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: 6,
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
                  style={{ width: 140 }}
                  options={[
                    { value: "us", label: "🇺🇸 US English" },
                    { value: "uk", label: "🇬🇧 UK English" },
                    { value: "au", label: "🇦🇺 AU English" },
                  ]}
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
              style={{
                width: "100%",
                maxHeight: 340,
                borderRadius: "var(--radius-xl)",
                objectFit: "cover",
                border: "1.5px solid var(--border)",
              }}
            />
          )}

          {/* Reader Body Content */}
          <div
            style={{
              fontSize: 16.5,
              lineHeight: 1.85,
              fontWeight: 500,
              color: "var(--text-primary)",
              display: "flex",
              flexDirection: "column",
              gap: 20,
              letterSpacing: "0.01em",
            }}
          >
            {article.paragraphs.map((para, idx) => (
              <div
                key={idx}
                style={{
                  position: "relative",
                  paddingRight: 60,
                }}
              >
                <p style={{ margin: 0, textAlign: "justify" }}>{para}</p>

                {/* Floating control buttons per paragraph */}
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
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
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      border: "1px solid var(--border)",
                      background: grammarResults[idx]?.length
                        ? "linear-gradient(135deg, var(--accent), var(--secondary))"
                        : "var(--surface)",
                      color: grammarResults[idx]?.length
                        ? "var(--text-on-accent)"
                        : "var(--text-muted)",
                      cursor: grammarLoading.has(idx) ? "wait" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    title="Phân tích ngữ pháp"
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
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      border: "1px solid var(--border)",
                      background:
                        speakingIdx === idx
                          ? "linear-gradient(135deg, var(--info), var(--accent))"
                          : "var(--surface)",
                      color: speakingIdx === idx ? "var(--text-on-accent)" : "var(--text-muted)",
                      cursor: loadingAudioIdx === idx ? "wait" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    title="Nghe đoạn này"
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
              <span style={{ fontSize: 13, color: "var(--text-on-accent)", fontWeight: 900 }}>
                ✕
              </span>
            }
          >
            {grammarPopup !== null && grammarResults[grammarPopup] && (
              <div>
                {/* Header banner */}
                <div
                  style={{
                    background: "linear-gradient(135deg, var(--accent), var(--secondary))",
                    padding: "16px 20px",
                    color: "var(--text-on-accent)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Lightbulb size={16} />
                  <span style={{ fontSize: 14.5, fontWeight: 900 }}>
                    Phân tích ngữ pháp của đoạn văn
                  </span>
                  <span
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      padding: "2px 8px",
                      borderRadius: 12,
                      fontSize: 10.5,
                      fontWeight: 800,
                    }}
                  >
                    {grammarResults[grammarPopup].length} cấu trúc
                  </span>
                </div>

                {/* Body details list */}
                <div
                  style={{
                    padding: 20,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    maxHeight: 380,
                    overflowY: "auto",
                    background: "var(--surface)",
                  }}
                >
                  {grammarResults[grammarPopup].map((pattern, pi) => (
                    <div
                      key={pi}
                      style={{
                        borderLeft: `4.5px solid ${PATTERN_COLORS[pattern.color] ?? "var(--border)"}`,
                        borderRadius: 8,
                        background: "var(--surface-alt)",
                        borderTop: "1px solid var(--border)",
                        borderRight: "1px solid var(--border)",
                        borderBottom: "1px solid var(--border)",
                        padding: "12px 14px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13.5,
                          fontWeight: 900,
                          color: PATTERN_COLORS[pattern.color] ?? "var(--accent)",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        {pattern.name}
                      </span>

                      <div
                        style={{
                          background: "var(--surface)",
                          borderRadius: 6,
                          padding: "6px 10px",
                          marginBottom: 8,
                          fontFamily: "var(--font-mono, monospace)",
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: "var(--text-primary)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        &quot;{pattern.phrase}&quot;
                      </div>

                      <p
                        style={{
                          fontSize: 13,
                          color: "var(--text-secondary)",
                          lineHeight: 1.5,
                          margin: 0,
                          fontWeight: 500,
                        }}
                      >
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
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "16px 0",
              borderTop: "1px solid var(--border)",
              marginTop: 24,
            }}
          >
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>
              Powered by The Guardian Open Platform API
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
