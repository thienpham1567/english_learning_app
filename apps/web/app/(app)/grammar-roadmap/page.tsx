"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import * as m from "motion/react-client";
import {
  BookOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  SolutionOutlined,
  SafetyCertificateOutlined,
  StarOutlined,
  RocketOutlined,
  FieldTimeOutlined,
  PartitionOutlined,
  NodeIndexOutlined,
  GlobalOutlined,
  FireOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { Tooltip } from "antd";
import { ModuleHeader } from "@/components/shared/ModuleHeader";

// ── Types ────────────────────────────────────────────────────────
interface Node {
  id: string;
  label: string;
  phase: 1 | 2 | 3;
  icon: React.ReactNode;
  desc: string;
  details: string[];
  x: number; // Percent of width
  y: number; // Pixel vertical spacing
}

interface Connection {
  from: string;
  to: string;
}

// ── Data ─────────────────────────────────────────────────────────
const PHASES = [
  { id: 1, title: "Nền Tảng Vững Chắc", sub: "Xây dựng gốc rễ ngữ pháp cơ bản", color: "var(--accent)" },
  { id: 2, title: "Chuyên Sâu TOEIC", sub: "Nắm vững các cấu trúc Part 5 & 6", color: "var(--secondary)" },
  { id: 3, title: "Chiến Thuật & Tốc Độ", sub: "Tối ưu hóa điểm số và thời gian", color: "var(--error)" },
];

const NODES: Node[] = [
  // Phase 1
  { id: "diag", label: "Diagnostic Test", phase: 1, icon: <SolutionOutlined />, desc: "Đánh giá năng lực đầu vào", details: ["Xác định lỗ hổng kiến thức", "Lập kế hoạch cá nhân hóa"], x: 50, y: 80 },
  { id: "pos", label: "Parts of Speech", phase: 1, icon: <PartitionOutlined />, desc: "Từ loại chính (N/V/Adj/Adv)", details: ["Vị trí từ loại trong câu", "Dấu hiệu nhận biết đuôi từ (Suffix)"], x: 50, y: 220 },
  { id: "tenses", label: "Basic Tenses", phase: 1, icon: <FieldTimeOutlined />, desc: "Các thì cơ bản", details: ["Hiện tại, Quá khứ, Tương lai", "Dấu hiệu trạng từ thời gian"], x: 30, y: 360 },
  { id: "sv", label: "Subject-Verb", phase: 1, icon: <SafetyCertificateOutlined />, desc: "Hòa hợp S-V", details: ["Quy tắc chia động từ chủ ngữ số ít/nhiều", "Các trường hợp đặc biệt cần lưu ý"], x: 70, y: 360 },

  // Phase 2
  { id: "passive", label: "Passive Voice", phase: 2, icon: <NodeIndexOutlined />, desc: "Thể bị động chuyên sâu", details: ["Cấu trúc bị động be + V3/ed", "Nhận biết câu bị động Part 5"], x: 50, y: 520 },
  { id: "gerund", label: "Gerund & Inf", phase: 2, icon: <StarOutlined />, desc: "Danh động từ & To-V", details: ["Động từ đi kèm To-V / V-ing", "Cụm từ đặc biệt ăn điểm"], x: 25, y: 660 },
  { id: "relative", label: "Relative Clauses", phase: 2, icon: <GlobalOutlined />, desc: "Mệnh đề quan hệ", details: ["Đại từ quan hệ Who, Whom, Which", "Mệnh đề quan hệ rút gọn đặc trưng"], x: 75, y: 660 },
  { id: "conj", label: "Conj & Prep", phase: 2, icon: <ToolOutlined />, desc: "Liên từ & Giới từ", details: ["Sự khác biệt Because vs Because of", "Sự khác biệt Although vs Despite"], x: 50, y: 800 },
  
  // Phase 3
  { id: "p56", label: "Part 5 & 6 Strategy", phase: 3, icon: <ThunderboltOutlined />, desc: "Chiến thuật phòng thi", details: ["Phương pháp làm bài nhanh 20s/câu", "Loại trừ bẫy từ vựng thường gặp"], x: 50, y: 960 },
  { id: "traps", label: "Common Traps", phase: 3, icon: <FireOutlined />, desc: "Các bẫy đề thi TOEIC", details: ["Danh từ ghép & từ loại giả", "Từ đa nghĩa phổ biến"], x: 30, y: 1100 },
  { id: "mock", label: "Final Mock Test", phase: 3, icon: <RocketOutlined />, desc: "Luyện đề tổng hợp cuối", details: ["Kiểm tra áp lực thời gian", "Phân tích và khắc phục lỗi sai cuối"], x: 70, y: 1100 },
];

const CONNECTIONS: Connection[] = [
  { from: "diag", to: "pos" },
  { from: "pos", to: "tenses" },
  { from: "pos", to: "sv" },
  { from: "tenses", to: "passive" },
  { from: "sv", to: "passive" },
  { from: "passive", to: "gerund" },
  { from: "passive", to: "relative" },
  { from: "gerund", to: "conj" },
  { from: "relative", to: "conj" },
  { from: "conj", to: "p56" },
  { from: "p56", to: "traps" },
  { from: "p56", to: "mock" },
];

// ── Components ───────────────────────────────────────────────────

function RoadmapNode({ node, delay }: { node: Node; delay: number }) {
  const roadmapToLibrary: Record<string, string> = {
    "pos": "/grammar-lessons",
    "sv": "/grammar-lessons",
    "relative": "/grammar-lessons",
    "conj": "/grammar-lessons",
    "tenses": "/grammar-lessons",
    "passive": "/grammar-lessons",
  };

  const href = roadmapToLibrary[node.id] || "/grammar-lessons";
  const colorVar = `--phase-${node.phase}-color`;

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay, type: "spring", stiffness: 220, damping: 18 }}
      style={{
        position: "absolute",
        left: `${node.x}%`,
        top: node.y,
        transform: "translateX(-50%)",
        zIndex: 10,
      }}
    >
      <Link href={href} style={{ textDecoration: "none" }}>
        <Tooltip
          title={
            <div style={{ padding: "6px 4px" }}>
              <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 6, color: "#fff" }}>{node.desc}</div>
              {node.details.map((d, idx) => (
                <div key={idx} style={{ fontSize: 11.5, opacity: 0.9, display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 4, lineHeight: 1.4 }}>
                  <CheckCircleOutlined style={{ fontSize: 11, color: "var(--success)", marginTop: 2 }} />
                  <span>{d}</span>
                </div>
              ))}
              <div style={{ marginTop: 10, fontSize: 10.5, color: "var(--accent)", fontWeight: 800, borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 6 }}>
                BẤM ĐỂ HỌC CHI TIẾT →
              </div>
            </div>
          }
          color="rgba(24, 24, 27, 0.95)"
          overlayStyle={{ backdropFilter: "blur(8px)" }}
        >
          <m.div
            whileHover={{
              scale: 1.1,
              y: -4,
              boxShadow: `0 12px 30px color-mix(in srgb, var(${colorVar}) 30%, transparent)`,
            }}
            whileTap={{ scale: 0.96 }}
            style={{
              width: 68,
              height: 68,
              borderRadius: "var(--radius-xl)",
              background: "var(--surface)",
              border: `2px solid var(${colorVar})`,
              boxShadow: `0 6px 20px color-mix(in srgb, var(${colorVar}) 15%, transparent)`,
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              position: "relative",
              transition: "border-color 0.2s",
            }}
          >
            <div style={{ fontSize: 24, color: `var(${colorVar})` }}>{node.icon}</div>
            
            <div style={{
              position: "absolute",
              top: "105%",
              left: "50%",
              transform: "translateX(-50%)",
              whiteSpace: "nowrap",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>{node.label}</div>
              <div style={{ fontSize: 9.5, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Giai đoạn {node.phase}</div>
            </div>
          </m.div>
        </Tooltip>
      </Link>
    </m.div>
  );
}

function PhaseHeader({ phase, y }: { phase: typeof PHASES[0]; y: number }) {
  return (
    <m.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      style={{
        position: "absolute",
        top: y,
        left: 20,
        zIndex: 5,
      }}
    >
      <div style={{ fontSize: 10.5, fontWeight: 900, color: phase.color, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 2 }}>
        Giai đoạn 0{phase.id}
      </div>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
        {phase.title}
      </h2>
      <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>
        {phase.sub}
      </p>
    </m.div>
  );
}

export default function GrammarRoadmapPage() {
  const connectionPaths = useMemo(() => {
    return CONNECTIONS.map((conn) => {
      const from = NODES.find((n) => n.id === conn.from)!;
      const to = NODES.find((n) => n.id === conn.to)!;
      const startX = `${from.x}%`;
      const startY = from.y + 34;
      const endX = `${to.x}%`;
      const endY = to.y + 34;
      
      return { from, to, startX, startY, endX, endY };
    });
  }, []);

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
        <ModuleHeader
          icon={<BookOutlined />}
          gradient="var(--gradient-grammar)"
          title="Lộ trình Ngữ pháp"
          subtitle="Bản đồ học tập cá nhân hóa hướng đến mục tiêu điểm TOEIC tối đa"
        />
      </div>

      {/* Main Roadmap Container */}
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
        {/* Soft back glowing spots */}
        <div
          style={{
            pointerEvents: "none",
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse 60% 40% at 50% 0%, color-mix(in srgb, var(--accent) 5%, transparent) 0%, transparent 70%)",
          }}
        />

        <div style={{ position: "relative", width: "100%", maxWidth: 640, margin: "0 auto", height: 1240 }}>
          {/* SVG Connector Layer */}
          <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "visible" }}>
            <defs>
              <linearGradient id="roadmapGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.8" />
                <stop offset="50%" stopColor="var(--secondary)" stopOpacity="0.8" />
                <stop offset="100%" stopColor="var(--error)" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            
            {connectionPaths.map((path, idx) => (
              <m.line
                key={`${path.from.id}-${path.to.id}`}
                x1={path.startX}
                y1={path.startY}
                x2={path.endX}
                y2={path.endY}
                stroke="url(#roadmapGradient)"
                strokeWidth="2.5"
                className="roadmap-flow-line"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 0.45 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + idx * 0.04, duration: 0.8 }}
              />
            ))}
          </svg>

          {/* Phase Indicators */}
          <PhaseHeader phase={PHASES[0]} y={10} />
          <PhaseHeader phase={PHASES[1]} y={450} />
          <PhaseHeader phase={PHASES[2]} y={890} />

          {/* Roadmap Steps */}
          {NODES.map((node, idx) => (
            <RoadmapNode key={node.id} node={node} delay={0.06 * idx} />
          ))}
        </div>
      </div>

      <style>{`
        :root {
          --phase-1-color: var(--success);
          --phase-2-color: var(--accent);
          --phase-3-color: var(--error);
        }
        @keyframes roadmapDash {
          to {
            stroke-dashoffset: -20;
          }
        }
        .roadmap-flow-line {
          stroke-dasharray: 6, 6;
          animation: roadmapDash 1.2s linear infinite;
        }
      `}</style>
    </div>
  );
}
