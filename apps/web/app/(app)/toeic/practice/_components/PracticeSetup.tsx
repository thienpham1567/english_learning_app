"use client";

import { useEffect, useState } from "react";
import { Segmented } from "antd";
import { api } from "@/lib/api-client";
import { SettingOutlined, CompassOutlined, NumberOutlined, ThunderboltOutlined, TrophyOutlined } from "@ant-design/icons";
import * as m from "motion/react-client";

const PARTS: Array<{ value: string; label: string }> = [
	{ value: "all", label: "Tất cả" },
	{ value: "listening", label: "🎧 Listening" },
	{ value: "reading", label: "📖 Reading" },
	{ value: "3", label: "Part 3" },
	{ value: "4", label: "Part 4" },
	{ value: "5", label: "Part 5" },
	{ value: "6", label: "Part 6" },
	{ value: "7", label: "Part 7" },
];

function parsePart(v: string): number | "listening" | "reading" | "all" {
	if (v === "all" || v === "listening" || v === "reading") return v;
	const n = parseInt(v, 10);
	return Number.isFinite(n) ? n : "all";
}

const COUNTS = [10, 15, 20, 30];

export type PracticeStartParams = {
	mode: "practice";
	examCode?: string;
	part?: number | "listening" | "reading" | "all";
	count: number;
};

type ExamRow = { code: string; title: string; year: number | null };

export function PracticeSetup({
	onStart,
}: {
	onStart: (params: PracticeStartParams) => void;
}) {
	const [exams, setExams] = useState<ExamRow[]>([]);
	const [selectedExam, setSelectedExam] = useState<string>("random");
	const [selectedPart, setSelectedPart] = useState<string>("all");
	const [count, setCount] = useState(10);

	useEffect(() => {
		void api
			.get<{ exams: ExamRow[] }>("/toeic-practice/exams")
			.then((res) => setExams(res.exams.filter((e) => e.code !== "diagnostic_v1")))
			.catch(() => setExams([]));
	}, []);

	return (
		<div style={{
			background: "var(--surface)",
			border: "1.5px solid var(--border)",
			borderRadius: "var(--radius-xl)",
			padding: 24,
			boxShadow: "var(--shadow-md)",
			maxWidth: 580,
			width: "100%",
			margin: "24px auto"
		}} className="anim-fade-up">
			{/* Setup header */}
			<div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "1.5px dashed var(--border)", paddingBottom: 16, marginBottom: 20 }}>
				<div style={{
					width: 38,
					height: 38,
					borderRadius: 12,
					background: "var(--accent-light)",
					color: "var(--accent)",
					display: "grid",
					placeItems: "center",
					fontSize: 18
				}}>
					<SettingOutlined />
				</div>
				<div>
					<h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
						Cấu hình luyện đề
					</h3>
					<span style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 700 }}>
						Tùy chỉnh đề thi, phần thi và độ dài buổi luyện
					</span>
				</div>
			</div>

			<style>{`
				.premium-segmented .ant-segmented {
					background: var(--surface-alt) !important;
					border: 1px solid var(--border) !important;
					padding: 4px !important;
					border-radius: var(--radius-lg) !important;
				}
				.premium-segmented .ant-segmented-item {
					border-radius: var(--radius-md) !important;
					color: var(--text-secondary) !important;
					font-weight: 700 !important;
					transition: all 0.2s !important;
				}
				.premium-segmented .ant-segmented-item-selected {
					background: var(--accent) !important;
					color: var(--text-on-accent) !important;
					box-shadow: var(--shadow-sm) !important;
				}
			`}</style>

			<div style={{ display: "grid", gap: 20 }} className="premium-segmented">
				{/* Exam select */}
				<div>
					<div style={{ marginBottom: 8, fontWeight: 800, fontSize: 13, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
						<TrophyOutlined style={{ color: "var(--accent)" }} />
						<span>Đề thi TOEIC</span>
					</div>
					<Segmented
						block
						options={[
							{ value: "random", label: "🎲 Ngẫu nhiên" },
							...exams.map((e) => ({ value: e.code, label: e.title })),
						]}
						value={selectedExam}
						onChange={(v) => setSelectedExam(v as string)}
					/>
				</div>

				{/* Part select */}
				<div>
					<div style={{ marginBottom: 8, fontWeight: 800, fontSize: 13, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
						<CompassOutlined style={{ color: "var(--accent)" }} />
						<span>Phần thi (Part)</span>
					</div>
					<Segmented
						block
						options={PARTS}
						value={selectedPart}
						onChange={(v) => setSelectedPart(v as string)}
					/>
				</div>

				{/* Question count */}
				<div>
					<div style={{ marginBottom: 8, fontWeight: 800, fontSize: 13, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
						<NumberOutlined style={{ color: "var(--accent)" }} />
						<span>Số lượng câu hỏi</span>
					</div>
					<Segmented
						options={COUNTS.map((c) => ({ value: c, label: `${c} câu` }))}
						value={count}
						onChange={(v) => setCount(v as number)}
					/>
				</div>

				<m.div
					whileHover={{ scale: 1.015 }}
					whileTap={{ scale: 0.985 }}
					style={{ marginTop: 8 }}
				>
					<button
						type="button"
						onClick={() =>
							onStart({
								mode: "practice",
								examCode: selectedExam === "random" ? undefined : selectedExam,
								part: parsePart(selectedPart),
								count,
							})
						}
						style={{
							width: "100%",
							padding: "14px",
							background: "var(--accent)",
							color: "var(--text-on-accent)",
							fontSize: 14.5,
							fontWeight: 900,
							border: "none",
							borderRadius: "var(--radius-xl)",
							cursor: "pointer",
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							gap: 8,
							boxShadow: "0 4px 14px var(--accent-muted)"
						}}
					>
						<ThunderboltOutlined />
						<span>Bắt đầu luyện tập ngay</span>
					</button>
				</m.div>
			</div>
		</div>
	);
}
