"use client";

import { useEffect, useState } from "react";
import { Card, Flex, Typography } from "antd";

import * as m from "motion/react-client";
import { CircleCheckBig, Clock, Smile } from "lucide-react";

const { Text, Title } = Typography;

type Props = {
  nextReviewAt: string | null;
};

export function EmptyState({ nextReviewAt }: Props) {
  return (
    <m.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      style={{
        width: "100%",
        maxWidth: 450,
        margin: "40px auto",
        padding: "48px 24px",
        background: "var(--surface)",
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background soft accent glow */}
      <div style={{ position: "absolute", left: "50%", top: "0%", transform: "translateX(-50%)", width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, var(--accent) 8%, transparent 70%)", pointerEvents: "none" }} />

      <m.div
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        style={{ display: "inline-flex", marginBottom: 20 }}
      >
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--accent-light)", display: "grid", placeItems: "center" }}>
          <CircleCheckBig style={{ fontSize: 32, color: "var(--accent)" }} />
        </div>
      </m.div>

      <Title level={3} style={{ fontFamily: "var(--font-display)", fontWeight: 800, margin: "0 0 10px", color: "var(--text-primary)" }}>
        Đã hoàn thành ôn tập!
      </Title>
      
      <p style={{ margin: "0 0 24px", fontSize: 14.5, color: "var(--text-secondary)", fontWeight: 500, lineHeight: 1.6 }}>
        Tuyệt vời! Hiện tại bạn không còn thẻ nào cần ôn tập. Hãy nghỉ ngơi và quay lại sau nhé.
      </p>

      {nextReviewAt && <Countdown targetIso={nextReviewAt} />}
    </m.div>
  );
}

function Countdown({ targetIso }: { targetIso: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(targetIso).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("Sẵn sàng!");
        return;
      }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      setRemaining(`${h}h ${m}m`);
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [targetIso]);

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 18px",
        background: "var(--surface-alt)",
        border: "1px solid var(--border)",
        borderRadius: 99,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <Clock style={{ color: "var(--accent)", fontSize: 13 }} />
      <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-secondary)" }}>
        Đợt ôn tập tiếp theo: <span style={{ color: "var(--accent)" }}>{remaining}</span>
      </span>
    </m.div>
  );
}
