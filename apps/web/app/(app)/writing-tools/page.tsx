"use client";

import { ArrowLeftRight, CheckSquare, Loader2, Volume2 } from "lucide-react";
import * as m from "motion/react-client";
import dynamic from "next/dynamic";
import { useState } from "react";

const GrammarChecker = dynamic(
  () => import("./_components/GrammarChecker").then((m) => m.GrammarChecker),
  { ssr: false, loading: () => <Loader label="Loading Grammar Checker..." /> },
);
const Paraphraser = dynamic(() => import("./_components/Paraphraser").then((m) => m.Paraphraser), {
  ssr: false,
  loading: () => <Loader label="Loading Paraphraser..." />,
});
const TtsReader = dynamic(() => import("./_components/TtsReader").then((m) => m.TtsReader), {
  ssr: false,
  loading: () => <Loader label="Loading Text-to-Speech..." />,
});

function Loader({ label }: { label: string }) {
  return (
    <div className="flex justify-center items-center text-text-muted gap-2.5 font-bold text-sm py-16">
      <Loader2 className="animate-spin text-accent" size={20} />
      <span>{label}</span>
    </div>
  );
}

type ToolTab = "grammar" | "paraphrase" | "tts";

const TABS: {
  value: ToolTab;
  label: string;
  desc: string;
  icon: React.ReactNode;
  accent: string;
}[] = [
  { value: "grammar", label: "Grammar Checker", desc: "Check grammar", icon: <CheckSquare size={16} />, accent: "var(--error)" },
  { value: "paraphrase", label: "Paraphraser", desc: "Paraphrase sentence", icon: <ArrowLeftRight size={16} />, accent: "var(--secondary)" },
  { value: "tts", label: "Voice Generator", desc: "Text-to-speech", icon: <Volume2 size={16} />, accent: "var(--module-grammar)" },
];

export default function WritingToolsPage() {
  const [active, setActive] = useState<ToolTab>("grammar");

  return (
    <div className="flex flex-col h-full flex-1 overflow-hidden">
      {/* Tab switcher */}
      <div className="shrink-0 px-4 pt-3.5 pb-1.5 max-w-4xl w-full mx-auto">
        <div className="flex gap-1 bg-surface-alt rounded-2xl p-1 border-2 border-border shadow-sm overflow-x-auto scrollbar-none">
          {TABS.map((t) => {
            const isActive = active === t.value;
            return (
              <m.button
                type="button"
                key={t.value}
                onClick={() => setActive(t.value)}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 py-2.5 px-4 rounded-xl cursor-pointer flex items-center justify-center gap-2 text-xs md:text-sm font-black transition-colors duration-150 min-w-max ${
                  isActive
                    ? "bg-accent text-text-on-accent border-none"
                    : "bg-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                {t.icon}
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.label.split(" ")[0]}</span>
              </m.button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 pb-12">
        <div className="max-w-[800px] mx-auto w-full">
          {active === "grammar" && <GrammarChecker />}
          {active === "paraphrase" && <Paraphraser />}
          {active === "tts" && <TtsReader />}
        </div>
      </div>
    </div>
  );
}
