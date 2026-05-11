"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as m from "motion/react-client";
import { 
  BookOutlined, 
  SearchOutlined, 
  FilterOutlined,
  ReadOutlined,
  ArrowRightOutlined,
  ThunderboltOutlined,
  HighlightOutlined,
  ToolOutlined
} from "@ant-design/icons";
import { Input, Tag, Empty } from "antd";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import grammarData from "@/lib/grammar-lessons/butte-data.json";

// ── Categories ───────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all", label: "Tất cả", icon: <BookOutlined /> },
  { id: "pos", label: "Từ loại", icon: <HighlightOutlined /> },
  { id: "structure", label: "Cấu trúc câu", icon: <ReadOutlined /> },
  { id: "mechanics", label: "Quy tắc & Lỗi", icon: <ToolOutlined /> },
  { id: "advanced", label: "Nâng cao", icon: <ThunderboltOutlined /> },
];

const CATEGORY_MAP: Record<string, string> = {
  "Nouns": "pos",
  "Pronouns": "pos",
  "Verbs": "pos",
  "Adjectives": "pos",
  "Adverbs": "pos",
  "Prepositions": "pos",
  "Conjunctions": "pos",
  "Interjections": "pos",
  "Definite and Indefinite Articles (a, an, the)": "pos",
  "Basic Sentence Structure": "structure",
  "Independent and Dependent Clauses: Coordination and Subordination": "structure",
  "Sentence Type and Purpose": "structure",
  "Other Phrases: Verbal, Appositive, Absolute": "structure",
  "Sentence Fragments": "mechanics",
  "Run-on Sentences and Comma Splices": "mechanics",
  "Subject Verb Agreement": "mechanics",
  "Consistent Verb Tense": "mechanics",
  "Pronoun Reference": "mechanics",
  "Relative Pronouns: Restrictive and Nonrestrictive Clauses": "mechanics",
  "Achieving Parallelism": "mechanics",
  "Two-Word Verbs": "advanced",
  "Avoiding Modifier Problems": "advanced",
  "Transitions": "advanced",
  "Would, Should, Could": "advanced",
};

function LibraryContent() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("all");

  useEffect(() => {
    const q = searchParams.get("q");
    const cat = searchParams.get("cat");
    if (q) setSearch(q);
    if (cat && CATEGORIES.some(c => c.id === cat)) setActiveCat(cat);
  }, [searchParams]);

  const filteredData = useMemo(() => {
    return grammarData.filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                          item.content.toLowerCase().includes(search.toLowerCase());
      const category = CATEGORY_MAP[item.title] || "mechanics";
      const matchesCat = activeCat === "all" || category === activeCat;
      return matchesSearch && matchesCat;
    });
  }, [search, activeCat]);

  return (
    <div style={{ minHeight: "100%", paddingBottom: 80 }}>
      <ModuleHeader
        icon={<BookOutlined />}
        gradient="linear-gradient(135deg, #2d3748 0%, #1a202c 100%)"
        title="Thư viện Ngữ pháp"
        subtitle="Tra cứu toàn diện các quy tắc ngữ pháp từ Butte Academic Success Center"
      />

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 20px" }}>
        {/* Search & Filters */}
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: 20, 
          marginBottom: 32,
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "rgba(var(--bg-rgb), 0.8)",
          backdropFilter: "blur(12px)",
          padding: "16px 0",
          borderBottom: "1px solid var(--border)"
        }}>
          <Input
            size="large"
            placeholder="Tìm kiếm chủ đề hoặc quy tắc..."
            prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              borderRadius: 14, 
              height: 52, 
              fontSize: 16,
              boxShadow: "var(--shadow-sm)",
              border: "2px solid var(--border)"
            }}
          />

          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
            {CATEGORIES.map((cat) => (
              <m.button
                key={cat.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCat(cat.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 18px",
                  borderRadius: 99,
                  border: "none",
                  background: activeCat === cat.id ? "var(--accent)" : "var(--surface)",
                  color: activeCat === cat.id ? "#fff" : "var(--text-secondary)",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  boxShadow: activeCat === cat.id ? "0 4px 12px color-mix(in srgb, var(--accent) 30%, transparent)" : "var(--shadow-sm)",
                  transition: "background 0.2s, color 0.2s"
                }}
              >
                {cat.icon}
                {cat.label}
              </m.button>
            ))}
          </div>
        </div>

        {/* Results Grid */}
        {filteredData.length > 0 ? (
          <m.div 
            layout
            style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
              gap: 20 
            }}
          >
            {filteredData.map((item, idx) => (
              <m.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Link href={`/grammar-library/${item.id}`} style={{ textDecoration: "none" }}>
                  <m.div
                    whileHover={{ y: -6, boxShadow: "var(--shadow-lg)" }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      height: "100%",
                      padding: "24px",
                      borderRadius: 20,
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden"
                    }}
                  >
                    <div style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: 4,
                      height: "100%",
                      background: `var(--phase-${(idx % 3) + 1}-color)`
                    }} />

                    <Tag color="blue" style={{ alignSelf: "flex-start", borderRadius: 6, margin: 0 }}>
                      {CATEGORIES.find(c => c.id === CATEGORY_MAP[item.title])?.label || "Khác"}
                    </Tag>
                    
                    <h3 style={{ 
                      margin: 0, 
                      fontSize: 18, 
                      fontWeight: 800, 
                      color: "var(--ink)", 
                      lineHeight: 1.3,
                      fontFamily: "var(--font-display)"
                    }}>
                      {item.title}
                    </h3>
                    
                    <p style={{ 
                      margin: 0, 
                      fontSize: 14, 
                      color: "var(--text-secondary)", 
                      lineHeight: 1.6,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden"
                    }}>
                      {item.content.substring(0, 150)}...
                    </p>

                    <div style={{ 
                      marginTop: "auto", 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 6, 
                      color: "var(--accent)", 
                      fontSize: 13, 
                      fontWeight: 700 
                    }}>
                      Chi tiết bài học <ArrowRightOutlined />
                    </div>
                  </m.div>
                </Link>
              </m.div>
            ))}
          </m.div>
        ) : (
          <div style={{ padding: "80px 0" }}>
            <Empty description="Không tìm thấy chủ đề nào phù hợp" />
          </div>
        )}
      </div>

      <style jsx global>{`
        :root {
          --phase-1-color: #C84B31;
          --phase-2-color: #4A7C6F;
          --phase-3-color: #D4B896;
        }
      `}</style>
    </div>
  );
}

export default function GrammarLibraryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LibraryContent />
    </Suspense>
  );
}
