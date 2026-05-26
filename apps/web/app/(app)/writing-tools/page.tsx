"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

import * as m from "motion/react-client";
import {
  ArrowLeftRight,
  CheckSquare,
  Loader2,
  Pencil,
  Volume2,
} from "lucide-react";

const GrammarChecker = dynamic(
	() =>
		import("./_components/GrammarChecker").then(
			(m) => m.GrammarChecker,
		),
	{ ssr: false, loading: () => <Loader label="Đang tải trình kiểm tra lỗi..." /> },
);
const Paraphraser = dynamic(
	() =>
		import("./_components/Paraphraser").then(
			(m) => m.Paraphraser,
		),
	{ ssr: false, loading: () => <Loader label="Đang tải trình viết lại câu..." /> },
);
const TtsReader = dynamic(
	() =>
		import("./_components/TtsReader").then(
			(m) => m.TtsReader,
		),
	{ ssr: false, loading: () => <Loader label="Đang tải trình đọc văn bản..." /> },
);

function Loader({ label }: { label: string }) {
	return (
		<div className="flex justify-center items-center text-text-muted gap-2.5 font-bold text-sm" style={{padding: 64}} >
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
}[] = [
	{ value: "grammar", label: "Grammar Checker", desc: "Kiểm tra ngữ pháp", icon: <CheckSquare /> },
	{ value: "paraphrase", label: "Paraphraser", desc: "Viết lại câu", icon: <ArrowLeftRight /> },
	{ value: "tts", label: "Voice Generator", desc: "Đọc thành tiếng (Groq)", icon: <Volume2 /> },
];

const GRADIENTS: Record<ToolTab, string> = {
	grammar: "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
	paraphrase: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
	tts: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
};

export default function WritingToolsPage() {
	const [active, setActive] = useState<ToolTab>("grammar");

	return (
		<div className="flex flex-col h-full h-[0px] flex-1 overflow-auto" >
			
			{/* High-end Pill Tabs Row */}
			<div className="flex gap-2 shrink-0" style={{padding: "16px 20px 8px", overflowX: "auto", scrollbarWidth: "none"}} >
				<div className="flex gap-1.5 bg-surface-alt rounded-(--radius-xl) w-full" style={{border: "1.5px solid var(--border)", padding: 6, minWidth: "max-content"}} >
					{TABS.map((t) => {
						const isActive = active === t.value;
						return (
							<m.button
								type="button"
								key={t.value}
								onClick={() => setActive(t.value)}
								whileTap={{ scale: 0.98 }} className="flex-1 py-2 px-3 rounded-(--radius-lg) border-none cursor-pointer flex flex-col items-center justify-center" style={{background: isActive ? "var(--accent)" : "transparent", color: isActive ? "var(--text-on-accent)" : "var(--text-secondary)", gap: 2, transition: "color 0.2s, background 0.2s"}} >
								<div className="flex items-center gap-1.5 font-black" style={{fontSize: 13.5}} >
									{t.icon}
									<span>{t.label}</span>
								</div>
								<span className="text-[10px] font-bold" style={{opacity: isActive ? 0.9 : 0.65}} >
									{t.desc}
								</span>
							</m.button>
						);
					})}
				</div>
			</div>

			<div className="anim-fade-up flex-1 h-[0px] overflow-auto" style={{padding: "12px 20px 40px"}} >
				<div className="w-[800px] mx-auto w-full" >
					{active === "grammar" && <GrammarChecker />}
					{active === "paraphrase" && <Paraphraser />}
					{active === "tts" && <TtsReader />}
				</div>
			</div>
		</div>
	);
}
