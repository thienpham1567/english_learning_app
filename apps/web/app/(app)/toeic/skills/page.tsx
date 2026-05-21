"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
	CustomerServiceOutlined,
	ReadOutlined,
	AudioOutlined,
	FormOutlined,
	LoadingOutlined,
} from "@ant-design/icons";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import * as m from "motion/react-client";

const ListeningTab = dynamic(
	() =>
		import("@/app/(app)/toeic-skills/_components/ListeningTab").then(
			(m) => m.ListeningTab,
		),
	{ ssr: false, loading: () => <TabLoader /> },
);
const ReadingTab = dynamic(
	() =>
		import("@/app/(app)/toeic-skills/_components/ReadingTab").then(
			(m) => m.ReadingTab,
		),
	{ ssr: false, loading: () => <TabLoader /> },
);
const SpeakingTab = dynamic(
	() =>
		import("@/app/(app)/toeic-skills/_components/SpeakingTab").then(
			(m) => m.SpeakingTab,
		),
	{ ssr: false, loading: () => <TabLoader /> },
);
const WritingTab = dynamic(
	() =>
		import("@/app/(app)/toeic-skills/_components/WritingTab").then(
			(m) => m.WritingTab,
		),
	{ ssr: false, loading: () => <TabLoader /> },
);

function TabLoader() {
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
			<span>Đang tải nội dung học...</span>
		</div>
	);
}

type Skill = "listening" | "reading" | "speaking" | "writing";

const SKILL_TABS: {
	value: Skill;
	label: string;
	parts: string;
	icon: React.ReactNode;
}[] = [
	{ value: "listening", label: "Listening", parts: "Part 1–4", icon: <CustomerServiceOutlined /> },
	{ value: "reading", label: "Reading", parts: "Part 5–7", icon: <ReadOutlined /> },
	{ value: "speaking", label: "Speaking", parts: "Part 1–6", icon: <AudioOutlined /> },
	{ value: "writing", label: "Writing", parts: "Part 1–3", icon: <FormOutlined /> },
];

const SUBTITLES: Record<Skill, string> = {
	listening: "TOEIC Listening · Part 1–4 · Nghe hiểu",
	reading: "TOEIC Reading · Part 5–7 · Đọc hiểu",
	speaking: "TOEIC Speaking · 11 câu · Nói",
	writing: "TOEIC Writing · 8 câu · Viết",
};

const GRADIENTS: Record<Skill, string> = {
	listening: "var(--gradient-listening)",
	reading: "var(--gradient-reading)",
	speaking: "var(--gradient-toeic-speaking)",
	writing: "var(--gradient-writing)",
};

const TAB_COLORS: Record<Skill, { border: string; bg: string; activeColor: string }> = {
	listening: { border: "var(--border)", bg: "var(--surface)", activeColor: "var(--module-listening)" },
	reading: { border: "var(--border)", bg: "var(--surface)", activeColor: "var(--module-reading)" },
	speaking: { border: "var(--border)", bg: "var(--surface)", activeColor: "var(--accent)" },
	writing: { border: "var(--border)", bg: "var(--surface)", activeColor: "var(--xp)" },
};

export default function ToeicSkillsPage() {
	const [active, setActive] = useState<Skill>("listening");

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
			<ModuleHeader
				icon={SKILL_TABS.find((t) => t.value === active)?.icon}
				gradient={GRADIENTS[active]}
				title="TOEIC Skills"
				subtitle={SUBTITLES[active]}
			/>
			
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
					width: "100%"
				}}>
					{SKILL_TABS.map((t) => {
						const isActive = active === t.value;
						const colors = TAB_COLORS[t.value];
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
									background: isActive ? colors.activeColor : "transparent",
									color: isActive ? "var(--text-on-accent)" : "var(--text-secondary)",
									cursor: "pointer",
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									justifyContent: "center",
									gap: 3,
									transition: "color 0.2s, background 0.2s",
								}}
							>
								<div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 900 }}>
									{t.icon}
									<span>{t.label}</span>
								</div>
								<span style={{
									opacity: isActive ? 0.9 : 0.65,
									fontSize: 10.5,
									fontWeight: 700
								}}>
									{t.parts}
								</span>
							</m.button>
						);
					})}
				</div>
			</div>

			<div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "12px 20px 40px" }} className="anim-fade-up">
				{active === "listening" && <ListeningTab />}
				{active === "reading" && <ReadingTab />}
				{active === "speaking" && <SpeakingTab />}
				{active === "writing" && <WritingTab />}
			</div>
		</div>
	);
}
