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
  { id: 3, title: "Chiến Thuật & Tốc Độ", sub: "Tối ưu hóa điểm số và thời gian", color: "var(--warning)" },
];

const NODES: Node[] = [
  // Phase 1
  { id: "diag", label: "Diagnostic Test", phase: 1, icon: <SolutionOutlined />, desc: "Đánh giá năng lực đầu vào", details: ["Xác định lỗ hổng", "Lập kế hoạch cá nhân"], x: 50, y: 80 },
  { id: "pos", label: "Parts of Speech", phase: 1, icon: <PartitionOutlined />, desc: "Từ loại (N/V/Adj/Adv)", details: ["Vị trí từ loại", "Dấu hiệu nhận biết (Suffix)"], x: 50, y: 220 },
  { id: "tenses", label: "Basic Tenses", phase: 1, icon: <FieldTimeOutlined />, desc: "Các thì cơ bản", details: ["Hiện tại, Quá khứ, Tương lai", "Dấu hiệu nhận biết thời gian"], x: 30, y: 360 },
  { id: "sv", label: "Subject-Verb", phase: 1, icon: <SafetyCertificateOutlined />, desc: "Hòa hợp S-V", details: ["Chủ ngữ số ít/nhiều", "Các trường hợp đặc biệt"], x: 70, y: 360 },

  // Phase 2
  { id: "passive", label: "Passive Voice", phase: 2, icon: <NodeIndexOutlined />, desc: "Thể bị động", details: ["Cấu trúc be + V3/ed", "Nhận biết câu bị động Part 5"], x: 50, y: 520 },
  { id: "gerund", label: "Gerund & Inf", phase: 2, icon: <StarOutlined />, desc: "V-ing & To-V", details: ["Các động từ đi kèm To-V", "Các động từ đi kèm V-ing"], x: 25, y: 660 },
  { id: "relative", label: "Relative Clauses", phase: 2, icon: <GlobalOutlined />, desc: "Mệnh đề quan hệ", details: ["Who, Whom, Which, That", "Mệnh đề quan hệ rút gọn"], x: 75, y: 660 },
  { id: "conj", label: "Conj & Prep", phase: 2, icon: <ToolOutlined />, desc: "Liên từ & Giới từ", details: ["Because vs Because of", "Although vs Despite"], x: 50, y: 800 },
  
  // Phase 3
  { id: "p56", label: "Part 5 & 6 Strategy", phase: 3, icon: <ThunderboltOutlined />, desc: "Chiến thuật phòng thi", details: ["Phương pháp 20s/câu", "Loại trừ đáp án bẫy"], x: 50, y: 960 },
  { id: "traps", label: "Common Traps", phase: 3, icon: <FireOutlined />, desc: "Các bẫy thường gặp", details: ["Tên riêng gây nhầm lẫn", "Từ đa nghĩa"], x: 30, y: 1100 },
  { id: "mock", label: "Final Mock Test", phase: 3, icon: <RocketOutlined />, desc: "Luyện đề tổng hợp", details: ["Áp lực thời gian thực", "Phân tích lỗi sai cuối"], x: 70, y: 1100 },
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

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ delay, type: "spring", stiffness: 260, damping: 20 }}
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
            <div style={{ padding: "4px 2px" }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{node.desc}</div>
              {node.details.map((d) => (
                <div key={d} style={{ fontSize: 12, opacity: 0.85, display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircleOutlined style={{ fontSize: 10, color: "var(--success)" }} /> {d}
                </div>
              ))}
              <div style={{ marginTop: 8, fontSize: 10, color: "var(--accent)", fontWeight: 700 }}>BẤM ĐỂ HỌC CHI TIẾT →</div>
            </div>
          }
          color="rgba(0,0,0,0.85)"
          overlayStyle={{ backdropFilter: "blur(8px)" }}
        >
          <m.div
            whileHover={{ scale: 1.1, y: -5, boxShadow: `0 12px 40px color-mix(in srgb, var(--phase-${node.phase}-color) 30%, transparent)` }}
            whileTap={{ scale: 0.95 }}
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "var(--surface)",
              border: `2px solid var(--phase-${node.phase}-color)`,
              boxShadow: `0 8px 32px color-mix(in srgb, var(--phase-${node.phase}-color) 20%, transparent)`,
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              position: "relative",
            }}
          >
            <div style={{ fontSize: 28, color: "var(--ink)" }}>{node.icon}</div>
            
            <div style={{
              position: "absolute",
              top: "105%",
              left: "50%",
              transform: "translateX(-50%)",
              whiteSpace: "nowrap",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)", fontFamily: "var(--font-display)" }}>{node.label}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Phase {node.phase}</div>
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
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      style={{
        position: "absolute",
        top: y,
        left: 20,
        zIndex: 5,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 800, color: phase.color, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 4 }}>Phase 0{phase.id}</div>
      <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--ink)", fontFamily: "var(--font-display)", fontStyle: "italic" }}>{phase.title}</h2>
      <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)" }}>{phase.sub}</p>
    </m.div>
  );
}

export default function GrammarRoadmapPage() {
  const connectionPaths = useMemo(() => {
    return CONNECTIONS.map((conn) => {
      const from = NODES.find((n) => n.id === conn.from)!;
      const to = NODES.find((n) => n.id === conn.to)!;
      const startX = `${from.x}%`;
      const startY = from.y + 36;
      const endX = `${to.x}%`;
      const endY = to.y + 36;
      
      return { from, to, startX, startY, endX, endY };
    });
  }, []);

  return (
    <div style={{ minHeight: "100%", paddingBottom: 120, position: "relative", overflowX: "hidden" }}>
      {/* ── Page Header ── */}
      <div style={{ padding: "40px 24px 80px", textAlign: "center" }}>
        <m.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ margin: "0 0 12px", fontSize: 42, fontWeight: 900, fontFamily: "var(--font-display)", fontStyle: "italic", color: "var(--ink)" }}
        >
          Grammar <span style={{ color: "var(--accent)" }}>Roadmap</span>
        </m.h1>
        <m.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ margin: 0, fontSize: 16, color: "var(--text-muted)", maxWidth: 600, marginInline: "auto" }}
        >
          Lộ trình ôn tập ngữ pháp tối ưu được nghiên cứu dành riêng cho kỳ thi TOEIC 2024–2025.
        </m.p>
      </div>

      <div style={{ position: "relative", width: "100%", maxWidth: 800, margin: "0 auto", height: 1300 }}>
        {/* ── Connections SVG Layer ── */}
        <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "visible" }}>
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.6" />
              <stop offset="50%" stopColor="var(--secondary)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="var(--warning)" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          
          {connectionPaths.map((path, i) => (
            <m.line
              key={`${path.from.id}-${path.to.id}`}
              x1={path.startX}
              y1={path.startY}
              x2={path.endX}
              y2={path.endY}
              stroke="url(#pathGradient)"
              strokeWidth="2"
              strokeDasharray="8,8"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 0.3 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 + i * 0.05, duration: 1 }}
            />
          ))}
        </svg>

        {/* ── Phase Markers ── */}
        <PhaseHeader phase={PHASES[0]} y={20} />
        <PhaseHeader phase={PHASES[1]} y={460} />
        <PhaseHeader phase={PHASES[2]} y={900} />

        {/* ── Nodes ── */}
        {NODES.map((node, i) => (
          <RoadmapNode key={node.id} node={node} delay={0.1 * i} />
        ))}
      </div>

      {/* ── Style Tokens ── */}
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
