"use client";

import { ChevronRight, Map } from "lucide-react";
import * as m from "motion/react-client";
import Link from "next/link";
import { getWeek } from "@/lib/curriculum/data";
import { useRoadmap } from "@/lib/curriculum/roadmap-context";

/**
 * Reusable roadmap context banner for use in any page.
 * Shows current week number + focus topic, links to week detail.
 */
export function RoadmapBanner({ className = "" }: { className?: string }) {
  const { getCurrentWeek } = useRoadmap();
  const currentWeek = getCurrentWeek();
  const week = getWeek(currentWeek);

  return (
    <m.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className={className}>
      <Link href={`/roadmap/week/${currentWeek}`} className="no-underline">
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 border-accent/20 bg-accent/5 hover:bg-accent/8 transition-colors cursor-pointer">
          <Map size={14} className="text-accent shrink-0" />
          <span className="text-[11px] font-bold text-text-secondary flex-1 truncate">
            <span className="text-accent font-extrabold">Week {currentWeek}</span>
            {week ? ` — ${week.focusTopic}` : ""}
          </span>
          <ChevronRight size={12} className="text-accent shrink-0" />
        </div>
      </Link>
    </m.div>
  );
}
