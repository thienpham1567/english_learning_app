"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Flex, Typography, Spin, Tag, Segmented } from "antd";
import {
  ReadOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  ExperimentOutlined,
  LaptopOutlined,
  EnvironmentOutlined,
  AppstoreOutlined,
  TeamOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

type Article = {
  id: string;
  title: string;
  trailText: string;
  author: string;
  date: string;
  thumbnail: string | null;
  section: string;
  sectionId: string;
  wordCount: number;
  readTime: number;
  difficulty: "B1" | "B2" | "C1";
};

const DIFFICULTY_COLORS: Record<string, string> = {
  B1: "green",
  B2: "gold",
  C1: "orange",
};

const SECTIONS = [
  { label: "Tất cả", value: "", icon: <AppstoreOutlined /> },
  { label: "Thế giới", value: "world", icon: <GlobalOutlined /> },
  { label: "Khoa học", value: "science", icon: <ExperimentOutlined /> },
  { label: "Công nghệ", value: "technology", icon: <LaptopOutlined /> },
  { label: "Môi trường", value: "environment", icon: <EnvironmentOutlined /> },
  { label: "Kinh doanh", value: "business", icon: <TeamOutlined /> },
];

export default function ReadingPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState("");

  const fetchArticles = useCallback(async (sec: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ pageSize: "12" });
      if (sec) params.set("section", sec);
      const res = await fetch(`/api/reading/articles?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setArticles(data.articles ?? []);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles(section);
  }, [section, fetchArticles]);

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        padding: "var(--space-6)",
      }}
      className="anim-fade-up"
    >
      <Flex vertical gap="var(--space-5)">
        {/* Header */}
        <div>
          <Text
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "var(--text-muted)",
            }}
          >
            ĐỌC HIỂU
          </Text>
          <Title
            level={3}
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              color: "var(--text-primary)",
            }}
          >
            Luyện đọc
          </Title>
        </div>

        {/* Category Filter */}
        <div style={{ overflowX: "auto", paddingBottom: 4 }}>
          <Segmented
            value={section}
            onChange={(val) => setSection(val as string)}
            options={SECTIONS.map((s) => ({
              label: (
                <Flex align="center" gap={6}>
                  {s.icon}
                  <span>{s.label}</span>
                </Flex>
              ),
              value: s.value,
            }))}
            style={{ minWidth: "max-content" }}
          />
        </div>

        {/* Articles Grid */}
        {loading ? (
          <Flex align="center" justify="center" style={{ height: 300 }}>
            <Spin size="large" />
          </Flex>
        ) : articles.length === 0 ? (
          <Flex align="center" justify="center" style={{ height: 300 }}>
            <Text type="secondary">Không có bài viết nào. Hãy thêm GUARDIAN_API_KEY.</Text>
          </Flex>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 16,
            }}
          >
            {articles.map((article) => (
              <Card
                key={article.id}
                hoverable
                onClick={() => router.push(`/reading/${article.id}`)}
                style={{
                  borderRadius: "var(--radius-xl)",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                styles={{ body: { padding: 0 } }}
              >
                {/* Thumbnail */}
                {article.thumbnail && (
                  <div
                    style={{
                      width: "100%",
                      height: 160,
                      backgroundImage: `url(${article.thumbnail})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                )}

                {/* Content */}
                <div style={{ padding: "16px 20px" }}>
                  {/* Tags row */}
                  <Flex gap={6} style={{ marginBottom: 8 }}>
                    <Tag color="default" style={{ margin: 0, fontSize: 11 }}>
                      {article.section}
                    </Tag>
                    <Tag color={DIFFICULTY_COLORS[article.difficulty]} style={{ margin: 0, fontSize: 11 }}>
                      {article.difficulty}
                    </Tag>
                  </Flex>

                  {/* Title */}
                  <Text
                    strong
                    style={{
                      fontSize: 15,
                      lineHeight: 1.4,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      color: "var(--text-primary)",
                    }}
                  >
                    {article.title}
                  </Text>

                  {/* Trail text */}
                  {article.trailText && (
                    <Text
                      type="secondary"
                      style={{
                        fontSize: 13,
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        marginTop: 4,
                      }}
                    >
                      {article.trailText}
                    </Text>
                  )}

                  {/* Meta row */}
                  <Flex align="center" gap={12} style={{ marginTop: 12 }}>
                    <Flex align="center" gap={4}>
                      <ReadOutlined style={{ fontSize: 12, color: "var(--text-muted)" }} />
                      <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>The Guardian</Text>
                    </Flex>
                    <Flex align="center" gap={4}>
                      <ClockCircleOutlined style={{ fontSize: 12, color: "var(--text-muted)" }} />
                      <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>{article.readTime} phút</Text>
                    </Flex>
                  </Flex>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Attribution */}
        <Flex justify="center" style={{ paddingBottom: 16 }}>
          <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>
            Powered by The Guardian Open Platform
          </Text>
        </Flex>
      </Flex>
    </div>
  );
}
