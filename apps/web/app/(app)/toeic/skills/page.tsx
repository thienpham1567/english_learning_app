"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import {
  Headphones,
  BookOpen,
  Mic,
  PenTool,
  Loader2,
  HelpCircle,
} from "lucide-react";
import { motion } from "motion/react";

const ListeningTab = dynamic(
  () =>
    import("./_components/ListeningTab").then(
      (m) => m.ListeningTab,
    ),
  { ssr: false, loading: () => <TabLoader /> },
);
const ReadingTab = dynamic(
  () =>
    import("./_components/ReadingTab").then(
      (m) => m.ReadingTab,
    ),
  { ssr: false, loading: () => <TabLoader /> },
);
const SpeakingTab = dynamic(
  () =>
    import("./_components/SpeakingTab").then(
      (m) => m.SpeakingTab,
    ),
  { ssr: false, loading: () => <TabLoader /> },
);
const WritingTab = dynamic(
  () =>
    import("./_components/WritingTab").then(
      (m) => m.WritingTab,
    ),
  { ssr: false, loading: () => <TabLoader /> },
);
const Part5Tab = dynamic(
  () =>
    import("./_components/Part5Tab").then(
      (m) => m.Part5Tab,
    ),
  { ssr: false, loading: () => <TabLoader /> },
);

function TabLoader() {
  return (
    <div className="flex justify-center items-center py-16 text-slate-500 gap-2.5 font-bold text-sm">
      <Loader2 className="h-5 w-5 animate-spin text-accent" />
      <span>Đang tải nội dung học...</span>
    </div>
  );
}

type Skill = "listening" | "reading" | "speaking" | "writing" | "part5";

const SKILL_TABS: {
  value: Skill;
  label: string;
  parts: string;
  icon: React.ReactNode;
}[] = [
  { value: "listening", label: "Listening", parts: "Part 1–4", icon: <Headphones className="h-4 w-4" /> },
  { value: "reading", label: "Reading", parts: "Part 5–7", icon: <BookOpen className="h-4 w-4" /> },
  { value: "speaking", label: "Speaking", parts: "Part 1–6", icon: <Mic className="h-4 w-4" /> },
  { value: "writing", label: "Writing", parts: "Part 1–3", icon: <PenTool className="h-4 w-4" /> },
  { value: "part5", label: "Part 5", parts: "Grammar", icon: <HelpCircle className="h-4 w-4" /> },
];

const SUBTITLES: Record<Skill, string> = {
  listening: "TOEIC Listening · Part 1–4 · Nghe hiểu",
  reading: "TOEIC Reading · Part 5–7 · Đọc hiểu",
  speaking: "TOEIC Speaking · 11 câu · Nói",
  writing: "TOEIC Writing · 8 câu · Viết",
  part5: "TOEIC Part 5 · Incomplete Sentences · Ngữ pháp",
};

const GRADIENTS: Record<Skill, string> = {
  listening: "var(--gradient-listening)",
  reading: "var(--gradient-reading)",
  speaking: "var(--gradient-toeic-speaking)",
  writing: "var(--gradient-writing)",
  part5: "var(--gradient-grammar-quiz)",
};

const TAB_COLORS: Record<Skill, { activeColor: string }> = {
  listening: { activeColor: "bg-[#3B82F6] text-white" },
  reading: { activeColor: "bg-[#0EA5E9] text-white" },
  speaking: { activeColor: "bg-accent text-white" },
  writing: { activeColor: "bg-[#C07D2B] text-white" },
  part5: { activeColor: "bg-accent text-white" },
};

export default function ToeicSkillsPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Skill) || "listening";
  const [active, setActive] = useState<Skill>(
    SKILL_TABS.some((t) => t.value === initialTab) ? initialTab : "listening"
  );

  return (
    <div className="flex flex-col h-full min-h-0 flex-1 overflow-hidden bg-slate-950">
      <div className="px-4 pt-5 shrink-0">
        <div className="max-w-4xl mx-auto">
        </div>
      </div>
      
      {/* Pill Tabs Row */}
      <div className="px-4 py-3 shrink-0 overflow-x-auto scrollbar-none">
        <div className="max-w-4xl mx-auto flex gap-1 bg-slate-900/40 border border-slate-850 rounded-2xl p-1 w-fit md:w-full">
          {SKILL_TABS.map((t) => {
            const isActive = active === t.value;
            const colors = TAB_COLORS[t.value];
            return (
              <motion.button
                type="button"
                key={t.value}
                onClick={() => setActive(t.value)}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 min-w-[80px] flex flex-col items-center justify-center gap-1 py-2 px-3.5 rounded-xl cursor-pointer transition-all duration-200 ${
                  isActive 
                    ? colors.activeColor + " shadow-sm font-bold" 
                    : "text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-extrabold leading-none">
                  {t.icon}
                  <span>{t.label}</span>
                </div>
                <span className={`text-[9px] font-bold leading-none ${isActive ? "text-white/80" : "text-slate-500"}`}>
                  {t.parts}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 pb-12 animate-in fade-in duration-300">
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
