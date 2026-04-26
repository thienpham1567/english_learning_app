"use client";
import { api } from "@/lib/api-client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Flex, Typography, Spin, Tag, Button, Result, Modal, Select } from "antd";
import {
  ArrowLeftOutlined,
  ReadOutlined,
  ClockCircleOutlined,
  BulbOutlined,
  BookOutlined,
  SaveOutlined,
  LoadingOutlined,
  SoundOutlined,
} from "@ant-design/icons";

import { useMiniDictionary } from "@/hooks/useMiniDictionary";
import { MiniDictionary } from "@/components/shared";

const { Title, Text } = Typography;

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

const DIFFICULTY_COLORS: Record<string, string> = {
  B1: "green",
  B2: "gold",
  C1: "orange",
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
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  const [wordsLookedUp, setWordsLookedUp] = useState(0);

  // Voice accent for per-paragraph TTS (Groq Orpheus)
  const [ttsAccent, setTtsAccent] = useState("us");
  const [grammarPopup, setGrammarPopup] = useState<number | null>(null);

  // Per-paragraph TTS state
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [loadingAudioIdx, setLoadingAudioIdx] = useState<number | null>(null);
  const paragraphAudioRef = useRef<HTMLAudioElement | null>(null);
  const paragraphAudioUrlRef = useRef<string | null>(null);

  // Mini dictionary
  const miniDict = useMiniDictionary();

  // Grammar analysis guard ref
  const analyzedSetRef = useRef<Set<number>>(new Set());

  // Fetch article
  useEffect(() => {
    if (!articleId) return;
    setLoading(true);
    setGrammarResults({});
    analyzedSetRef.current.clear();
    api.get<Article>(`/reading/article/${articleId}`)
      .then((data) => setArticle(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [articleId]);

  // Grammar analysis — on-demand per paragraph (click to analyze)
  const analyzeGrammar = useCallback(async (index: number, text: string) => {
    if (analyzedSetRef.current.has(index)) return;
    analyzedSetRef.current.add(index);

    setGrammarLoading((prev) => new Set(prev).add(index));

    try {
      const data = await api.post<{ patterns?: GrammarPattern[] }>("/reading/grammar", { paragraph: text });
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (paragraphAudioRef.current) paragraphAudioRef.current.pause();
      if (paragraphAudioUrlRef.current) URL.revokeObjectURL(paragraphAudioUrlRef.current);
    };
  }, []);

  // Per-paragraph TTS handler (Groq Orpheus)
  const handleSpeakParagraph = useCallback(async (idx: number, text: string) => {
    // If already speaking this paragraph, stop
    if (speakingIdx === idx) {
      if (paragraphAudioRef.current) paragraphAudioRef.current.pause();
      if (paragraphAudioUrlRef.current) URL.revokeObjectURL(paragraphAudioUrlRef.current);
      paragraphAudioRef.current = null;
      paragraphAudioUrlRef.current = null;
      setSpeakingIdx(null);
      return;
    }

    // Stop any current audio
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
  }, [speakingIdx, ttsAccent]);



  // Word click handler
  const handleWordClick = useCallback(
    (word: string, e: React.MouseEvent<HTMLSpanElement>) => {
      const cleaned = word.replace(/[^a-zA-Z'-]/g, "").toLowerCase();
      if (cleaned.length < 2) return;
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      miniDict.openForWord(cleaned, rect);
      setWordsLookedUp((prev) => prev + 1);
    },
    [miniDict],
  );

  // Keyboard handler for accessibility
  const handleWordKeyDown = useCallback(
    (word: string, e: React.KeyboardEvent<HTMLSpanElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const cleaned = word.replace(/[^a-zA-Z'-]/g, "").toLowerCase();
        if (cleaned.length < 2) return;
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        miniDict.openForWord(cleaned, rect);
        setWordsLookedUp((prev) => prev + 1);
      }
    },
    [miniDict],
  );

  const handleWordSaved = useCallback((word: string) => {
    setSavedWords((prev) => new Set(prev).add(word.toLowerCase()));
  }, []);

  if (loading) {
    return (
      <Flex align="center" justify="center" style={{ height: "100%", flexDirection: "column", gap: 16 }}>
        <Spin size="large" />
        <Text type="secondary">Đang tải bài viết...</Text>
      </Flex>
    );
  }

  if (error || !article) {
    return (
      <Flex align="center" justify="center" style={{ height: "100%", padding: 32 }}>
        <Result
          status="404"
          title="Không tìm thấy bài viết"
          extra={
            <Button type="primary" onClick={() => router.push("/reading")}>
              Quay lại
            </Button>
          }
        />
      </Flex>
    );
  }

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "var(--space-6)" }} className="anim-fade-up">
      <Flex vertical gap="var(--space-5)" style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Back button + section */}
        <Flex align="center" gap={12}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/reading")}
            style={{ color: "var(--text-secondary)" }}
          >
            Quay lại
          </Button>
          <Tag color="default" style={{ fontSize: 11 }}>
            <ReadOutlined style={{ marginRight: 4 }} />
            {article.section}
          </Tag>
        </Flex>

        {/* Article Header */}
        <div>
          <Title
            level={2}
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              lineHeight: 1.35,
              color: "var(--text-primary)",
            }}
          >
            {article.title}
          </Title>

          {article.trailText && (
            <Text type="secondary" style={{ fontSize: 15, lineHeight: 1.5, display: "block", marginTop: 8 }}>
              {article.trailText}
            </Text>
          )}

          <Flex align="center" gap={16} style={{ marginTop: 12 }} wrap>
            {article.author && (
              <Text style={{ fontSize: 13, color: "var(--text-muted)" }}>By {article.author}</Text>
            )}
            <Flex align="center" gap={4}>
              <ClockCircleOutlined style={{ fontSize: 12, color: "var(--text-muted)" }} />
              <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>{article.readTime} phút</Text>
            </Flex>
            <Tag color={DIFFICULTY_COLORS[article.difficulty]} style={{ fontSize: 11, margin: 0 }}>
              {article.difficulty}
            </Tag>
            <Select
              value={ttsAccent}
              onChange={(v) => {
                setTtsAccent(v);
                // Stop current audio when accent changes
                if (speakingIdx !== null || paragraphAudioRef.current) {
                  if (paragraphAudioRef.current) paragraphAudioRef.current.pause();
                  if (paragraphAudioUrlRef.current) URL.revokeObjectURL(paragraphAudioUrlRef.current);
                  paragraphAudioRef.current = null;
                  paragraphAudioUrlRef.current = null;
                  setSpeakingIdx(null);
                }
              }}
              size="small"
              style={{ width: 130 }}
              options={[
                { value: "us", label: "🇺🇸 US English" },
                { value: "uk", label: "🇬🇧 UK English" },
                { value: "au", label: "🇦🇺 AU English" },
              ]}
            />
          </Flex>
        </div>

        {/* Thumbnail */}
        {article.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.thumbnail}
            alt={article.title}
            style={{
              width: "100%",
              height: 280,
              borderRadius: "var(--radius-lg)",
              objectFit: "cover",
            }}
          />
        )}

        {/* Article Body — Interactive Paragraphs */}
        <div style={{ lineHeight: 1.85, fontSize: 16, color: "var(--text-primary)" }}>
          {article.paragraphs.map((para, idx) => (
            <div
              key={idx}
              style={{ marginBottom: 24 }}
            >
              {/* Interactive paragraph text */}
              <p style={{ margin: 0 }}>
                {para.split(/(\s+)/).map((token, ti) => {
                  const isWord = /[a-zA-Z]/.test(token);
                  if (!isWord) return <span key={ti}>{token}</span>;

                  const cleanWord = token.replace(/[^a-zA-Z'-]/g, "").toLowerCase();
                  const isSaved = savedWords.has(cleanWord);

                  return (
                    <span
                      key={ti}
                      onClick={(e) => handleWordClick(token, e)}
                      onKeyDown={(e) => handleWordKeyDown(token, e)}
                      className="reading-word"
                      style={{
                        cursor: "pointer",
                        borderBottom: isSaved
                          ? "2px dotted var(--accent)"
                          : "1px solid transparent",
                        transition: "border-color 0.2s, background 0.2s",
                        borderRadius: 2,
                        paddingBottom: 1,
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      {token}
                    </span>
                  );
                })}

                {/* Grammar icon — inline at end of paragraph */}
                <span
                  onClick={() => {
                    if (grammarLoading.has(idx)) return;
                    if (grammarResults[idx] === undefined) {
                      // First click: analyze (popup auto-opens on success)
                      analyzeGrammar(idx, para);
                    } else if (grammarResults[idx]?.length) {
                      // Already analyzed: open popup
                      setGrammarPopup(idx);
                    }
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 22,
                    height: 22,
                    marginLeft: 6,
                    borderRadius: "50%",
                    cursor: grammarLoading.has(idx) ? "wait" : "pointer",
                    verticalAlign: "middle",
                    transition: "all 0.2s ease",
                    background: grammarResults[idx]?.length
                      ? "linear-gradient(135deg, var(--accent), var(--secondary))"
                      : "var(--border)",
                    color: grammarResults[idx]?.length ? "var(--text-on-accent)" : "var(--text-muted)",
                    fontSize: 11,
                  }}
                  title={grammarResults[idx]?.length ? `${grammarResults[idx].length} grammar patterns — click to view` : "Phân tích ngữ pháp"}
                >
                  {grammarLoading.has(idx) ? <LoadingOutlined spin style={{ fontSize: 10 }} /> : <BulbOutlined style={{ fontSize: 11 }} />}
                </span>

                {/* TTS icon — inline at end of paragraph */}
                <span
                  onClick={() => handleSpeakParagraph(idx, para)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 22,
                    height: 22,
                    marginLeft: 4,
                    borderRadius: "50%",
                    cursor: loadingAudioIdx === idx ? "wait" : "pointer",
                    verticalAlign: "middle",
                    transition: "all 0.2s ease",
                    background: speakingIdx === idx
                      ? "linear-gradient(135deg, var(--info), var(--accent))"
                      : loadingAudioIdx === idx
                        ? "var(--accent-muted)"
                        : "var(--border)",
                    color: speakingIdx === idx ? "var(--text-on-accent)" : "var(--text-muted)",
                    fontSize: 11,
                    animation: speakingIdx === idx ? "pulse 1.5s ease-in-out infinite" : "none",
                  }}
                  title={speakingIdx === idx ? "Đang phát — click để dừng" : loadingAudioIdx === idx ? "Đang tải..." : "Nghe đoạn này"}
                >
                  {loadingAudioIdx === idx ? <LoadingOutlined spin style={{ fontSize: 10 }} /> : <SoundOutlined style={{ fontSize: 11 }} />}
                </span>
              </p>
            </div>
          ))}
        </div>

        {/* Grammar Popup Modal */}
        <Modal
          open={grammarPopup !== null}
          onCancel={() => setGrammarPopup(null)}
          footer={null}
          centered
          width={640}
          closeIcon={
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-on-accent)",
                marginTop: 4,
                marginRight: 4,
                transition: "background 0.2s",
              }}
            >
              <span style={{ fontSize: 14 }}>✕</span>
            </div>
          }
          styles={{
            body: {
              borderRadius: 16,
              padding: 0,
              overflow: "hidden",
            },
            mask: {
              backdropFilter: "blur(6px)",
              background: "rgba(0,0,0,0.25)",
            },
          }}
        >
          {grammarPopup !== null && grammarResults[grammarPopup] && (
            <div>
              {/* Header */}
              <div
                style={{
                  background: "linear-gradient(135deg, var(--accent), var(--secondary))",
                  padding: "20px 24px",
                  color: "var(--text-on-accent)",
                }}
              >
                <Flex align="center" gap={8}>
                  <BulbOutlined style={{ fontSize: 18 }} />
                  <Text strong style={{ fontSize: 16, color: "var(--text-on-accent)" }}>
                    Grammar Patterns
                  </Text>
                  <Tag
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      border: "none",
                      color: "var(--text-on-accent)",
                      fontSize: 11,
                      borderRadius: 12,
                    }}
                  >
                    {grammarResults[grammarPopup].length} found
                  </Tag>
                </Flex>
              </div>

              {/* Body */}
              <div style={{ padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 12, maxHeight: 420, overflowY: "auto" }}>
                {grammarResults[grammarPopup].map((pattern, pi) => (
                  <div
                    key={pi}
                    style={{
                      borderLeft: `4px solid ${PATTERN_COLORS[pattern.color] ?? "var(--text-muted)"}`,
                      borderRadius: "var(--radius)",
                      background: "var(--surface)",
                      padding: "14px 16px",
                      transition: "box-shadow 0.2s ease",
                    }}
                    className="grammar-card-hover"
                  >
                    <Text
                      strong
                      style={{
                        fontSize: 14,
                        color: PATTERN_COLORS[pattern.color] ?? "var(--accent)",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      {pattern.name}
                    </Text>
                    <div
                      style={{
                        background: "var(--bg)",
                        borderRadius: 6,
                        padding: "6px 10px",
                        marginBottom: 8,
                        fontFamily: "var(--font-mono, monospace)",
                        fontSize: 13,
                        color: "var(--text-primary)",
                      }}
                    >
                      &quot;{pattern.phrase}&quot;
                    </div>
                    <Text style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                      {pattern.explanation}
                    </Text>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Modal>

        {/* Stats bar */}
        <Card
          style={{
            borderRadius: "var(--radius-xl)",
            background: "linear-gradient(135deg, var(--accent), var(--secondary))",
          }}
        >
          <Flex align="center" justify="center" gap={24} style={{ color: "var(--text-on-accent)" }}>
            <Flex align="center" gap={6}>
              <BookOutlined />
              <Text style={{ color: "var(--text-on-accent)", fontSize: 14 }}>
                {wordsLookedUp} từ đã tra
              </Text>
            </Flex>
            <Flex align="center" gap={6}>
              <SaveOutlined />
              <Text style={{ color: "var(--text-on-accent)", fontSize: 14 }}>
                {savedWords.size} từ đã lưu
              </Text>
            </Flex>
          </Flex>
        </Card>

        {/* Attribution */}
        <Flex justify="center" style={{ paddingBottom: 16 }}>
          <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>
            Powered by The Guardian Open Platform
          </Text>
        </Flex>
      </Flex>

      {/* Mini Dictionary popup */}
      <MiniDictionary
        word={miniDict.word}
        anchorRect={miniDict.anchorRect}
        visible={miniDict.visible}
        onClose={miniDict.close}
        onSave={handleWordSaved}
      />
    </div>
  );
}
