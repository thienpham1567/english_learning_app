"use client";

import { Blocks, Wand2 } from "lucide-react";
import * as m from "motion/react-client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { MorphemeProgressItem } from "@/lib/morphology/schema";
import { MorphemeCatalog } from "./_components/MorphemeCatalog";
import { MorphemeLessonView } from "./_components/MorphemeLessonView";
import { WordAnalyzer } from "./_components/WordAnalyzer";
import type { MorphemeCatalogItem } from "./_data/morphemes";

type Mode = "browse" | "analyze";

const TABS = [
  { key: "browse" as Mode, label: "Browse", desc: "Learn morphemes & exercises", Icon: Blocks },
  { key: "analyze" as Mode, label: "Analyze", desc: "Break down any word", Icon: Wand2 },
];

export default function MorphologyPage() {
  const [mode, setMode] = useState<Mode>("browse");
  const [selected, setSelected] = useState<MorphemeCatalogItem | null>(null);
  const [progress, setProgress] = useState<Record<string, MorphemeProgressItem>>({});

  const loadProgress = useCallback(async () => {
    try {
      const data = await api.get<{ progress: Record<string, MorphemeProgressItem> }>(
        "/morphology/progress",
      );
      setProgress(data.progress ?? {});
    } catch {
      /* badges are best-effort */
    }
  }, []);

  useEffect(() => {
    void loadProgress();
  }, [loadProgress]);

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-black text-text-primary font-display">Word Formation</h1>
          <p className="text-text-secondary text-[13.5px] font-medium mt-0.5">
            Learn vocabulary by mastering prefixes, suffixes, and roots.
          </p>
        </div>

        {/* Hide tabs while inside a lesson to keep focus */}
        {!selected && (
          <div className="flex gap-1.5 bg-surface-alt rounded-2xl p-1 border-2 border-border shadow-sm mb-6 max-w-md">
            {TABS.map((tab) => {
              const active = mode === tab.key;
              return (
                <m.button
                  key={tab.key}
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setMode(tab.key)}
                  className={`flex-1 flex items-center gap-2.5 px-4 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    active
                      ? "bg-accent text-text-on-accent shadow-sm"
                      : "bg-transparent text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <tab.Icon size={18} className="shrink-0" />
                  <div className="text-left min-w-0">
                    <div className={`text-sm ${active ? "font-black" : "font-bold"}`}>
                      {tab.label}
                    </div>
                    <div className={`text-[10px] truncate ${active ? "opacity-75" : "opacity-50"}`}>
                      {tab.desc}
                    </div>
                  </div>
                </m.button>
              );
            })}
          </div>
        )}

        {/* Content */}
        {mode === "browse" ? (
          selected ? (
            <MorphemeLessonView
              item={selected}
              onBack={() => setSelected(null)}
              onCompleted={loadProgress}
            />
          ) : (
            <MorphemeCatalog progress={progress} onSelect={setSelected} />
          )
        ) : (
          <WordAnalyzer />
        )}
      </div>
    </div>
  );
}
