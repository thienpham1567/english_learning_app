"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Card, Tag, Spin, Flex, Typography, Empty } from "antd";
import { api } from "@/lib/api-client";
import {
  Archive,
  BookOpen,
  CheckCircle,
  ChevronRight,
  Cloud,
  Coffee,
  FileText,
  Filter,
  FlaskConical,
  Heart,
  Home,
  Laptop,
  MapPin,
  Star,
  Store,
} from "lucide-react";

const { Text, Title } = Typography;

type PassageItem = {
  id: string;
  title: string;
  cefrLevel: string;
  section: string;
  wordCount: number;
  newWordsCount: number;
  isRead: boolean;
  score: number;
};

const LEVELS = ["", "A2", "B1", "B2", "C1", "C2"] as const;

const LEVEL_COLORS: Record<string, string> = {
  A2: "var(--success)",
  B1: "var(--info)",
  B2: "var(--info)",
  C1: "var(--accent)",
  C2: "var(--module-grammar)",
};

const LEVEL_LABELS: Record<string, string> = {
  "": "Tất cả",
  A2: "A2 · Elementary",
  B1: "B1 · Intermediate",
  B2: "B2 · Upper-Int",
  C1: "C1 · Advanced",
  C2: "C2 · Proficiency",
};

const SECTION_ICONS: Record<string, React.ReactNode> = {
  lifestyle: <Home />,
  travel: <MapPin />,
  food: <Coffee />,
  health: <Heart />,
  technology: <Laptop />,
  environment: <Cloud />,
  education: <Archive />,
  science: <FlaskConical />,
  business: <Store />,
};

export default function GradedReaderPage() {
  const router = useRouter();
  const [passages, setPassages] = useState<PassageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState("");

  const fetchPassages = useCallback(async (lv: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort: "priority" });
      if (lv) params.set("level", lv);
      const data = await api.get<{ passages: PassageItem[] }>(`/reading/passages?${params}`);
      setPassages(data.passages ?? []);
    } catch {
      setPassages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPassages(level);
  }, [level, fetchPassages]);

  const readCount = passages.filter((p) => p.isRead).length;

  return (
    <div className="anim-fade-up h-full overflow-y-auto" style={{padding: "var(--space-6)"}} >
      <Flex vertical gap={20} className="w-[800px] mx-auto" >

        {/* Hero header */}
        <Card
          
          styles={{ body: { padding: "24px 28px" } }} className="border-none" style={{borderRadius: 20, background: "linear-gradient(135deg, var(--accent), var(--secondary))"}} >
          <Flex align="center" gap={16}>
            <div className="w-[48px] h-[48px] flex items-center justify-center" style={{borderRadius: 14, background: "rgba(255,255,255,0.2)"}} >
              <BookOpen className="text-3xl" style={{color: "var(--text-on-accent)"}} />
            </div>
            <div>
              <Text className="text-[11px] uppercase" style={{letterSpacing: "0.12em", color: "rgba(255,255,255,0.7)"}} >
                GRADED READER
              </Text>
              <Title level={4} className="m-0 font-display italic" style={{color: "var(--text-on-accent)"}} >
                Đọc theo cấp độ CEFR
              </Title>
            </div>
            {passages.length > 0 && (
              <div className="text-center" style={{marginLeft: "auto"}} >
                <Text className="text-2xl font-bold" style={{color: "var(--text-on-accent)"}} >{readCount}/{passages.length}</Text>
                <br />
                <Text className="text-[11px]" style={{color: "rgba(255,255,255,0.7)"}} >đã đọc</Text>
              </div>
            )}
          </Flex>
        </Card>

        {/* Level filter pills */}
        <Card  styles={{ body: { padding: "12px 16px" } }} className="rounded-2xl" >
          <Flex gap={8} wrap align="center">
            <Filter className="text-text-muted text-sm" />
            {LEVELS.map((lv) => {
              const active = level === lv;
              const color = LEVEL_COLORS[lv] || "var(--accent)";
              return (
                <button
                  key={lv}
                  onClick={() => setLevel(lv)} className="text-xs font-semibold cursor-pointer" style={{padding: "6px 16px", borderRadius: 20, border: active ? `2px solid ${color}` : "1px solid var(--border)", background: active ? color : "transparent", color: active ? "var(--text-on-accent)" : "var(--text-secondary)", transition: "all 0.2s ease"}} >
                  {LEVEL_LABELS[lv]}
                </button>
              );
            })}
          </Flex>
        </Card>

        {/* Passages list */}
        {loading ? (
          <Flex justify="center" align="center" style={{ padding: 80 }}>
            <Spin size="large" />
          </Flex>
        ) : passages.length === 0 ? (
          <Empty
            image={<BookOpen className="text-text-muted" style={{fontSize: 48}} />}
            description="Không có bài đọc nào cho cấp độ này"
            style={{ padding: 60 }}
          />
        ) : (
          <Flex vertical gap={10}>
            {passages.map((p) => (
              <Card
                key={p.id}
                hoverable
                onClick={() => router.push(`/reading/graded/${p.id}`)}
                
                styles={{ body: { padding: "14px 20px" } }} className="rounded-2xl cursor-pointer" style={{opacity: p.isRead ? 0.75 : 1, transition: "all 0.2s ease"}} >
                <Flex align="center" gap={14}>
                  {/* Read indicator icon */}
                  <div className="w-[40px] h-[40px] rounded-xl flex items-center justify-center shrink-0" style={{background: p.isRead
                      ? "linear-gradient(135deg, var(--success)20, var(--success)10)"
                      : `linear-gradient(135deg, ${LEVEL_COLORS[p.cefrLevel] || "var(--accent)"}15, ${LEVEL_COLORS[p.cefrLevel] || "var(--accent)"}08)`}} >
                    {p.isRead
                      ? <CheckCircle className="text-xl text-emerald-500" />
                      : <FileText className="text-lg" style={{color: LEVEL_COLORS[p.cefrLevel] || "var(--accent)"}} />
                    }
                  </div>

                  {/* Content */}
                  <div className="flex-1 w-[0px]" >
                    <Text className="text-sm font-semibold block overflow-hidden" style={{textOverflow: "ellipsis", whiteSpace: "nowrap"}} >
                      {p.title}
                    </Text>
                    <Flex gap={8} align="center" className="mt-1" >
                      <Tag className="m-0 text-[10px] font-bold rounded-md border-none" style={{background: LEVEL_COLORS[p.cefrLevel] || undefined, color: LEVEL_COLORS[p.cefrLevel] ? "var(--text-on-accent)" : undefined}} >
                        {p.cefrLevel}
                      </Tag>
                      <Text className="text-[11px] text-text-muted" >
                        {SECTION_ICONS[p.section]} {p.wordCount} từ
                      </Text>
                    </Flex>
                  </div>

                  {/* New words badge */}
                  {p.newWordsCount > 0 && (
                    <Tag className="m-0 rounded-xl border-none text-accent font-semibold text-[11px] flex items-center gap-1" style={{background: "color-mix(in srgb, var(--accent) 12%, transparent)", padding: "2px 10px"}} >
                      <Star size={10} />
                      {p.newWordsCount} mới
                    </Tag>
                  )}

                  <ChevronRight className="text-xs text-text-muted shrink-0" />
                </Flex>
              </Card>
            ))}
          </Flex>
        )}
      </Flex>
    </div>
  );
}
