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
			}}
		>
			<LoadingOutlined style={{ fontSize: 24, marginRight: 8 }} /> Đang tải...
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

const TAB_COLORS: Record<Skill, { border: string; bg: string }> = {
	listening: { border: "var(--secondary)", bg: "color-mix(in srgb, var(--secondary) 10%, var(--surface))" },
	reading: { border: "var(--xp)", bg: "color-mix(in srgb, var(--xp) 10%, var(--surface))" },
	speaking: { border: "var(--accent)", bg: "color-mix(in srgb, var(--accent) 10%, var(--surface))" },
	writing: { border: "var(--accent)", bg: "color-mix(in srgb, var(--accent) 10%, var(--surface))" },
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
			<div style={{ padding: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
				{SKILL_TABS.map((t) => {
					const isActive = active === t.value;
					const colors = TAB_COLORS[t.value];
					return (
						<button
							type="button"
							key={t.value}
							onClick={() => setActive(t.value)}
							style={{
								padding: "8px 14px",
								borderRadius: 10,
								border: `1px solid ${isActive ? colors.border : "var(--border)"}`,
								background: isActive ? colors.bg : "var(--surface)",
								color: isActive ? "var(--ink)" : "var(--text-secondary)",
								cursor: "pointer",
								display: "flex",
								alignItems: "center",
								gap: 6,
								transition: "all var(--duration-fast) ease",
							}}
						>
							{t.icon}
							<span>{t.label}</span>
							<span style={{ color: "var(--text-muted)", fontSize: 12 }}>· {t.parts}</span>
						</button>
					);
				})}
			</div>
			<div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
				{active === "listening" && <ListeningTab />}
				{active === "reading" && <ReadingTab />}
				{active === "speaking" && <SpeakingTab />}
				{active === "writing" && <WritingTab />}
			</div>
		</div>
	);
}
