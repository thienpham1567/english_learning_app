"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
	EditOutlined,
	CheckSquareOutlined,
	SwapOutlined,
	SoundOutlined,
	LoadingOutlined,
} from "@ant-design/icons";
import * as m from "motion/react-client";

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
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				padding: 64,
				color: "var(--text-muted)",
				gap: 10,
				fontWeight: 700,
				fontSize: 14
			}}
		>
			<LoadingOutlined style={{ fontSize: 20, color: "var(--accent)" }} />
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
	{ value: "grammar", label: "Grammar Checker", desc: "Kiểm tra ngữ pháp", icon: <CheckSquareOutlined /> },
	{ value: "paraphrase", label: "Paraphraser", desc: "Viết lại câu", icon: <SwapOutlined /> },
	{ value: "tts", label: "Voice Generator", desc: "Đọc thành tiếng (Groq)", icon: <SoundOutlined /> },
];

const GRADIENTS: Record<ToolTab, string> = {
	grammar: "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
	paraphrase: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
	tts: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
};

export default function WritingToolsPage() {
	const [active, setActive] = useState<ToolTab>("grammar");

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				height: "100%",
				minHeight: 0,
				flex: 1,
				overflow: "auto",
			}}
		>
			
			{/* High-end Pill Tabs Row */}
			<div style={{
				padding: "16px 20px 8px",
				display: "flex",
				gap: 8,
				overflowX: "auto",
				flexShrink: 0,
				scrollbarWidth: "none"
			}}>
				<div style={{
					display: "flex",
					gap: 6,
					background: "var(--surface-alt)",
					border: "1.5px solid var(--border)",
					borderRadius: "var(--radius-xl)",
					padding: 6,
					width: "100%",
					minWidth: "max-content",
				}}>
					{TABS.map((t) => {
						const isActive = active === t.value;
						return (
							<m.button
								type="button"
								key={t.value}
								onClick={() => setActive(t.value)}
								whileTap={{ scale: 0.98 }}
								style={{
									flex: 1,
									padding: "8px 12px",
									borderRadius: "var(--radius-lg)",
									border: "none",
									background: isActive ? "var(--accent)" : "transparent",
									color: isActive ? "var(--text-on-accent)" : "var(--text-secondary)",
									cursor: "pointer",
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									justifyContent: "center",
									gap: 2,
									transition: "color 0.2s, background 0.2s",
								}}
							>
								<div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 900 }}>
									{t.icon}
									<span>{t.label}</span>
								</div>
								<span style={{
									opacity: isActive ? 0.9 : 0.65,
									fontSize: 10,
									fontWeight: 700
								}}>
									{t.desc}
								</span>
							</m.button>
						);
					})}
				</div>
			</div>

			<div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "12px 20px 40px" }} className="anim-fade-up">
				<div style={{ maxWidth: 800, margin: "0 auto", width: "100%" }}>
					{active === "grammar" && <GrammarChecker />}
					{active === "paraphrase" && <Paraphraser />}
					{active === "tts" && <TtsReader />}
				</div>
			</div>
		</div>
	);
}
