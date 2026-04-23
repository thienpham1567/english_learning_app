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
  SoundOutlined,
  PauseCircleOutlined,
  LoadingOutlined,
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

  // Audio player state
  const [audioState, setAudioState] = useState<"idle" | "loading" | "playing" | "paused">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState("austin");
  const [grammarPopup, setGrammarPopup] = useState<number | null>(null);

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

  // Audio player handlers
  const handlePlayArticle = useCallback(async () => {
    if (audioState === "playing" && audioRef.current) {
      audioRef.current.pause();
      setAudioState("paused");
      return;
    }

    if (audioState === "paused" && audioRef.current) {
      audioRef.current.play();
      setAudioState("playing");
      return;
    }

    // Load fresh audio
    setAudioState("loading");
    try {
      const res = await fetch(`/api/reading/audio/${articleId}?voice=${selectedVoice}`);
      if (!res.ok) throw new Error("Audio load failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      // Clean up previous
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      if (audioRef.current) audioRef.current.pause();

      const audio = new Audio(url);
      audioRef.current = audio;
      audioUrlRef.current = url;

      audio.onended = () => setAudioState("idle");
      audio.onerror = () => setAudioState("idle");

      await audio.play();
      setAudioState("playing");
    } catch {
      setAudioState("idle");
    }
  }, [articleId, audioState, selectedVoice]);

  const handleStopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setAudioState("idle");
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, []);



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

          <Flex align="center" gap={16} style={{ marginTop: 12 }}>
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
          </Flex>
        </div>

        {/* Listen to article — voice selector + play button */}
        <Flex align="center" gap={12} wrap="wrap">
          <Select
            value={selectedVoice}
            onChange={(v) => {
              setSelectedVoice(v);
              // Reset audio when voice changes
              if (audioState !== "idle") handleStopAudio();
            }}
            disabled={audioState === "loading"}
            style={{ width: 160 }}
            options={[
              { value: "austin", label: "🇺🇸 US Male" },
              { value: "autumn", label: "🇺🇸 US Female" },
              { value: "daniel", label: "🇬🇧 UK Male" },
              { value: "diana", label: "🇬🇧 UK Female" },
              { value: "troy", label: "🇦🇺 AU Male" },
              { value: "hannah", label: "🇦🇺 AU Female" },
            ]}
          />
          <Button
            type={audioState === "idle" ? "default" : "primary"}
            icon={
              audioState === "loading" ? <LoadingOutlined spin /> :
              audioState === "playing" ? <PauseCircleOutlined /> :
              <SoundOutlined />
            }
            onClick={handlePlayArticle}
            disabled={audioState === "loading"}
            style={{
              borderRadius: "var(--radius-full, 999px)",
              height: 40,
              paddingInline: 20,
              ...(audioState === "playing" ? {
                background: "linear-gradient(135deg, var(--accent), var(--secondary))",
                borderColor: "transparent",
                color: "#fff",
              } : {}),
            }}
          >
            {audioState === "loading" ? "Đang tải audio..." :
             audioState === "playing" ? "Tạm dừng" :
             audioState === "paused" ? "Tiếp tục nghe" :
             "🎧 Nghe bài báo"}
          </Button>

          {audioState !== "idle" && audioState !== "loading" && (
            <Button
              type="text"
              size="small"
              onClick={handleStopAudio}
              style={{ color: "var(--text-muted)", fontSize: 12 }}
            >
              Dừng hẳn
            </Button>
          )}
        </Flex>

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
                    color: grammarResults[idx]?.length ? "#fff" : "var(--text-muted)",
                    fontSize: 11,
                  }}
                  title={grammarResults[idx]?.length ? `${grammarResults[idx].length} grammar patterns — click to view` : "Phân tích ngữ pháp"}
                >
                  {grammarLoading.has(idx) ? <LoadingOutlined spin style={{ fontSize: 10 }} /> : <BulbOutlined style={{ fontSize: 11 }} />}
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
                color: "#fff",
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
                  color: "#fff",
                }}
              >
                <Flex align="center" gap={8}>
                  <BulbOutlined style={{ fontSize: 18 }} />
                  <Text strong style={{ fontSize: 16, color: "#fff" }}>
                    Grammar Patterns
                  </Text>
                  <Tag
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      border: "none",
                      color: "#fff",
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
          <Flex align="center" justify="center" gap={24} style={{ color: "var(--text-on-accent, #fff)" }}>
            <Flex align="center" gap={6}>
              <BookOutlined />
              <Text style={{ color: "var(--text-on-accent, #fff)", fontSize: 14 }}>
                {wordsLookedUp} từ đã tra
              </Text>
            </Flex>
            <Flex align="center" gap={6}>
              <SaveOutlined />
              <Text style={{ color: "var(--text-on-accent, #fff)", fontSize: 14 }}>
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
