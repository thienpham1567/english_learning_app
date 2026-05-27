"use client";

import { BookOpen, Headphones, HelpCircle, Loader2, Mic, PenTool } from "lucide-react";
import * as m from "motion/react-client";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

const ListeningTab = dynamic(
  () => import("./_components/ListeningTab").then((m) => m.ListeningTab),
  { ssr: false, loading: () => <TabLoader /> },
);
const ReadingTab = dynamic(() => import("./_components/ReadingTab").then((m) => m.ReadingTab), {
  ssr: false,
  loading: () => <TabLoader />,
});
const SpeakingTab = dynamic(() => import("./_components/SpeakingTab").then((m) => m.SpeakingTab), {
  ssr: false,
  loading: () => <TabLoader />,
});
const WritingTab = dynamic(() => import("./_components/WritingTab").then((m) => m.WritingTab), {
  ssr: false,
  loading: () => <TabLoader />,
});
const Part5Tab = dynamic(() => import("./_components/Part5Tab").then((m) => m.Part5Tab), {
  ssr: false,
  loading: () => <TabLoader />,
});

function TabLoader() {
  return (
    <div className="flex justify-center items-center py-16 text-text-secondary gap-2.5 font-bold text-sm">
      <Loader2 className="h-5 w-5 animate-spin text-accent" />
      <span>Loading learning content...</span>
    </div>
  );
}

type Skill = "listening" | "reading" | "speaking" | "writing" | "part5";

const SKILL_TABS: {
  value: Skill;
  label: string;
  parts: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "listening", label: "Listening", parts: "Part 1–4", icon: Headphones },
  { value: "reading", label: "Reading", parts: "Part 5–7", icon: BookOpen },
  { value: "speaking", label: "Speaking", parts: "Part 1–6", icon: Mic },
  { value: "writing", label: "Writing", parts: "Part 1–3", icon: PenTool },
  { value: "part5", label: "Part 5", parts: "Grammar", icon: HelpCircle },
];

export default function ToeicSkillsPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Skill) || "listening";
  const [active, setActive] = useState<Skill>(
    SKILL_TABS.some((t) => t.value === initialTab) ? initialTab : "listening",
  );

  return (
    <div className="flex flex-col h-full min-h-0 flex-1 overflow-hidden">
      {/* ─── Skill Tab Switcher ─── */}
      <div className="px-4 pt-4 pb-2 shrink-0 overflow-x-auto scrollbar-none">
        <div className="max-w-4xl mx-auto flex gap-1 bg-surface-alt border-2 border-border rounded-2xl p-1 w-fit md:w-full">
          {SKILL_TABS.map((t) => {
            const isActive = active === t.value;
            const Icon = t.icon;
            return (
              <m.button
                type="button"
                key={t.value}
                onClick={() => setActive(t.value)}
                whileTap={{ scale: 0.97 }}
                className={`flex-1 min-w-[72px] flex flex-col items-center justify-center gap-0.5 py-2.5 px-3 rounded-xl cursor-pointer transition-all duration-150 ${
                  isActive
                    ? "bg-accent text-ink font-black shadow-sm"
                    : "bg-transparent text-text-secondary font-bold hover:text-text-primary"
                }`}
              >
                <div className="flex items-center gap-1.5 text-[12px] leading-none">
                  <Icon className="h-4 w-4" />
                  <span>{t.label}</span>
                </div>
                <span
                  className={`text-[9px] font-bold leading-none mt-0.5 ${
                    isActive ? "text-ink/70" : "text-text-muted"
                  }`}
                >
                  {t.parts}
                </span>
              </m.button>
            );
          })}
        </div>
      </div>

      {/* ─── Content ─── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 pb-12">
        <div className="max-w-4xl mx-auto">
          {active === "listening" && <ListeningTab />}
          {active === "reading" && <ReadingTab />}
          {active === "speaking" && <SpeakingTab />}
          {active === "writing" && <WritingTab />}
          {active === "part5" && <Part5Tab />}
        </div>
      </div>
    </div>
  );
}
