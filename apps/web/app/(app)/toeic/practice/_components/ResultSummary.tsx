"use client";

import { Button, Card, Tag } from "antd";
import type { SessionAnswer, ToeicSessionQuestion } from "@/hooks/useToeicSession";

export function ResultSummary({
	score,
	answers,
	questions,
	onReset,
}: {
	score: { correct: number; total: number } | null;
	answers: SessionAnswer[];
	questions: ToeicSessionQuestion[];
	onReset: () => void;
}) {
	const correct = score?.correct ?? 0;
	const total = score?.total ?? questions.length;
	const wrong = answers.filter((a) => a.isCorrect === false);

	return (
		<div style={{ display: "grid", gap: 12, maxWidth: 720 }}>
			<Card>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
					<div>
						<div style={{ fontSize: 28, fontWeight: 700 }}>
							{correct} / {total}
						</div>
						<div style={{ color: "var(--text-muted, #94a3b8)" }}>
							{Math.round((correct / Math.max(1, total)) * 100)}% đúng
						</div>
					</div>
					<Button type="primary" onClick={onReset}>
						Luyện tiếp
					</Button>
				</div>
			</Card>
			{wrong.length > 0 && (
				<Card title={`${wrong.length} câu sai`} size="small">
					<div style={{ display: "grid", gap: 8 }}>
						{wrong.map((a) => {
							const q = questions.find((qq) => qq.id === a.questionId);
							if (!q) return null;
							return (
								<div
									key={a.questionId}
									style={{
										padding: 10,
										border: "1px solid var(--border-color, #1f2937)",
										borderRadius: 8,
									}}
								>
									<div style={{ fontSize: 13, color: "var(--text-muted, #94a3b8)" }}>
										<Tag>Part {q.part}</Tag>
										Câu {q.number}
									</div>
									{q.questionText && (
										<div style={{ marginTop: 6 }}>{q.questionText}</div>
									)}
									{q.explanationVi && (
										<div style={{ marginTop: 6, fontSize: 13 }}>
											<strong>Giải thích:</strong> {q.explanationVi}
										</div>
									)}
								</div>
							);
						})}
					</div>
				</Card>
			)}
		</div>
	);
}
