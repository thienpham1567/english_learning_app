"use client";

import * as m from "motion/react-client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
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
  { label: "Tất cả", value: "", icon: <LayoutGrid /> },
  { label: "Thế giới", value: "world", icon: <Globe /> },
  { label: "Khoa học", value: "science", icon: <FlaskConical /> },
  { label: "Công nghệ", value: "technology", icon: <Laptop /> },
  { label: "Môi trường", value: "environment", icon: <MapPin /> },
  { label: "Kinh doanh", value: "business", icon: <Users /> },
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
    <div className="relative flex h-full h-[0px] flex-1 flex-col overflow-hidden" >
      <div className="grain-overlay" style={{ opacity: 0.03, zIndex: 0 }} />

      {/* Styled Gradient Header */}
      <div className="relative z-[1]" >
      </div>

      {/* Scrollable Container */}
      <div className="relative h-[0px] flex-1 overflow-y-auto z-[1]" style={{padding: "24px 20px 80px"}} >
        <div className="w-[900px] mx-auto flex flex-col gap-5" >
          {/* Custom Category Segmented Switch */}
          <div className="flex gap-1.5 bg-(--surface) border-2 border-border rounded-(--radius-xl) p-1" style={{boxShadow: "var(--shadow-sm)", overflowX: "auto", whiteSpace: "nowrap"}} >
            {SECTIONS.map((secItem) => {
              const isTabActive = section === secItem.value;
              return (
                <m.button
                  key={secItem.label}
                  onClick={() => setSection(secItem.value)}
                  whileTap={{ scale: 0.97 }} className="py-2.5 px-4 rounded-(--radius-lg) border-none text-[13px] font-extrabold cursor-pointer flex items-center gap-2" style={{flex: "1 0 auto", background: isTabActive ? "var(--accent)" : "transparent", color: isTabActive ? "var(--text-on-accent)" : "var(--text-secondary)", transition: "color 0.2s, background 0.2s"}} >
                  {secItem.icon}
                  <span>{secItem.label}</span>
                </m.button>
              );
            })}
          </div>

          {/* Articles Listing Grid */}
          {loading ? (
            <div className="grid gap-5" style={{gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))"}} >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i} className="bg-(--surface) border-2 border-border rounded-(--radius-xl) h-[320px] p-4 flex flex-col gap-3" >
                  <div className="h-[140px] rounded-(--radius-lg) bg-surface-alt" style={{animation: "pulse 1.5s infinite"}} />
                  <div className="h-[20px] rounded bg-surface-alt" style={{width: "60%", animation: "pulse 1.5s infinite"}} />
                  <div className="h-[32px] rounded bg-surface-alt" style={{animation: "pulse 1.5s infinite"}} />
                  <div className="h-[16px] rounded bg-surface-alt" style={{width: "40%", animation: "pulse 1.5s infinite"}} />
                </div>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="bg-(--surface) border-2 border-border rounded-(--radius-xl) text-center" style={{padding: "80px 24px", boxShadow: "var(--shadow-sm)"}} >
              <BookOpenText className="text-[36px] text-text-muted mb-3" />
              <p className="text-base font-extrabold text-text-secondary" style={{margin: "0 0 6px"}} >
                Không tìm thấy bài viết nào
              </p>
              <p className="text-text-muted m-0 font-medium" style={{fontSize: 12.5}} >
                Hãy kiểm tra cấu hình khóa GUARDIAN_API_KEY trong hệ thống.
              </p>
            </div>
          ) : (
            <div className="grid gap-5" style={{gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))"}} >
              {articles.map((article, idx) => {
                const diffStyle = DIFFICULTY_COLORS[article.difficulty] ?? DIFFICULTY_COLORS.B1;
                return (
                  <m.div
                    key={article.id}
                    onClick={() => router.push(`/reading/${article.id}`)}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.04, 0.4) }}
                    whileHover={{ y: -4, borderColor: "var(--accent)" }} className="flex flex-col bg-(--surface) rounded-(--radius-xl) overflow-hidden cursor-pointer" style={{border: "1.5px solid var(--border)", boxShadow: "var(--shadow-sm)", transition: "border-color 0.2s, box-shadow 0.2s"}} >
                    {/* Thumbnail Card */}
                    {article.thumbnail ? (
                      <div className="w-full h-[150px] relative" style={{backgroundImage: `url(${article.thumbnail})`, backgroundSize: "cover", backgroundPosition: "center"}} >
                        <div className="absolute" style={{inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.4), transparent)"}} />
                      </div>
                    ) : (
                      <div className="w-full h-[150px] bg-surface-alt flex items-center justify-center text-text-muted" style={{borderBottom: "1px solid var(--border)"}} >
                        <BookOpenText size={32} />
                      </div>
                    )}

                    {/* Article Details */}
                    <div className="flex-1 flex flex-col" style={{padding: "16px 18px"}} >
                      {/* Topic Tags */}
                      <div className="flex gap-1.5 mb-2.5 flex-wrap" >
                        <span className="text-[10.5px] font-extrabold rounded-md bg-surface-alt border-2 border-border text-text-secondary" style={{padding: "2px 8px"}} >
                          {article.section}
                        </span>

                        <span className="text-[10.5px] font-extrabold rounded-md" style={{padding: "2px 8px", background: diffStyle.bg, color: diffStyle.color, border: `1.5px solid ${diffStyle.border}`}} >
                          {article.difficulty}
                        </span>
                      </div>

                      {/* Header title */}
                      <h4 className="font-black text-text-primary overflow-hidden" style={{fontSize: 15.5, lineHeight: 1.4, margin: "0 0 6px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical"}} >
                        {article.title}
                      </h4>

                      {/* Snippet text */}
                      {article.trailText && (
                        <p className="text-text-muted leading-normal mb-4 font-medium overflow-hidden" style={{fontSize: 12.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical"}} >
                          {article.trailText.replace(/<[^>]*>/g, "")}
                        </p>
                      )}

                      {/* Stats meta */}
                      <div className="flex items-center justify-between pt-3" style={{marginTop: "auto", borderTop: "1px dashed var(--border)"}} >
                        <span className="text-text-muted font-bold" style={{fontSize: 11.5}} >
                          The Guardian
                        </span>
                        <div className="flex items-center gap-1 text-text-muted font-bold" style={{fontSize: 11.5}} >
                          <Clock />
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
          <div className="flex justify-center mt-6" style={{padding: "16px 0", borderTop: "1px solid var(--border)"}} >
            <span className="text-[11px] text-text-muted font-semibold" >
              Powered by The Guardian Open Platform API
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
