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
      transition={{ type: "spring", stiffness: 100, damping: 15 }} className="w-full w-[450px] bg-(--surface) rounded-(--radius-xl) border-2 border-border text-center relative overflow-hidden" style={{margin: "40px auto", padding: "48px 24px", boxShadow: "var(--shadow-sm)"}} >
      {/* Background soft accent glow */}
      <div className="absolute w-[220px] h-[220px] rounded-full" style={{left: "50%", top: "0%", transform: "translateX(-50%)", background: "radial-gradient(circle, var(--accent) 8%, transparent 70%)", pointerEvents: "none"}} />

      <m.div
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="mb-5" style={{display: "inline-flex"}} >
        <div className="w-[64px] h-[64px] rounded-full grid" style={{background: "var(--accent-light)", placeItems: "center"}} >
          <CircleCheckBig className="text-4xl text-accent" />
        </div>
      </m.div>

      <Title level={3} className="font-display font-extrabold mb-2.5 text-text-primary" >
        Đã hoàn thành ôn tập!
      </Title>
      
      <p className="text-text-secondary font-medium leading-relaxed" style={{margin: "0 0 24px", fontSize: 14.5}} >
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
      transition={{ delay: 0.2 }} className="items-center gap-2 bg-surface-alt border-2 border-border rounded-full" style={{display: "inline-flex", padding: "8px 18px", boxShadow: "var(--shadow-sm)"}} >
      <Clock className="text-accent text-[13px]" />
      <span className="font-bold text-text-secondary" style={{fontSize: 12.5}} >
        Đợt ôn tập tiếp theo: <span className="text-accent" >{remaining}</span>
      </span>
    </m.div>
  );
}
