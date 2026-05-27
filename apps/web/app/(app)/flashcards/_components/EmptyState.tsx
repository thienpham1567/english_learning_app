"use client";

import { CircleCheckBig, Clock } from "lucide-react";
import * as m from "motion/react-client";
import { useEffect, useState } from "react";

type Props = {
  nextReviewAt: string | null;
};

export function EmptyState({ nextReviewAt }: Props) {
  return (
    <m.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      className="w-full max-w-[450px] bg-surface rounded-xl border-2 border-border text-center relative overflow-hidden mx-auto my-10 py-12 px-6 shadow-sm"
    >
      {/* Background soft accent glow */}
      <div
        className="absolute w-[220px] h-[220px] rounded-full left-1/2 top-0 -translate-x-1/2 pointer-events-none"
        style={{
          background: "radial-gradient(circle, var(--accent) 8%, transparent 70%)",
        }}
      />

      <m.div
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="mb-5 inline-flex"
      >
        <div className="w-16 h-16 rounded-full grid place-items-center bg-accent-light">
          <CircleCheckBig className="text-4xl text-accent" />
        </div>
      </m.div>

      <h3 className="font-display font-extrabold mb-2.5 text-text-primary text-xl">
        Review Complete!
      </h3>

      <p className="text-text-secondary font-medium leading-relaxed text-[14.5px] mx-0 mb-6 mt-0">
        Awesome! You have no cards left to review. Take a break and return later.
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
        setRemaining("Ready!");
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
      className="inline-flex items-center gap-2 bg-surface-alt border-2 border-border rounded-full py-2 px-4.5 shadow-sm"
    >
      <Clock className="text-accent text-[13px]" />
      <span className="font-bold text-text-secondary text-[12.5px]">
        Next review session: <span className="text-accent">{remaining}</span>
      </span>
    </m.div>
  );
}
