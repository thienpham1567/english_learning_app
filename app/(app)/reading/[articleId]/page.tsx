"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Flex, Typography, Spin, Tag, Button, Result, Collapse } from "antd";
import {
  ArrowLeftOutlined,
  ReadOutlined,
  ClockCircleOutlined,
  BulbOutlined,
  BookOutlined,
  SaveOutlined,
} from "@ant-design/icons";

import { useMiniDictionary } from "@/hooks/useMiniDictionary";
import { MiniDictionary } from "@/components/app/shared";

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
  green: "#52c41a",
  blue: "#1890ff",
  yellow: "#faad14",
  purple: "#722ed1",
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

  // Refs to avoid stale closures in IntersectionObserver
  const observerRef = useRef<IntersectionObserver | null>(null);
  const paragraphRefs = useRef<(HTMLDivElement | null)[]>([]);
  const analyzedRef = useRef<Set<number>>(new Set()); // tracks which paragraphs have been analyzed
  const pendingRef = useRef<Set<number>>(new Set());  // tracks in-flight requests

  // Mini dictionary
  const miniDict = useMiniDictionary();

  // Fetch article
  useEffect(() => {
    if (!articleId) return;
    setLoading(true);
    analyzedRef.current.clear();
    pendingRef.current.clear();
    fetch(`/api/reading/article/${articleId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => setArticle(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [articleId]);

  // Grammar analysis — uses refs to prevent re-trigger
  const analyzeGrammar = useCallback(async (index: number, text: string) => {
    if (analyzedRef.current.has(index) || pendingRef.current.has(index)) return;

    pendingRef.current.add(index);
    setGrammarLoading((prev) => new Set(prev).add(index));

    try {
      const res = await fetch("/api/reading/grammar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paragraph: text }),
      });
      const data = await res.json();
      analyzedRef.current.add(index);
      setGrammarResults((prev) => ({ ...prev, [index]: data.patterns ?? [] }));
    } catch {
      analyzedRef.current.add(index);
      setGrammarResults((prev) => ({ ...prev, [index]: [] }));
    } finally {
      pendingRef.current.delete(index);
      setGrammarLoading((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  }, []); // No state dependencies — uses refs for guards

  // IntersectionObserver — stable, no re-creation on state changes
  useEffect(() => {
    if (!article) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-paragraph-index"));
            if (!Number.isNaN(idx) && article.paragraphs[idx]) {
              analyzeGrammar(idx, article.paragraphs[idx]);
            }
          }
        });
      },
      { threshold: 0.3 },
    );

    paragraphRefs.current.forEach((ref) => {
      if (ref) observerRef.current?.observe(ref);
    });

    return () => observerRef.current?.disconnect();
  }, [article, analyzeGrammar]);

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
              ref={(el) => { paragraphRefs.current[idx] = el; }}
              data-paragraph-index={idx}
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
              </p>

              {/* Grammar panel */}
              {(grammarResults[idx]?.length ?? 0) > 0 && (
                <Collapse
                  ghost
                  style={{ marginTop: 8 }}
                  items={[
                    {
                      key: `grammar-${idx}`,
                      label: (
                        <Flex align="center" gap={6}>
                          <BulbOutlined style={{ color: "var(--accent)" }} />
                          <Text style={{ fontSize: 13, color: "var(--accent)" }}>
                            {grammarResults[idx].length} grammar patterns
                          </Text>
                        </Flex>
                      ),
                      children: (
                        <Flex vertical gap={8}>
                          {grammarResults[idx].map((pattern, pi) => (
                            <Card
                              key={pi}
                              size="small"
                              style={{
                                borderLeft: `3px solid ${PATTERN_COLORS[pattern.color] ?? "#888"}`,
                                borderRadius: "var(--radius)",
                              }}
                              styles={{ body: { padding: "8px 12px" } }}
                            >
                              <Text strong style={{ fontSize: 13, color: PATTERN_COLORS[pattern.color] ?? "#888" }}>
                                {pattern.name}
                              </Text>
                              <br />
                              <Text code style={{ fontSize: 12 }}>
                                &quot;{pattern.phrase}&quot;
                              </Text>
                              <br />
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {pattern.explanation}
                              </Text>
                            </Card>
                          ))}
                        </Flex>
                      ),
                    },
                  ]}
                />
              )}

              {grammarLoading.has(idx) && (
                <Flex align="center" gap={6} style={{ marginTop: 6 }}>
                  <Spin size="small" />
                  <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>Đang phân tích ngữ pháp...</Text>
                </Flex>
              )}
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <Card
          style={{
            borderRadius: "var(--radius-xl)",
            background: "linear-gradient(135deg, var(--accent), var(--secondary))",
          }}
        >
          <Flex align="center" justify="center" gap={24} style={{ color: "#fff" }}>
            <Flex align="center" gap={6}>
              <BookOutlined />
              <Text style={{ color: "#fff", fontSize: 14 }}>
                {wordsLookedUp} từ đã tra
              </Text>
            </Flex>
            <Flex align="center" gap={6}>
              <SaveOutlined />
              <Text style={{ color: "#fff", fontSize: 14 }}>
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
