"use client";

import {
  AppstoreOutlined,
  ArrowRightOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  ExperimentOutlined,
  GlobalOutlined,
  LaptopOutlined,
  LoadingOutlined,
  ReadOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import * as m from "motion/react-client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";

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
      const data = await api.get<{ articles: Article[] }>(`/reading/articles?${params}`);
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

      {/* Styled Gradient Header */}
      <div style={{ position: "relative", zIndex: 1 }}>
      </div>

      {/* Scrollable Container */}
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
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Custom Category Segmented Switch */}
          <div
            style={{
              display: "flex",
              gap: 6,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-xl)",
              padding: "4px",
              boxShadow: "var(--shadow-sm)",
              overflowX: "auto",
              whiteSpace: "nowrap",
            }}
          >
            {SECTIONS.map((secItem) => {
              const isTabActive = section === secItem.value;
              return (
                <m.button
                  key={secItem.label}
                  onClick={() => setSection(secItem.value)}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    flex: "1 0 auto",
                    padding: "10px 16px",
                    borderRadius: "var(--radius-lg)",
                    border: "none",
                    background: isTabActive ? "var(--accent)" : "transparent",
                    color: isTabActive ? "var(--text-on-accent)" : "var(--text-secondary)",
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: "pointer",
                    transition: "color 0.2s, background 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {secItem.icon}
                  <span>{secItem.label}</span>
                </m.button>
              );
            })}
          </div>

          {/* Articles Listing Grid */}
          {loading ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 20,
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-xl)",
                    height: 320,
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      height: 140,
                      borderRadius: "var(--radius-lg)",
                      background: "var(--surface-alt)",
                      animation: "pulse 1.5s infinite",
                    }}
                  />
                  <div
                    style={{
                      height: 20,
                      width: "60%",
                      borderRadius: 4,
                      background: "var(--surface-alt)",
                      animation: "pulse 1.5s infinite",
                    }}
                  />
                  <div
                    style={{
                      height: 32,
                      borderRadius: 4,
                      background: "var(--surface-alt)",
                      animation: "pulse 1.5s infinite",
                    }}
                  />
                  <div
                    style={{
                      height: 16,
                      width: "40%",
                      borderRadius: 4,
                      background: "var(--surface-alt)",
                      animation: "pulse 1.5s infinite",
                    }}
                  />
                </div>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-xl)",
                padding: "80px 24px",
                textAlign: "center",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <ReadOutlined
                style={{ fontSize: 36, color: "var(--text-muted)", marginBottom: 12 }}
              />
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "var(--text-secondary)",
                  margin: "0 0 6px",
                }}
              >
                Không tìm thấy bài viết nào
              </p>
              <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: 0, fontWeight: 500 }}>
                Hãy kiểm tra cấu hình khóa GUARDIAN_API_KEY trong hệ thống.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 20,
              }}
            >
              {articles.map((article, idx) => {
                const diffStyle = DIFFICULTY_COLORS[article.difficulty] ?? DIFFICULTY_COLORS.B1;
                return (
                  <m.div
                    key={article.id}
                    onClick={() => router.push(`/reading/${article.id}`)}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.04, 0.4) }}
                    whileHover={{ y: -4, borderColor: "var(--accent)" }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      background: "var(--surface)",
                      border: "1.5px solid var(--border)",
                      borderRadius: "var(--radius-xl)",
                      overflow: "hidden",
                      cursor: "pointer",
                      boxShadow: "var(--shadow-sm)",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                    }}
                  >
                    {/* Thumbnail Card */}
                    {article.thumbnail ? (
                      <div
                        style={{
                          width: "100%",
                          height: 150,
                          backgroundImage: `url(${article.thumbnail})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background: "linear-gradient(to top, rgba(0,0,0,0.4), transparent)",
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: 150,
                          background: "var(--surface-alt)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--text-muted)",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        <ReadOutlined style={{ fontSize: 32 }} />
                      </div>
                    )}

                    {/* Article Details */}
                    <div
                      style={{
                        padding: "16px 18px",
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {/* Topic Tags */}
                      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 800,
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: "var(--surface-alt)",
                            border: "1px solid var(--border)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {article.section}
                        </span>

                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 800,
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: diffStyle.bg,
                            color: diffStyle.color,
                            border: `1.5px solid ${diffStyle.border}`,
                          }}
                        >
                          {article.difficulty}
                        </span>
                      </div>

                      {/* Header title */}
                      <h4
                        style={{
                          fontSize: 15.5,
                          fontWeight: 900,
                          lineHeight: 1.4,
                          color: "var(--text-primary)",
                          margin: "0 0 6px",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {article.title}
                      </h4>

                      {/* Snippet text */}
                      {article.trailText && (
                        <p
                          style={{
                            fontSize: 12.5,
                            color: "var(--text-muted)",
                            lineHeight: 1.5,
                            margin: "0 0 16px",
                            fontWeight: 500,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {article.trailText.replace(/<[^>]*>/g, "")}
                        </p>
                      )}

                      {/* Stats meta */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginTop: "auto",
                          borderTop: "1px dashed var(--border)",
                          paddingTop: 12,
                        }}
                      >
                        <span
                          style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 700 }}
                        >
                          The Guardian
                        </span>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 11.5,
                            color: "var(--text-muted)",
                            fontWeight: 700,
                          }}
                        >
                          <ClockCircleOutlined />
                          <span>{article.readTime} phút đọc</span>
                        </div>
                      </div>
                    </div>
                  </m.div>
                );
              })}
            </div>
          )}

          {/* Guardian Attribution footer */}
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
