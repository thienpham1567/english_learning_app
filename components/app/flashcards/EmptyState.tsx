"use client";

import { motion } from "motion/react";
import { PartyPopper, Clock } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  nextReviewAt: string | null;
};

export function EmptyState({ nextReviewAt }: Props) {
  return (
    <motion.div
      className="mx-auto my-auto flex max-w-md flex-col items-center text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="grid size-20 place-items-center rounded-2xl bg-linear-to-br from-emerald-400 via-teal-500 to-cyan-500 text-white shadow-lg"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          delay: 0.1,
          type: "spring",
          stiffness: 180,
          damping: 14,
        }}
      >
        <PartyPopper size={40} strokeWidth={1.6} />
      </motion.div>

      <motion.h2
        className="mt-6 [font-family:var(--font-display)] text-3xl italic text-(--ink)"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        🎉 Bạn đã ôn xong!
      </motion.h2>

      <motion.p
        className="mt-3 text-sm text-(--text-secondary)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Không có thẻ nào cần ôn lúc này. Quay lại sau nhé!
      </motion.p>

      {nextReviewAt && <Countdown targetIso={nextReviewAt} />}
    </motion.div>
  );
}

function Countdown({ targetIso }: { targetIso: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(targetIso).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("Sẵn sàng ôn!");
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
    <motion.div
      className="mt-6 flex items-center gap-2 rounded-full border border-(--border) bg-(--surface) px-4 py-2 text-sm text-(--text-secondary) shadow-(--shadow-sm)"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Clock size={14} strokeWidth={2} />
      <span>Thẻ tiếp theo: <strong className="text-(--ink)">{remaining}</strong></span>
    </motion.div>
  );
}
