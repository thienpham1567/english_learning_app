"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

import * as m from "motion/react-client";
import { BookOpen, Loader2, Search, Star } from "lucide-react";

const ToeicVocabTab = dynamic(
  () =>
    import("@/app/(app)/my-vocabulary/_components/ToeicVocabTab").then(
      (m) => m.ToeicVocabTab,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center text-text-muted gap-2.5" style={{padding: 60}} >
        <Loader2 className="animate-spin text-accent" size={20} />
        <span className="font-bold text-sm" >Đang tải...</span>
      </div>
    ),
  },
);

const DictionaryTab = dynamic(
  () =>
    import("@/app/(app)/my-vocabulary/_components/DictionaryTab").then(
      (m) => m.DictionaryTab,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center text-text-muted gap-2.5" style={{padding: 60}} >
        <Loader2 className="animate-spin text-accent" size={20} />
        <span className="font-bold text-sm" >Đang tải...</span>
      </div>
    ),
  },
);

type TabKey = "toeic" | "dictionary";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "toeic", label: "TOEIC 600", icon: <BookOpen /> },
  { key: "dictionary", label: "Tra từ điển", icon: <Search /> },
];

const SUBTITLES: Record<TabKey, string> = {
  toeic: "600 từ thiết yếu · 10 chủ đề · SRS",
  dictionary: "Tra cứu · Lịch sử · Từ đã lưu",
};

const GRADIENTS: Record<TabKey, string> = {
  toeic: "var(--gradient-vocab)",
  dictionary: "var(--gradient-vocab)",
};

const TAB_COLORS: Record<TabKey, string> = {
  toeic: "var(--accent)",
  dictionary: "var(--secondary, var(--accent))",
};

export default function MyVocabularyPage() {
  const [active, setActive] = useState<TabKey>("toeic");

  return (
    <div className="flex flex-col h-full h-[0px] flex-1 overflow-hidden" >

      {/* Tab switcher */}
      <div className="shrink-0" style={{padding: "12px 16px 6px"}} >
        <div className="flex gap-1 bg-surface-alt rounded-(--radius-xl) p-1" style={{border: "1.5px solid var(--border)"}} >
          {TABS.map((t) => {
            const isActive = active === t.key;
            return (
              <m.button
                type="button"
                key={t.key}
                onClick={() => setActive(t.key)}
                whileTap={{ scale: 0.98 }} className="flex-1 py-2.5 px-4 rounded-(--radius-lg) border-none cursor-pointer flex items-center justify-center gap-2 font-extrabold" style={{background: isActive ? TAB_COLORS[t.key] : "transparent", color: isActive ? "var(--text-on-accent)" : "var(--text-secondary)", fontSize: 13.5, transition: "color 0.2s, background 0.2s"}} >
                {t.icon}
                <span>{t.label}</span>
              </m.button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 h-[0px] overflow-auto" style={{padding: "16px 16px 40px"}} >
        {active === "toeic" && <ToeicVocabTab />}
        {active === "dictionary" && <DictionaryTab />}
      </div>
    </div>
  );
}
