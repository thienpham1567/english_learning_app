"use client";

import { useRouter } from "next/navigation";
import { Card, Progress, Tag, Button } from "antd";
import { ThunderboltOutlined, AlertOutlined, CalendarOutlined } from "@ant-design/icons";
import { getSkillLabel, type ToeicSkill } from "@repo/contracts";

type SkillRow = { skill: string; proficiency: number; pool: number };

export function GrammarHub({
	skills,
	mistakeCount,
}: {
	skills: SkillRow[];
	mistakeCount: number;
}) {
	const router = useRouter();

	const sorted = [...skills].sort((a, b) => a.proficiency - b.proficiency);
	const weakest3 = sorted.slice(0, 3);

	const startDrill = (skill: string) => {
		router.push(`/toeic/grammar/drill?skill=${encodeURIComponent(skill)}&count=20`);
	};
	const startMistake = () => {
		router.push("/toeic/grammar/drill?mode=mistake&count=20");
	};
	const startDaily = () => {
		const weakest = weakest3[0]?.skill;
		if (weakest) router.push(`/toeic/grammar/drill?skill=${encodeURIComponent(weakest)}&count=15`);
	};

	const profColor = (p: number) =>
		p < 0.3 ? "var(--error)" : p < 0.7 ? "var(--warning)" : "var(--success)";

	return (
		<div style={{ display: "grid", gap: 16 }}>
			{/* 3 quick-start cards */}
			<div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
				<Card size="small" hoverable onClick={startDaily}>
					<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
						<CalendarOutlined style={{ fontSize: 20, color: "var(--info)" }} />
						<strong>Daily 15 câu</strong>
					</div>
					<div style={{ color: "var(--text-muted, #94a3b8)", fontSize: 13, marginTop: 6 }}>
						Tập trung vào kỹ năng yếu nhất
					</div>
					{weakest3[0] && (
						<Tag style={{ marginTop: 8 }}>{getSkillLabel(weakest3[0].skill as ToeicSkill)}</Tag>
					)}
				</Card>
				<Card
					size="small"
					hoverable={mistakeCount > 0}
					onClick={mistakeCount > 0 ? startMistake : undefined}
					style={mistakeCount === 0 ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
				>
					<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
						<AlertOutlined style={{ fontSize: 20, color: "var(--error)" }} />
						<strong>Câu sai cần ôn</strong>
					</div>
					<div style={{ fontSize: 28, fontWeight: 700, marginTop: 6 }}>{mistakeCount}</div>
					<div style={{ color: "var(--text-muted, #94a3b8)", fontSize: 13 }}>
						Spaced repetition cho câu sai
					</div>
				</Card>
				<Card size="small">
					<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
						<ThunderboltOutlined style={{ fontSize: 20, color: "var(--warning)" }} />
						<strong>Top 3 yếu nhất</strong>
					</div>
					<div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
						{weakest3.map((s) => (
							<button
								type="button"
								key={s.skill}
								onClick={() => startDrill(s.skill)}
								style={{
									padding: "4px 8px",
									borderRadius: 6,
									border: "1px solid var(--border-color, #1f2937)",
									background: "transparent",
									color: "var(--text-primary, #fff)",
									textAlign: "left",
									fontSize: 13,
									cursor: "pointer",
								}}
							>
								{getSkillLabel(s.skill as ToeicSkill)} · {Math.round(s.proficiency * 100)}/100
							</button>
						))}
					</div>
				</Card>
			</div>

			{/* Skill matrix */}
			<Card title="Tất cả kỹ năng Part 5 & 6" size="small">
				<div style={{ display: "grid", gap: 10 }}>
					{skills.map((s) => (
						<div
							key={s.skill}
							style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, alignItems: "center" }}
						>
							<div>
								<div style={{ fontWeight: 500 }}>{getSkillLabel(s.skill as ToeicSkill)}</div>
								<Progress
									percent={Math.round(s.proficiency * 100)}
									showInfo={false}
									strokeColor={profColor(s.proficiency)}
									size="small"
								/>
							</div>
							<div style={{ fontSize: 12, color: "var(--text-muted, #94a3b8)" }}>{s.pool} câu</div>
							<Button size="small" onClick={() => startDrill(s.skill)}>
								Drill
							</Button>
						</div>
					))}
				</div>
			</Card>
		</div>
	);
}
