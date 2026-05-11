"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOutlined,
  TrophyOutlined,
  RocketOutlined,
  BulbOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
  ReadOutlined,
  StarFilled,
} from "@ant-design/icons";

// ── Types ────────────────────────────────────────────────────────
type ReadingMode = "overview" | "strategy" | "drill";

type StrategyItem = {
  id: string;
  part: string;
  title: string;
  description: string;
  tips: string[];
  icon: React.ReactNode;
  color: string;
};

type DrillOption = {
  part: string;
  label: string;
  description: string;
  questionCount: number;
  estimatedMinutes: number;
  href: string;
};

// ── Data ─────────────────────────────────────────────────────────

const STRATEGIES: StrategyItem[] = [
  {
    id: "part5", part: "Part 5", title: "Incomplete Sentences",
    description: "Chọn từ/cụm từ đúng để hoàn thành câu. 30 câu, tập trung ngữ pháp và từ vựng.",
    tips: [
      "Đọc cả câu trước khi chọn — đừng chỉ nhìn chỗ trống",
      "Xác định loại từ cần điền (noun/verb/adj/adv) bằng cấu trúc câu",
      "Tìm collocations và fixed phrases quen thuộc",
      "Dành tối đa 20 giây/câu — Part 5 cần nhanh để dành thời gian cho Part 7",
    ],
    icon: <BulbOutlined />, color: "var(--accent)",
  },
  {
    id: "part6", part: "Part 6", title: "Text Completion",
    description: "Hoàn thành đoạn văn với từ/câu phù hợp. 4 đoạn × 4 câu hỏi.",
    tips: [
      "Đọc TOÀN BỘ đoạn văn trước — ngữ cảnh rất quan trọng",
      "Câu hỏi chèn câu: chú ý linking words và logical flow",
      "Phân biệt thì (tense) dựa vào time markers trong đoạn",
      "Dành khoảng 2 phút/đoạn (8 phút tổng cho Part 6)",
    ],
    icon: <ReadOutlined />, color: "var(--secondary)",
  },
  {
    id: "part7", part: "Part 7", title: "Reading Comprehension",
    description: "Đọc hiểu — single passage, double passage, triple passage. 54 câu hỏi.",
    tips: [
      "ĐỌC CÂU HỎI TRƯỚC rồi mới đọc bài — tiết kiệm thời gian cực kỳ hiệu quả",
      "Với double/triple passage: tìm mối liên hệ giữa các bài",
      "Câu 'What is suggested/implied?' — tìm paraphrasing, không tìm exact words",
      "Phân bổ thời gian: ~1 phút/câu cho Part 7, bắt đầu từ single passages",
    ],
    icon: <BookOutlined />, color: "var(--info)",
  },
];

const DRILLS: DrillOption[] = [
  { part: "Part 5", label: "Quick Drill · Part 5", description: "30 câu Incomplete Sentences", questionCount: 10, estimatedMinutes: 5, href: "/toeic-practice" },
  { part: "Part 6", label: "Quick Drill · Part 6", description: "4 đoạn Text Completion", questionCount: 16, estimatedMinutes: 8, href: "/toeic-practice" },
  { part: "Part 7", label: "Quick Drill · Part 7", description: "Single + Double passages", questionCount: 15, estimatedMinutes: 15, href: "/toeic-practice" },
  { part: "Full", label: "Full Reading Test", description: "Part 5 + 6 + 7 (75 phút)", questionCount: 100, estimatedMinutes: 75, href: "/toeic-practice" },
];

// ── Styles ───────────────────────────────────────────────────────
const card: React.CSSProperties = {
  borderRadius: 16, border: "1px solid var(--border)", background: "var(--surface)",
  padding: "20px 18px", position: "relative", overflow: "hidden",
  transition: "transform 0.15s, box-shadow 0.15s",
};
const sectionLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 800, textTransform: "uppercase",
  letterSpacing: "0.12em", color: "var(--accent)", marginBottom: 14,
  display: "flex", alignItems: "center", gap: 8,
};
const pill: React.CSSProperties = {
  padding: "6px 14px", borderRadius: 99, fontSize: 13, fontWeight: 600,
  border: "1.5px solid var(--border)", background: "var(--surface)",
  cursor: "pointer", transition: "all 0.15s", color: "var(--text-secondary)",
};
const pillActive: React.CSSProperties = {
  ...pill, borderColor: "var(--accent)", background: "color-mix(in srgb, var(--accent) 10%, var(--surface))",
  color: "var(--accent)",
};

// ── Component ────────────────────────────────────────────────────
export function ReadingTab() {
  const [mode, setMode] = useState<ReadingMode>("overview");
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);

  return (
    <div style={{ padding: "12px 14px 40px", maxWidth: 800, margin: "0 auto" }}>

      {/* Mode selector pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { key: "overview" as ReadingMode, label: "Tổng quan", icon: <BookOutlined /> },
          { key: "strategy" as ReadingMode, label: "Chiến lược", icon: <BulbOutlined /> },
          { key: "drill" as ReadingMode, label: "Luyện tập", icon: <RocketOutlined /> },
        ].map(m => (
          <button key={m.key} type="button" onClick={() => setMode(m.key)}
            style={mode === m.key ? pillActive : pill}>
            {m.icon} <span style={{ marginLeft: 4 }}>{m.label}</span>
          </button>
        ))}
      </div>

      {/* ── Overview Mode ── */}
      {mode === "overview" && (
        <div className="anim-fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Quick stats */}
          <div style={{ ...card, background: "linear-gradient(135deg, #1a2332 0%, #2d3748 50%, #4a5568 100%)", color: "#fff" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, fontFamily: "var(--font-display)" }}>
              TOEIC Reading Section
            </h3>
            <p style={{ margin: "0 0 14px", fontSize: 13, opacity: 0.8, lineHeight: 1.6 }}>
              75 phút · 100 câu hỏi · 3 phần (Part 5, 6, 7) · Tối đa 495 điểm
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { part: "Part 5", q: "30 câu", desc: "Incomplete Sentences" },
                { part: "Part 6", q: "16 câu", desc: "Text Completion" },
                { part: "Part 7", q: "54 câu", desc: "Reading Comprehension" },
              ].map(p => (
                <div key={p.part} style={{
                  flex: 1, minWidth: 100, padding: "10px 12px", borderRadius: 10,
                  background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{p.part}</div>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>{p.q} · {p.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button type="button" onClick={() => setMode("strategy")} style={{
              ...card, cursor: "pointer", textAlign: "left",
              background: "color-mix(in srgb, var(--accent) 5%, var(--surface))",
            }}>
              <BulbOutlined style={{ fontSize: 24, color: "var(--accent)", marginBottom: 8 }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>Chiến lược làm bài</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Tips cho từng Part</div>
            </button>
            <button type="button" onClick={() => setMode("drill")} style={{
              ...card, cursor: "pointer", textAlign: "left",
              background: "color-mix(in srgb, var(--secondary) 5%, var(--surface))",
            }}>
              <RocketOutlined style={{ fontSize: 24, color: "var(--secondary)", marginBottom: 8 }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>Quick Drill</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Luyện từng Part riêng</div>
            </button>
          </div>

          {/* Full practice CTA */}
          <Link href="/toeic-practice" style={{ textDecoration: "none" }}>
            <div style={{
              ...card, display: "flex", alignItems: "center", gap: 14,
              background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 8%, var(--surface)), color-mix(in srgb, var(--secondary) 6%, var(--surface)))",
              cursor: "pointer",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, display: "grid", placeItems: "center",
                background: "color-mix(in srgb, var(--accent) 12%, var(--surface))",
                color: "var(--accent)", fontSize: 20,
              }}>
                <TrophyOutlined />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>Luyện đề ETS chính hãng</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>1,320 câu hỏi từ ETS 2020-2021</div>
              </div>
              <ArrowRightOutlined style={{ color: "var(--text-muted)" }} />
            </div>
          </Link>
        </div>
      )}

      {/* ── Strategy Mode ── */}
      {mode === "strategy" && (
        <div className="anim-fade-up" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={sectionLabel}>
            <div style={{ width: 3, height: 14, borderRadius: 2, background: "var(--accent)" }} />
            <span>Chiến lược từng phần</span>
          </div>

          {STRATEGIES.map(s => {
            const isExpanded = expandedStrategy === s.id;
            return (
              <button key={s.id} type="button"
                onClick={() => setExpandedStrategy(isExpanded ? null : s.id)}
                style={{ ...card, cursor: "pointer", textAlign: "left", width: "100%" }}>
                <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: s.color, borderRadius: "16px 0 0 16px" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: isExpanded ? 14 : 0 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, display: "grid", placeItems: "center",
                    background: `color-mix(in srgb, ${s.color} 10%, var(--surface))`,
                    color: s.color, fontSize: 16,
                  }}>
                    {s.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{s.part} — {s.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{s.description}</div>
                  </div>
                  <ArrowRightOutlined style={{
                    color: "var(--text-muted)", fontSize: 12,
                    transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }} />
                </div>

                {isExpanded && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 50 }}>
                    {s.tips.map((tip, i) => (
                      <div key={i} style={{
                        display: "flex", gap: 8, alignItems: "flex-start",
                        padding: "8px 12px", borderRadius: 10,
                        background: "var(--bg-deep)", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5,
                      }}>
                        <StarFilled style={{ color: s.color, fontSize: 10, marginTop: 5, flexShrink: 0 }} />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Drill Mode ── */}
      {mode === "drill" && (
        <div className="anim-fade-up" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={sectionLabel}>
            <div style={{ width: 3, height: 14, borderRadius: 2, background: "var(--accent)" }} />
            <span>Chọn bài luyện</span>
          </div>

          {DRILLS.map(d => (
            <Link key={d.label} href={d.href} style={{ textDecoration: "none" }}>
              <div style={{
                ...card, display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12, display: "grid", placeItems: "center",
                  background: d.part === "Full" ? "linear-gradient(135deg, var(--accent), var(--secondary))" : "color-mix(in srgb, var(--accent) 10%, var(--surface))",
                  color: d.part === "Full" ? "#fff" : "var(--accent)", fontSize: 16, fontWeight: 800,
                }}>
                  {d.part === "Full" ? <TrophyOutlined /> : <RocketOutlined />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{d.label}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    {d.description}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>{d.questionCount} câu</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 3 }}>
                    <ClockCircleOutlined style={{ fontSize: 10 }} />{d.estimatedMinutes}p
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
