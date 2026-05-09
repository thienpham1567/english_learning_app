"use client";

import { useEffect, useState } from "react";
import { Button, Card, Segmented } from "antd";
import { api } from "@/lib/api-client";

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
		<Card title="Cấu hình luyện đề">
			<div style={{ display: "grid", gap: 16 }}>
				<div>
					<div style={{ marginBottom: 6, fontWeight: 600 }}>Đề</div>
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
				<div>
					<div style={{ marginBottom: 6, fontWeight: 600 }}>Part</div>
					<Segmented
						block
						options={PARTS}
						value={selectedPart}
						onChange={(v) => setSelectedPart(v as string)}
					/>
				</div>
				<div>
					<div style={{ marginBottom: 6, fontWeight: 600 }}>Số câu</div>
					<Segmented
						options={COUNTS.map((c) => ({ value: c, label: String(c) }))}
						value={count}
						onChange={(v) => setCount(v as number)}
					/>
				</div>
				<Button
					type="primary"
					size="large"
					onClick={() =>
						onStart({
							mode: "practice",
							examCode: selectedExam === "random" ? undefined : selectedExam,
							part: parsePart(selectedPart),
							count,
						})
					}
				>
					Bắt đầu
				</Button>
			</div>
		</Card>
	);
}
