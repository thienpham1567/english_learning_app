"use client";

import { ArrowLeftRight, CheckSquare, Loader2, Volume2 } from "lucide-react";
import * as m from "motion/react-client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Card } from "@/components/ui/card";

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
  shortLabel: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "grammar",
    label: "Grammar Checker",
    shortLabel: "Grammar",
    icon: <CheckSquare size={16} />,
  },
  {
    value: "paraphrase",
    label: "Paraphraser",
    shortLabel: "Paraphrase",
    icon: <ArrowLeftRight size={16} />,
  },
  { value: "tts", label: "Voice Generator", shortLabel: "Voice", icon: <Volume2 size={16} /> },
];

export default function WritingToolsPage() {
  const [active, setActive] = useState<ToolTab>("grammar");

  return (
    <div className="flex flex-col h-full flex-1 overflow-hidden">
      {/* ── Tab Switcher ── */}
      <div className="shrink-0 px-4 pt-4 pb-2 max-w-4xl w-full mx-auto">
        <Card
          shadowSize="sm"
          size="sm"
          className="flex flex-row gap-1 p-1.5 overflow-x-auto scrollbar-none"
        >
          {TABS.map((t) => {
            const isActive = active === t.value;
            return (
              <m.button
                type="button"
                key={t.value}
                onClick={() => setActive(t.value)}
                whileTap={{ scale: 0.97 }}
                className={`flex-1 py-2.5 px-4 rounded-lg cursor-pointer flex items-center justify-center gap-2 text-[13px] font-black transition-all duration-100 min-w-max border-2 ${
                  isActive
                    ? "bg-accent text-text-on-accent border-border shadow-sm"
                    : "bg-transparent text-text-secondary border-transparent hover:text-text-primary hover:bg-surface-hover"
                }`}
              >
                {t.icon}
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.shortLabel}</span>
              </m.button>
            );
          })}
        </Card>
      </div>

      {/* ── Active Tool ── */}
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
