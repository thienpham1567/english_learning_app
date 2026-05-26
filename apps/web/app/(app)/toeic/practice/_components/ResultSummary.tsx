"use client";

import { Tag } from "antd";
import type { SessionAnswer, ToeicSessionQuestion } from "@/hooks/useToeicSession";

import * as m from "motion/react-client";
import {
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  RefreshCw,
  XCircle,
} from "lucide-react";

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
	const percentage = Math.round((correct / Math.max(1, total)) * 100);

	return (
		<div style={{ display: "grid", gap: 20, maxWidth: 720, width: "100%", margin: "0 auto" }} className="anim-fade-up">
			{/* Score Summary Card */}
			<div style={{
				background: "var(--surface)",
				border: "1.5px solid var(--border)",
				borderRadius: "var(--radius-xl)",
				padding: 24,
				boxShadow: "var(--shadow-md)",
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
				gap: 16
			}}>
				<div>
					<div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
						<span style={{ fontSize: 32, fontWeight: 950, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
							{correct}
						</span>
						<span style={{ fontSize: 16, color: "var(--text-muted)", fontWeight: 700 }}>
							/ {total} câu đúng
						</span>
					</div>
					<div style={{
						display: "inline-flex",
						alignItems: "center",
						gap: 6,
						marginTop: 6,
						padding: "2px 10px",
						borderRadius: 20,
						background: percentage >= 70 ? "rgba(16, 185, 129, 0.08)" : "rgba(245, 158, 11, 0.08)",
						color: percentage >= 70 ? "var(--success)" : "var(--warning)",
						fontSize: 12.5,
						fontWeight: 800,
						border: `1px solid ${percentage >= 70 ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)"}`
					}}>
						{percentage >= 70 ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
						<span>Tỉ lệ chính xác: {percentage}%</span>
					</div>
				</div>
				
				<m.button
					onClick={onReset}
					whileHover={{ scale: 1.03 }}
					whileTap={{ scale: 0.97 }}
					style={{
						padding: "10px 20px",
						background: "var(--accent)",
						color: "var(--text-on-accent)",
						border: "none",
						borderRadius: "var(--radius-lg)",
						fontSize: 13.5,
						fontWeight: 850,
						cursor: "pointer",
						display: "inline-flex",
						alignItems: "center",
						gap: 6,
						boxShadow: "0 4px 12px var(--accent-muted)"
					}}
				>
					<RefreshCw />
					<span>Luyện đề tiếp</span>
				</m.button>
			</div>

			{/* Wrong answers detail panel */}
			{wrong.length > 0 ? (
				<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
					<div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 4 }}>
						<XCircle style={{ color: "var(--error)", fontSize: 16 }} />
						<h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 900, color: "var(--text-primary)" }}>
							Chi tiết {wrong.length} câu đã trả lời sai
						</h4>
					</div>

					<div style={{ display: "grid", gap: 12 }}>
						{wrong.map((a) => {
							const q = questions.find((qq) => qq.id === a.questionId);
							if (!q) return null;
							return (
								<div
									key={a.questionId}
									style={{
										padding: 16,
										background: "var(--surface)",
										border: "1.5px solid var(--border)",
										borderRadius: "var(--radius-xl)",
										boxShadow: "var(--shadow-sm)"
									}}
								>
									<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
										<span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>
											Câu hỏi số {q.number}
										</span>
										<span style={{
											fontSize: 10,
											fontWeight: 900,
											padding: "2px 8px",
											borderRadius: 6,
											background: "var(--surface-alt)",
											color: "var(--text-secondary)",
											border: "1px solid var(--border)"
										}}>
											Part {q.part}
										</span>
									</div>
									
									{q.questionText && (
										<p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.5 }}>
											{q.questionText}
										</p>
									)}

									{/* Choices summary */}
									<div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
										{q.options.map((opt, oIdx) => {
											const isCorrect = q.correctIndex === oIdx;
											const isUserPick = a.selectedIndex === oIdx;
											if (!isCorrect && !isUserPick) return null;

											return (
												<div
													key={oIdx}
													style={{
														display: "flex",
														alignItems: "center",
														gap: 8,
														fontSize: 12.5,
														padding: "6px 12px",
														borderRadius: "var(--radius-md)",
														background: isCorrect ? "rgba(16, 185, 129, 0.06)" : "rgba(239, 68, 68, 0.06)",
														color: isCorrect ? "var(--success)" : "var(--error)",
														border: `1px solid ${isCorrect ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)"}`,
														fontWeight: 700
													}}
												>
													<span style={{ opacity: 0.8 }}>{String.fromCharCode(65 + oIdx)}.</span>
													<span style={{ flex: 1 }}>{opt}</span>
													<span>{isCorrect ? "Đáp án đúng" : "Lựa chọn của bạn"}</span>
												</div>
											);
										})}
									</div>
									
									{q.explanationVi && (
										<div style={{
											padding: "10px 12px",
											borderRadius: "var(--radius-md)",
											background: "var(--surface-alt)",
											border: "1px solid var(--border)",
											fontSize: 12.5,
											color: "var(--text-secondary)",
											lineHeight: 1.55,
											fontWeight: 500
										}}>
											<div style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>
												<Lightbulb style={{ color: "var(--warning)" }} />
												<span>Giải thích:</span>
											</div>
											<p style={{ margin: 0 }}>{q.explanationVi}</p>
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>
			) : (
				<div style={{
					padding: "32px 20px",
					textAlign: "center",
					background: "rgba(16, 185, 129, 0.06)",
					border: "1.5px dashed var(--success)",
					borderRadius: "var(--radius-xl)",
					color: "var(--success)"
				}}>
					<CheckCircle style={{ fontSize: 32, marginBottom: 12 }} />
					<p style={{ margin: 0, fontSize: 14.5, fontWeight: 800 }}>Xuất sắc! Bạn không trả lời sai câu nào trong lượt này.</p>
				</div>
			)}
		</div>
	);
}
