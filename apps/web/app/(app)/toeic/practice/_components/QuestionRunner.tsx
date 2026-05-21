"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Tag } from "antd";
import { CheckCircleFilled, CloseCircleFilled, SoundOutlined, PlayCircleOutlined, FlagFilled, FlagOutlined, LoadingOutlined } from "@ant-design/icons";
import type { ToeicSessionQuestion } from "@/hooks/useToeicSession";
import * as m from "motion/react-client";

export type QuestionRunnerProps = {
	question: ToeicSessionQuestion | null;
	currentIndex: number;
	total: number;
	/** When true, hides explanation/correct answer until completion (mock + diagnostic). */
	hideExplanation?: boolean;
	/** Optional countdown timer in ms; shows time-up warning when reached. */
	timeLimit?: number;
	startedAt?: number | null;
	/** Pass attempt ID to enable flag persistence + bookmark feature. */
	attemptId?: string;
	/** Initial flag state (when resuming). */
	initialFlagged?: boolean;
	onAnswer: (selectedIndex: number | null) => void | Promise<void>;
	onNext: () => void;
	onComplete: () => void | Promise<unknown>;
};

export function QuestionRunner({
	question,
	currentIndex,
	total,
	hideExplanation = false,
	timeLimit,
	startedAt,
	attemptId,
	initialFlagged,
	onAnswer,
	onNext,
	onComplete,
}: QuestionRunnerProps) {
	const [selected, setSelected] = useState<number | null>(null);
	const [revealed, setRevealed] = useState(false);
	const [elapsed, setElapsed] = useState(0);
	const [part2PlayingIdx, setPart2PlayingIdx] = useState(-1); // -1 idle, 0=Q, 1=A, 2=B, 3=C, 4=done
	const [isFlagged, setIsFlagged] = useState<boolean>(initialFlagged ?? false);
	const audioRef = useRef<HTMLAudioElement>(null);

	useEffect(() => {
		setSelected(null);
		setRevealed(false);
		setPart2PlayingIdx(-1);
		setIsFlagged(false);
	}, [question?.id]);

	const toggleFlag = useCallback(async () => {
		if (!question || !attemptId) return;
		const next = !isFlagged;
		setIsFlagged(next);
		void fetch("/api/toeic-practice/answer", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				attemptId,
				questionId: question.id,
				selectedIndex: null,
				durationMs: 0,
				flagged: next,
			}),
		});
	}, [attemptId, isFlagged, question]);

	const playPart2Sequence = useCallback(async () => {
		if (!question?.audioSegments) return;
		const segments = question.audioSegments;
		const urls = [segments.question, ...segments.options].filter((u) => u && u.length > 0);
		const audio = audioRef.current;
		if (!audio) return;
		for (let i = 0; i < urls.length; i++) {
			setPart2PlayingIdx(i);
			audio.src = urls[i];
			audio.currentTime = 0;
			try {
				await audio.play();
				await new Promise<void>((resolve) => {
					const onEnd = () => {
						audio.removeEventListener("ended", onEnd);
						resolve();
					};
					audio.addEventListener("ended", onEnd);
				});
				if (i < urls.length - 1) await new Promise((r) => setTimeout(r, 800));
			} catch {
				break;
			}
		}
		setPart2PlayingIdx(4);
	}, [question?.audioSegments]);

	useEffect(() => {
		if (question?.audioSegments && part2PlayingIdx === -1) {
			void playPart2Sequence();
		}
	}, [question?.id, question?.audioSegments, part2PlayingIdx, playPart2Sequence]);

	useEffect(() => {
		if (!startedAt || !timeLimit) return;
		const tick = () => setElapsed(Date.now() - startedAt);
		tick();
		const i = setInterval(tick, 1000);
		return () => clearInterval(i);
	}, [startedAt, timeLimit]);

	useEffect(() => {
		if (timeLimit && startedAt && elapsed >= timeLimit) {
			void onComplete();
		}
	}, [elapsed, timeLimit, startedAt, onComplete]);

	useEffect(() => {
		if (!question) return;
		const onKey = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement | null;
			if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
			const k = e.key.toLowerCase();
			let optIdx = -1;
			if (k === "1" || k === "a") optIdx = 0;
			else if (k === "2" || k === "b") optIdx = 1;
			else if (k === "3" || k === "c") optIdx = 2;
			else if (k === "4" || k === "d") optIdx = 3;

			if (optIdx >= 0 && optIdx < question.options.length && !(revealed && !hideExplanation)) {
				e.preventDefault();
				setSelected(optIdx);
				if (!hideExplanation) setRevealed(true);
				void onAnswer(optIdx);
				return;
			}
			if (e.key === " ") {
				if (audioRef.current?.src) {
					if (audioRef.current.paused) void audioRef.current.play();
					else audioRef.current.pause();
					e.preventDefault();
				}
				return;
			}
			if (k === "f") {
				e.preventDefault();
				void toggleFlag();
				return;
			}
			if (e.key === "Enter") {
				const canMoveOn =
					(hideExplanation && selected !== null) ||
					(!hideExplanation && revealed);
				if (canMoveOn) {
					e.preventDefault();
					if (currentIndex === total - 1) void onComplete();
					else {
						setSelected(null);
						setRevealed(false);
						onNext();
					}
				}
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [question, revealed, selected, hideExplanation, isFlagged, currentIndex, total, onAnswer, onNext, onComplete, toggleFlag]);

	if (!question) {
		return (
			<div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 48, color: "var(--text-secondary)", fontWeight: 700 }}>
				<LoadingOutlined style={{ fontSize: 20, marginRight: 8, color: "var(--accent)" }} /> Đang tải câu hỏi…
			</div>
		);
	}

	const isLast = currentIndex === total - 1;
	const canSubmit = !hideExplanation ? revealed : selected !== null;
	const showExplanationNow = !hideExplanation && revealed;

	const handlePick = (idx: number) => {
		if (revealed && !hideExplanation) return;
		setSelected(idx);
		if (!hideExplanation) {
			setRevealed(true);
		}
		void onAnswer(idx);
	};

	const handleNext = () => {
		if (isLast) {
			void onComplete();
		} else {
			setSelected(null);
			setRevealed(false);
			onNext();
		}
	};

	const remainingSec = timeLimit && startedAt ? Math.max(0, Math.ceil((timeLimit - elapsed) / 1000)) : null;

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 720, width: "100%", margin: "0 auto" }} className="anim-fade-up">
			{/* Question metadata bar */}
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					background: "var(--surface-alt)",
					border: "1.5px solid var(--border)",
					padding: "10px 14px",
					borderRadius: "var(--radius-xl)",
				}}
			>
				<span style={{ fontSize: 13.5, fontWeight: 900, color: "var(--text-secondary)" }}>
					Câu {currentIndex + 1} / {total}
				</span>
				<div style={{ display: "flex", gap: 6, alignItems: "center" }}>
					<span style={{
						fontSize: 10.5,
						fontWeight: 900,
						padding: "2px 8px",
						borderRadius: 6,
						background: "var(--accent-light)",
						color: "var(--accent)",
						border: "1px solid var(--accent-muted)"
					}}>
						Part {question.part}
					</span>
					{remainingSec !== null && (
						<span style={{
							fontSize: 11,
							fontWeight: 900,
							fontFamily: "var(--font-mono)",
							padding: "2px 8px",
							borderRadius: 6,
							background: remainingSec < 60 ? "rgba(239, 68, 68, 0.08)" : "var(--surface)",
							color: remainingSec < 60 ? "var(--error)" : "var(--text-secondary)",
							border: `1px solid ${remainingSec < 60 ? "rgba(239, 68, 68, 0.2)" : "var(--border)"}`
						}}>
							{Math.floor(remainingSec / 60)}:{String(remainingSec % 60).padStart(2, "0")}
						</span>
					)}
				</div>
			</div>

			{/* Question Images */}
			{question.imageUrls && question.imageUrls.length > 0 && (
				<div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", background: "var(--surface)", border: "1.5px solid var(--border)", padding: 10, borderRadius: "var(--radius-xl)" }}>
					{question.imageUrls.map((src) => (
						<img
							key={src}
							src={src}
							alt=""
							loading="lazy"
							decoding="async"
							style={{ maxWidth: "100%", maxHeight: 320, borderRadius: "var(--radius-lg)", objectFit: "contain" }}
						/>
					))}
				</div>
			)}

			{/* Audio block */}
			{question.audioUrl && !question.audioSegments && (
				<div style={{
					display: "flex",
					alignItems: "center",
					gap: 12,
					background: "var(--surface)",
					border: "1.5px solid var(--border)",
					padding: "12px 16px",
					borderRadius: "var(--radius-xl)"
				}}>
					<m.button
						type="button"
						onClick={() => audioRef.current?.play()}
						whileHover={{ scale: 1.03 }}
						whileTap={{ scale: 0.97 }}
						style={{
							display: "inline-flex",
							alignItems: "center",
							gap: 8,
							padding: "10px 18px",
							background: "var(--accent)",
							color: "var(--text-on-accent)",
							border: "none",
							borderRadius: "var(--radius-lg)",
							fontSize: 13,
							fontWeight: 800,
							cursor: "pointer"
						}}
					>
						<SoundOutlined />
						<span>Nghe audio câu hỏi</span>
					</m.button>
					<audio ref={audioRef} src={question.audioUrl} />
				</div>
			)}

			{/* Audio segment player for Part 2 */}
			{question.audioSegments && (
				<div
					style={{
						background: "var(--surface)",
						border: "1.5px solid var(--border)",
						padding: "14px 18px",
						borderRadius: "var(--radius-xl)",
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						gap: 12
					}}
				>
					<span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-secondary)" }}>
						{(() => {
							const hasQ = (question.audioSegments?.question ?? "").length > 0;
							const totalSegs = (hasQ ? 1 : 0) + (question.audioSegments?.options.length ?? 0);
							if (part2PlayingIdx === -1) return "Audio đang chuẩn bị...";
							if (part2PlayingIdx >= totalSegs) return "Audio đã phát xong — vui lòng chọn đáp án";
							if (hasQ && part2PlayingIdx === 0) return "🔊 Đang phát: Câu hỏi";
							const optIdx = hasQ ? part2PlayingIdx - 1 : part2PlayingIdx;
							return `🔊 Đang phát: Đáp án (${String.fromCharCode(65 + optIdx)})`;
						})()}
					</span>
					<m.button
						type="button"
						disabled={part2PlayingIdx >= 0 && part2PlayingIdx < 4}
						onClick={() => {
							setPart2PlayingIdx(-1);
							void playPart2Sequence();
						}}
						whileHover={{ scale: 1.03 }}
						whileTap={{ scale: 0.97 }}
						style={{
							display: "inline-flex",
							alignItems: "center",
							gap: 6,
							padding: "6px 12px",
							background: "var(--surface-alt)",
							color: "var(--text-primary)",
							border: "1.5px solid var(--border)",
							borderRadius: "var(--radius-md)",
							fontSize: 12.5,
							fontWeight: 800,
							cursor: part2PlayingIdx >= 0 && part2PlayingIdx < 4 ? "not-allowed" : "pointer"
						}}
					>
						<PlayCircleOutlined />
						<span>Nghe lại</span>
					</m.button>
					<audio ref={audioRef} />
				</div>
			)}

			{/* Reading passage text */}
			{question.passageText && (
				<div
					style={{
						whiteSpace: "pre-wrap",
						background: "var(--surface)",
						border: "1.5px solid var(--border)",
						padding: 16,
						borderRadius: "var(--radius-xl)",
						fontSize: 14.5,
						lineHeight: 1.7,
						color: "var(--text-primary)",
						fontWeight: 500
					}}
				>
					{question.passageText}
				</div>
			)}

			{/* Question Text */}
			{question.questionText && (
				<div style={{ fontSize: 16, fontWeight: 900, color: "var(--text-primary)", fontFamily: "var(--font-display)", padding: "4px 2px" }}>
					{question.questionText}
				</div>
			)}

			{/* Choices buttons grid */}
			<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
				{question.options.map((opt, idx) => {
					const isPicked = selected === idx;
					const isCorrect = showExplanationNow && question.correctIndex === idx;
					const isWrongPick = showExplanationNow && isPicked && question.correctIndex !== idx;
					const isLabelOnly = opt.length <= 2 && /^[A-D]$/i.test(opt.trim());

					let border = "1.5px solid var(--border)";
					let bg = "var(--surface)";
					let color = "var(--text-primary)";
					let iconElement = null;

					if (showExplanationNow) {
						if (idx === question.correctIndex) {
							bg = "rgba(16, 185, 129, 0.08)";
							border = "1.5px solid var(--success)";
							color = "var(--success)";
							iconElement = <CheckCircleFilled style={{ color: "var(--success)", fontSize: 16 }} />;
						} else if (isPicked) {
							bg = "rgba(239, 68, 68, 0.08)";
							border = "1.5px solid var(--error)";
							color = "var(--error)";
							iconElement = <CloseCircleFilled style={{ color: "var(--error)", fontSize: 16 }} />;
						} else {
							bg = "var(--surface-alt)";
							color = "var(--text-muted)";
							border = "1px solid var(--border)";
						}
					} else if (isPicked) {
						border = "1.5px solid var(--accent)";
						bg = "var(--accent-light)";
						color = "var(--accent)";
					}

					return (
						<m.button
							type="button"
							key={`${question.id}-${idx}`}
							onClick={() => handlePick(idx)}
							disabled={revealed && !hideExplanation}
							whileHover={revealed && !hideExplanation ? {} : { x: 3, borderColor: "var(--accent)" }}
							whileTap={revealed && !hideExplanation ? {} : { scale: 0.98 }}
							style={{
								padding: "14px 18px",
								borderRadius: "var(--radius-xl)",
								border,
								background: bg,
								color,
								textAlign: "left",
								cursor: revealed && !hideExplanation ? "default" : "pointer",
								display: "flex",
								gap: 10,
								alignItems: "center",
								fontSize: 14,
								fontWeight: 700,
								transition: "background 0.2s, border-color 0.2s",
							}}
						>
							<span style={{ fontWeight: 900, minWidth: 22, opacity: 0.7 }}>
								{String.fromCharCode(65 + idx)}.
							</span>
							<span style={{ flex: 1 }}>{isLabelOnly ? "" : opt}</span>
							{iconElement}
						</m.button>
					);
				})}
			</div>

			{/* Explanation Accordion Box */}
			{showExplanationNow && question.explanationVi && (
				<m.div
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					style={{
						background: "var(--surface-alt)",
						border: "1.5px solid var(--border)",
						padding: 16,
						borderRadius: "var(--radius-xl)",
						fontSize: 13.5,
						color: "var(--text-secondary)",
						lineHeight: 1.6,
						fontWeight: 500
					}}
				>
					<div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 900, color: "var(--text-primary)", marginBottom: 6 }}>
						<CheckCircleFilled style={{ color: "var(--success)" }} />
						<span>Giải thích đáp án chi tiết:</span>
					</div>
					<p style={{ margin: 0 }}>{question.explanationVi}</p>
				</m.div>
			)}

			{/* Control actions bar */}
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					gap: 12,
					marginTop: 12,
					borderTop: "1.5px dashed var(--border)",
					paddingTop: 16
				}}
			>
				<m.button
					type="button"
					onClick={() => void toggleFlag()}
					disabled={!attemptId}
					whileTap={{ scale: 0.95 }}
					style={{
						display: "inline-flex",
						alignItems: "center",
						gap: 6,
						padding: "8px 16px",
						borderRadius: "var(--radius-lg)",
						border: "1.5px solid var(--border)",
						background: isFlagged ? "rgba(239, 68, 68, 0.08)" : "var(--surface)",
						color: isFlagged ? "var(--error)" : "var(--text-secondary)",
						fontSize: 13,
						fontWeight: 800,
						cursor: attemptId ? "pointer" : "not-allowed",
						transition: "all 0.15s"
					}}
					title="Phím tắt: F"
				>
					{isFlagged ? <FlagFilled /> : <FlagOutlined />}
					<span>{isFlagged ? "Đã đánh dấu" : "Đánh dấu"}</span>
				</m.button>
				
				<div style={{ display: "flex", gap: 10 }}>
					{hideExplanation && selected === null && (
						<m.button
							type="button"
							onClick={() => void onAnswer(null)}
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							style={{
								padding: "8px 16px",
								borderRadius: "var(--radius-lg)",
								border: "1.5px solid var(--border)",
								background: "var(--surface)",
								color: "var(--text-secondary)",
								fontSize: 13,
								fontWeight: 850,
								cursor: "pointer"
							}}
						>
							Bỏ qua
						</m.button>
					)}
					<m.button
						type="button"
						onClick={handleNext}
						disabled={!canSubmit && !hideExplanation}
						whileHover={!canSubmit && !hideExplanation ? {} : { scale: 1.02 }}
						whileTap={!canSubmit && !hideExplanation ? {} : { scale: 0.98 }}
						style={{
							padding: "10px 24px",
							borderRadius: "var(--radius-lg)",
							border: "none",
							background: !canSubmit && !hideExplanation ? "var(--border)" : "var(--accent)",
							color: !canSubmit && !hideExplanation ? "var(--text-muted)" : "var(--text-on-accent)",
							fontSize: 13,
							fontWeight: 850,
							cursor: !canSubmit && !hideExplanation ? "not-allowed" : "pointer",
							boxShadow: !canSubmit && !hideExplanation ? "none" : "0 4px 12px var(--accent-muted)",
							transition: "all 0.15s"
						}}
					>
						<span>{isLast ? "Nộp bài" : "Câu tiếp theo"}</span>
					</m.button>
				</div>
			</div>
			
			<div
				style={{
					marginTop: 6,
					fontSize: 11,
					color: "var(--text-muted)",
					textAlign: "center",
					fontWeight: 600
				}}
			>
				⌨️ Phím tắt nhanh: <kbd style={{ background: "var(--surface-alt)", padding: "2px 5px", borderRadius: 4, border: "1px solid var(--border)" }}>1-4</kbd> hoặc <kbd style={{ background: "var(--surface-alt)", padding: "2px 5px", borderRadius: 4, border: "1px solid var(--border)" }}>A-D</kbd> để chọn · <kbd style={{ background: "var(--surface-alt)", padding: "2px 5px", borderRadius: 4, border: "1px solid var(--border)" }}>Space</kbd> phát/dừng audio · <kbd style={{ background: "var(--surface-alt)", padding: "2px 5px", borderRadius: 4, border: "1px solid var(--border)" }}>F</kbd> để flag · <kbd style={{ background: "var(--surface-alt)", padding: "2px 5px", borderRadius: 4, border: "1px solid var(--border)" }}>Enter</kbd> tiếp tục
			</div>
		</div>
	);
}
