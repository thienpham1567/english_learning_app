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
		<div className="anim-fade-up grid gap-5 w-[720px] w-full mx-auto">
			{/* Score Summary Card */}
			<div className="bg-(--surface) rounded-(--radius-xl) p-6 flex justify-between items-center gap-4" style={{border: "1.5px solid var(--border)", boxShadow: "var(--shadow-md)"}} >
				<div>
					<div className="flex items-baseline gap-1.5" >
						<span className="text-4xl text-text-primary font-display" style={{fontWeight: 950}} >
							{correct}
						</span>
						<span className="text-base text-text-muted font-bold" >
							/ {total} câu đúng
						</span>
					</div>
					<div className="items-center gap-1.5 mt-1.5 font-extrabold" style={{display: "inline-flex", padding: "2px 10px", borderRadius: 20, background: percentage >= 70 ? "rgba(16, 185, 129, 0.08)" : "rgba(245, 158, 11, 0.08)", color: percentage >= 70 ? "var(--success)" : "var(--warning)", fontSize: 12.5, border: `1px solid ${percentage >= 70 ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)"}`}} >
						{percentage >= 70 ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
						<span>Tỉ lệ chính xác: {percentage}%</span>
					</div>
				</div>
				
				<m.button
					onClick={onReset}
					whileHover={{ scale: 1.03 }}
					whileTap={{ scale: 0.97 }} className="border-none rounded-(--radius-lg) cursor-pointer items-center gap-1.5" style={{padding: "10px 20px", background: "var(--accent)", color: "var(--text-on-accent)", fontSize: 13.5, fontWeight: 850, display: "inline-flex", boxShadow: "0 4px 12px var(--accent-muted)"}} >
					<RefreshCw />
					<span>Luyện đề tiếp</span>
				</m.button>
			</div>

			{/* Wrong answers detail panel */}
			{wrong.length > 0 ? (
				<div className="flex flex-col gap-3" >
					<div className="flex items-center gap-2" style={{paddingLeft: 4}} >
						<XCircle className="text-destructive text-base" />
						<h4 className="m-0 font-black text-text-primary" style={{fontSize: 14.5}} >
							Chi tiết {wrong.length} câu đã trả lời sai
						</h4>
					</div>

					<div className="grid gap-3" >
						{wrong.map((a) => {
							const q = questions.find((qq) => qq.id === a.questionId);
							if (!q) return null;
							return (
								<div
									key={a.questionId} className="p-4 bg-(--surface) rounded-(--radius-xl)" style={{border: "1.5px solid var(--border)", boxShadow: "var(--shadow-sm)"}} >
									<div className="flex justify-between items-center mb-2.5" >
										<span className="text-[13px] font-extrabold text-text-primary" >
											Câu hỏi số {q.number}
										</span>
										<span className="text-[10px] font-black rounded-md bg-surface-alt text-text-secondary border border-(--border)" style={{padding: "2px 8px"}} >
											Part {q.part}
										</span>
									</div>
									
									{q.questionText && (
										<p className="mb-3 text-sm font-bold text-text-primary leading-normal" >
											{q.questionText}
										</p>
									)}

									{/* Choices summary */}
									<div className="flex flex-col gap-1.5 mb-3" >
										{q.options.map((opt, oIdx) => {
											const isCorrect = q.correctIndex === oIdx;
											const isUserPick = a.selectedIndex === oIdx;
											if (!isCorrect && !isUserPick) return null;

											return (
												<div
													key={oIdx} className="flex items-center gap-2 py-1.5 px-3 font-bold" style={{fontSize: 12.5, borderRadius: "var(--radius-md)", background: isCorrect ? "rgba(16, 185, 129, 0.06)" : "rgba(239, 68, 68, 0.06)", color: isCorrect ? "var(--success)" : "var(--error)", border: `1px solid ${isCorrect ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)"}`}} >
													<span style={{ opacity: 0.8 }}>{String.fromCharCode(65 + oIdx)}.</span>
													<span className="flex-1" >{opt}</span>
													<span>{isCorrect ? "Đáp án đúng" : "Lựa chọn của bạn"}</span>
												</div>
											);
										})}
									</div>
									
									{q.explanationVi && (
										<div className="bg-surface-alt border border-(--border) text-text-secondary font-medium" style={{padding: "10px 12px", borderRadius: "var(--radius-md)", fontSize: 12.5, lineHeight: 1.55}} >
											<div className="flex items-center gap-1 font-extrabold text-text-primary mb-1" >
												<Lightbulb style={{ color: "var(--warning)" }} />
												<span>Giải thích:</span>
											</div>
											<p className="m-0" >{q.explanationVi}</p>
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>
			) : (
				<div className="text-center rounded-(--radius-xl) text-emerald-500" style={{padding: "32px 20px", background: "rgba(16, 185, 129, 0.06)", border: "1.5px dashed var(--success)"}} >
					<CheckCircle className="text-4xl mb-3" />
					<p className="m-0 font-extrabold" style={{fontSize: 14.5}} >Xuất sắc! Bạn không trả lời sai câu nào trong lượt này.</p>
				</div>
			)}
		</div>
	);
}
