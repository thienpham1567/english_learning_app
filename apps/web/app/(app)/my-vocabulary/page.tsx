"use client";

import { BookOpen, Loader2, Search, Star } from "lucide-react";
import * as m from "motion/react-client";
import dynamic from "next/dynamic";
import { useState } from "react";

const ToeicVocabTab = dynamic(
  () => import("@/app/(app)/my-vocabulary/_components/ToeicVocabTab").then((m) => m.ToeicVocabTab),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center text-text-muted gap-2.5" style={{ padding: 60 }}>
        <Loader2 className="animate-spin text-accent" size={20} />
        <span className="font-bold text-sm">Loading...</span>
      </div>
    ),
  },
);

const DictionaryTab = dynamic(
  () => import("@/app/(app)/my-vocabulary/_components/DictionaryTab").then((m) => m.DictionaryTab),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center text-text-muted gap-2.5" style={{ padding: 60 }}>
        <Loader2 className="animate-spin text-accent" size={20} />
        <span className="font-bold text-sm">Loading...</span>
      </div>
    ),
  },
);

type TabKey = "toeic" | "dictionary";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "toeic", label: "TOEIC 600", icon: <BookOpen /> },
  { key: "dictionary", label: "Dictionary Search", icon: <Search /> },
];

const SUBTITLES: Record<TabKey, string> = {
  toeic: "600 essential words · 10 topics · SRS",
  dictionary: "Search · History · Saved Words",
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
    <div className="flex flex-col h-full flex-1 overflow-hidden">
      {/* Tab switcher */}
      <div className="shrink-0 px-4 pt-3.5 pb-1.5 max-w-4xl w-full mx-auto">
        <div className="flex gap-1 bg-surface-alt rounded-2xl p-1 border-2 border-border shadow-(--shadow-sm)">
          {TABS.map((t) => {
            const isActive = active === t.key;
            return (
              <m.button
                type="button"
                key={t.key}
                onClick={() => setActive(t.key)}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 py-2.5 px-4 rounded-xl cursor-pointer flex items-center justify-center gap-2 text-xs md:text-sm font-black transition-colors duration-150 ${
                  isActive
                    ? t.key === "toeic"
                      ? "bg-accent text-text-on-accent"
                      : "bg-secondary text-white border-none"
                    : "bg-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </m.button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 pb-12">
        {active === "toeic" && <ToeicVocabTab />}
        {active === "dictionary" && <DictionaryTab />}
      </div>
    </div>
  );
}
