"use client";

import {
  ArrowRight,
  BookOpenText,
  Clock,
  FlaskConical,
  Globe,
  Laptop,
  LayoutGrid,
  Loader2,
  MapPin,
  Users,
} from "lucide-react";
import * as m from "motion/react-client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
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
  { label: "All Topics", value: "", icon: <LayoutGrid /> },
  { label: "World", value: "world", icon: <Globe /> },
  { label: "Science", value: "science", icon: <FlaskConical /> },
  { label: "Technology", value: "technology", icon: <Laptop /> },
  { label: "Environment", value: "environment", icon: <MapPin /> },
  { label: "Business", value: "business", icon: <Users /> },
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
    <div className="relative flex h-full flex-1 flex-col overflow-hidden">
      <div className="grain-overlay opacity-[0.03] z-0" />

      {/* Styled Gradient Header */}
      <div className="relative z-[1]"></div>

      {/* Scrollable Container */}
      <div
        className="relative h-0 flex-1 overflow-y-auto z-[1] pt-6 px-5 pb-20"
      >
        <div className="w-[900px] mx-auto flex flex-col gap-5">
          {/* Custom Category Segmented Switch */}
          <div
            className="flex gap-1.5 bg-[var(--surface)] border-2 border-border rounded-xl p-1 shadow-sm overflow-x-auto whitespace-nowrap"
          >
            {SECTIONS.map((secItem) => {
              const isTabActive = section === secItem.value;
              return (
                <m.button
                  key={secItem.label}
                  onClick={() => setSection(secItem.value)}
                  whileTap={{ scale: 0.97 }}
                  className={`py-2.5 px-4 rounded-lg border-none text-[13px] font-extrabold cursor-pointer flex items-center gap-2 transition-all duration-200 flex-none ${
                    isTabActive
                      ? "bg-accent text-[var(--text-on-accent)]"
                      : "bg-transparent text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {secItem.icon}
                  <span>{secItem.label}</span>
                </m.button>
              );
            })}
          </div>

          {/* Articles Listing Grid */}
          {loading ? (
            <div className="grid gap-5 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-[var(--surface)] border-2 border-border rounded-xl h-[320px] p-4 flex flex-col gap-3"
                >
                  <div className="h-[140px] rounded-lg bg-surface-alt animate-pulse" />
                  <div className="h-5 rounded bg-surface-alt w-3/5 animate-pulse" />
                  <div className="h-8 rounded bg-surface-alt animate-pulse" />
                  <div className="h-4 rounded bg-surface-alt w-2/5 animate-pulse" />
                </div>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <Card shadowSize="sm" className="text-center py-20 px-6">
              <BookOpenText className="w-9 h-9 text-text-muted mx-auto mb-3" />
              <p className="text-base font-extrabold text-text-secondary mb-1.5">
                No articles found
              </p>
              <p className="text-text-muted text-[12.5px] font-medium">
                Please check the GUARDIAN_API_KEY configuration in your system.
              </p>
            </Card>
          ) : (
            <div className="grid gap-5 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
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
                    className="flex flex-col bg-[var(--surface)] border-2 border-border rounded-xl overflow-hidden cursor-pointer shadow-sm hover:border-accent hover:shadow-md transition-all duration-200"
                  >
                    {/* Thumbnail Card */}
                    {article.thumbnail ? (
                      <div
                        className="w-full h-[150px] relative"
                        style={{
                          backgroundImage: `url(${article.thumbnail})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        <div
                          className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-[150px] bg-surface-alt flex items-center justify-center text-text-muted border-b border-border">
                        <BookOpenText size={32} />
                      </div>
                    )}

                    {/* Article Details */}
                    <div className="flex-1 flex flex-col p-4">
                      {/* Topic Tags */}
                      <div className="flex gap-1.5 mb-2.5 flex-wrap">
                        <span className="text-[10.5px] font-extrabold rounded-md bg-surface-alt border-2 border-border text-text-secondary px-2 py-0.5">
                          {article.section}
                        </span>

                        <span
                          className="text-[10.5px] font-extrabold rounded-md px-2 py-0.5 border"
                          style={{
                            background: diffStyle.bg,
                            color: diffStyle.color,
                            borderColor: diffStyle.border,
                          }}
                        >
                          {article.difficulty}
                        </span>
                      </div>

                      {/* Header title */}
                      <h4 className="font-black text-text-primary text-[15.5px] leading-[1.4] mb-1.5 line-clamp-2">
                        {article.title}
                      </h4>

                      {/* Snippet text */}
                      {article.trailText && (
                        <p className="text-text-muted leading-normal mb-4 font-medium text-[12.5px] line-clamp-2">
                          {article.trailText.replace(/<[^>]*>/g, "")}
                        </p>
                      )}

                      {/* Stats meta */}
                      <div className="flex items-center justify-between pt-3 mt-auto border-t border-dashed border-border">
                        <span className="text-text-muted font-bold text-[11.5px]">
                          The Guardian
                        </span>
                        <div className="flex items-center gap-1 text-text-muted font-bold text-[11.5px]">
                          <Clock size={13} />
                          <span>{article.readTime} min read</span>
                        </div>
                      </div>
                    </div>
                  </m.div>
                );
              })}
            </div>
          )}

          {/* Guardian Attribution footer */}
          <div className="flex justify-center mt-6 py-4 border-t border-border">
            <span className="text-[11px] text-text-muted font-semibold">
              Powered by The Guardian Open Platform API
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
