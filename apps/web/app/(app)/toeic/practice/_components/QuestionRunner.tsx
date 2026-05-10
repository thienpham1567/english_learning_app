"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Tag } from "antd";
import { CheckCircleFilled, CloseCircleFilled, SoundOutlined, PlayCircleOutlined } from "@ant-design/icons";
import type { ToeicSessionQuestion } from "@/hooks/useToeicSession";

export type QuestionRunnerProps = {
	question: ToeicSessionQuestion | null;
	currentIndex: number;
	total: number;
	/** When true, hides explanation/correct answer until completion (mock + diagnostic). */
	hideExplanation?: boolean;
	/** Optional countdown timer in ms; shows time-up warning when reached. */
	timeLimit?: number;
	startedAt?: number | null;
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
	onAnswer,
	onNext,
	onComplete,
}: QuestionRunnerProps) {
	const [selected, setSelected] = useState<number | null>(null);
	const [revealed, setRevealed] = useState(false);
	const [elapsed, setElapsed] = useState(0);
	const [part2PlayingIdx, setPart2PlayingIdx] = useState(-1); // -1 idle, 0=Q, 1=A, 2=B, 3=C, 4=done
	const audioRef = useRef<HTMLAudioElement>(null);

	useEffect(() => {
		setSelected(null);
		setRevealed(false);
		setPart2PlayingIdx(-1);
	}, [question?.id]);

	// Part 1/2: auto-play [Q] → A → B → C [→ D] in sequence on mount.
	// Part 1: no question prompt (empty string), 4 options.
	// Part 2: 1 question prompt + 3 options.
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
				// Brief pause between clips
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [question?.id]);

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

	if (!question) {
		return <div style={{ padding: 24 }}>Đang tải câu hỏi…</div>;
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
			if (hideExplanation && selected !== null) {
				// In hidden mode, persist the answer when navigating away
				// (already sent on pick).
			}
			setSelected(null);
			setRevealed(false);
			onNext();
		}
	};

	const remainingSec = timeLimit && startedAt ? Math.max(0, Math.ceil((timeLimit - elapsed) / 1000)) : null;

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 720 }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					color: "var(--text-muted, #94a3b8)",
					fontSize: 14,
				}}
			>
				<span>
					Câu {currentIndex + 1} / {total}
				</span>
				<span>
					<Tag>Part {question.part}</Tag>
					{remainingSec !== null && (
						<Tag color={remainingSec < 60 ? "red" : "blue"}>
							{Math.floor(remainingSec / 60)}:{String(remainingSec % 60).padStart(2, "0")}
						</Tag>
					)}
				</span>
			</div>

			{question.imageUrls && question.imageUrls.length > 0 && (
				<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
					{question.imageUrls.map((src) => (
						<img
							key={src}
							src={src}
							alt=""
							loading="lazy"
							decoding="async"
							style={{ maxWidth: "100%", maxHeight: 320, borderRadius: 8 }}
						/>
					))}
				</div>
			)}

			{question.audioUrl && !question.audioSegments && (
				<div>
					<Button
						icon={<SoundOutlined />}
						onClick={() => audioRef.current?.play()}
					>
						Nghe audio
					</Button>
					<audio ref={audioRef} src={question.audioUrl} />
				</div>
			)}

			{question.audioSegments && (
				<div
					style={{
						background: "var(--surface, #0f172a)",
						padding: 12,
						borderRadius: 8,
					}}
				>
					<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
						<span style={{ fontSize: 14, color: "var(--text-muted, #94a3b8)" }}>
							{(() => {
								const hasQ = (question.audioSegments?.question ?? "").length > 0;
								const total = (hasQ ? 1 : 0) + (question.audioSegments?.options.length ?? 0);
								if (part2PlayingIdx === -1) return "Đang chuẩn bị audio…";
								if (part2PlayingIdx >= total) return "Audio đã phát xong — chọn đáp án";
								if (hasQ && part2PlayingIdx === 0) return "🔊 Câu hỏi";
								const optIdx = hasQ ? part2PlayingIdx - 1 : part2PlayingIdx;
								return `🔊 (${String.fromCharCode(65 + optIdx)})`;
							})()}
						</span>
						<Button
							size="small"
							icon={<PlayCircleOutlined />}
							disabled={part2PlayingIdx >= 0 && part2PlayingIdx < 4}
							onClick={() => {
								setPart2PlayingIdx(-1);
								void playPart2Sequence();
							}}
						>
							Nghe lại
						</Button>
					</div>
					<audio ref={audioRef} />
				</div>
			)}

			{question.passageText && (
				<div
					style={{
						whiteSpace: "pre-wrap",
						background: "var(--surface, #0f172a)",
						padding: 12,
						borderRadius: 8,
						fontSize: 14,
					}}
				>
					{question.passageText}
				</div>
			)}

			{question.questionText && (
				<div style={{ fontSize: 16, fontWeight: 500 }}>{question.questionText}</div>
			)}

			<div style={{ display: "grid", gap: 8 }}>
				{question.options.map((opt, idx) => {
					const isPicked = selected === idx;
					const isCorrect = showExplanationNow && question.correctIndex === idx;
					const isWrongPick = showExplanationNow && isPicked && question.correctIndex !== idx;
					// Part 2: options are just "A"/"B"/"C" labels; no text content to display
					const isLabelOnly = opt.length <= 2 && /^[A-D]$/i.test(opt.trim());
					return (
						<button
							type="button"
							key={`${question.id}-${idx}`}
							onClick={() => handlePick(idx)}
							disabled={revealed && !hideExplanation}
							style={{
								padding: "10px 14px",
								borderRadius: 8,
								border: `1px solid ${
									isCorrect
										? "#10b981"
										: isWrongPick
											? "#ef4444"
											: isPicked
												? "#3b82f6"
												: "var(--border-color, #1f2937)"
								}`,
								background: isCorrect
									? "rgba(16,185,129,.1)"
									: isWrongPick
										? "rgba(239,68,68,.1)"
										: isPicked
											? "rgba(59,130,246,.1)"
											: "transparent",
								color: "var(--text-primary, #fff)",
								textAlign: "left",
								cursor: revealed && !hideExplanation ? "default" : "pointer",
								display: "flex",
								gap: 8,
								alignItems: "flex-start",
							}}
						>
							<span style={{ fontWeight: 600, minWidth: 20 }}>
								{String.fromCharCode(65 + idx)}.
							</span>
							<span style={{ flex: 1 }}>{isLabelOnly ? "" : opt}</span>
							{isCorrect && <CheckCircleFilled style={{ color: "#10b981" }} />}
							{isWrongPick && <CloseCircleFilled style={{ color: "#ef4444" }} />}
						</button>
					);
				})}
			</div>

			{showExplanationNow && question.explanationVi && (
				<div
					style={{
						background: "var(--surface, #0f172a)",
						padding: 12,
						borderRadius: 8,
						fontSize: 14,
						color: "var(--text-muted, #cbd5e1)",
					}}
				>
					<strong>Giải thích:</strong> {question.explanationVi}
				</div>
			)}

			<div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
				{hideExplanation && selected === null && (
					<Button onClick={() => void onAnswer(null)}>Bỏ qua</Button>
				)}
				<Button type="primary" onClick={handleNext} disabled={!canSubmit && !hideExplanation}>
					{isLast ? "Nộp bài" : "Câu tiếp"}
				</Button>
			</div>
		</div>
	);
}
