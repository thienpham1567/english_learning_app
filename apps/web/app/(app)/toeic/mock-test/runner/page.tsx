"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Tag, Modal } from "antd";
import { TrophyOutlined } from "@ant-design/icons";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { api } from "@/lib/api-client";
import type { ToeicSessionQuestion } from "@/hooks/useToeicSession";
import { QuestionRunner } from "../../practice/_components/QuestionRunner";

const FULL_LISTEN_MIN = 45;
const FULL_READ_MIN = 75;
const MINI_LISTEN_MIN = 22;
const MINI_READ_MIN = 37;

function isListening(part: number): boolean {
	return part >= 1 && part <= 4;
}

function MockRunner() {
	const router = useRouter();
	const params = useSearchParams();
	const mode = (params.get("mode") ?? "full") as "full" | "mini";
	const resumeId = params.get("resume");

	const [attemptId, setAttemptId] = useState<string | null>(null);
	const [questions, setQuestions] = useState<ToeicSessionQuestion[]>([]);
	const [idx, setIdx] = useState(0);
	const [section, setSection] = useState<"listening" | "reading">("listening");
	const [sectionStartedAt, setSectionStartedAt] = useState<number>(Date.now());
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const questionShownAt = useRef(Date.now());

	const listeningMs =
		(mode === "full" ? FULL_LISTEN_MIN : MINI_LISTEN_MIN) * 60 * 1000;
	const readingMs = (mode === "full" ? FULL_READ_MIN : MINI_READ_MIN) * 60 * 1000;

	useEffect(() => {
		(async () => {
			try {
				if (resumeId) {
					// Resume in-progress attempt
					const r = await api.get<{
						inProgress: {
							attemptId: string;
							questions: ToeicSessionQuestion[];
							answeredIds: string[];
							readingStartedAt: string | null;
						} | null;
					}>("/toeic-mock/in-progress");
					if (!r.inProgress || r.inProgress.attemptId !== resumeId) {
						setError("Không tìm thấy mock test đang dở");
						return;
					}
					setAttemptId(r.inProgress.attemptId);
					setQuestions(r.inProgress.questions);
					// Skip to first unanswered question
					const answeredSet = new Set(r.inProgress.answeredIds);
					const firstUnanswered = r.inProgress.questions.findIndex((q) => !answeredSet.has(q.id));
					const startIdx = firstUnanswered === -1 ? r.inProgress.questions.length - 1 : firstUnanswered;
					setIdx(startIdx);
					// Determine section from current question's part
					const currentPart = r.inProgress.questions[startIdx]?.part ?? 1;
					setSection(currentPart >= 5 ? "reading" : "listening");
					// Reset section timer (give user fresh time after resume)
					setSectionStartedAt(Date.now());
					questionShownAt.current = Date.now();
				} else {
					const r = await api.post<{
						attemptId: string;
						questions: ToeicSessionQuestion[];
					}>("/toeic-mock/start", { mode });
					setAttemptId(r.attemptId);
					setQuestions(r.questions);
					setSectionStartedAt(Date.now());
					questionShownAt.current = Date.now();
				}
			} catch (e) {
				setError(e instanceof Error ? e.message : "Không thể bắt đầu");
			}
		})();
	}, [mode, resumeId]);

	const sectionTimeLimit = section === "listening" ? listeningMs : readingMs;
	const current = questions[idx] ?? null;

	const submitFinal = async () => {
		if (!attemptId || submitting) return;
		setSubmitting(true);
		try {
			await api.post("/toeic-mock/complete", { attemptId });
			router.push(`/toeic/mock-test/${attemptId}/result`);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Không thể nộp bài");
			setSubmitting(false);
		}
	};

	const handleAnswer = async (selectedIndex: number | null) => {
		if (!attemptId || !current) return;
		const durationMs = Date.now() - questionShownAt.current;
		try {
			await api.post("/toeic-practice/answer", {
				attemptId,
				questionId: current.id,
				selectedIndex,
				durationMs,
			});
		} catch {
			// non-blocking; will be re-tried on next answer attempt
		}
	};

	const handleNext = () => {
		if (!current) return;
		const nextIdx = idx + 1;
		if (nextIdx >= questions.length) {
			void submitFinal();
			return;
		}
		const nextQ = questions[nextIdx];
		const wasListening = isListening(current.part);
		const nowListening = isListening(nextQ.part);
		if (wasListening && !nowListening) {
			// Section transition
			setSection("reading");
			setSectionStartedAt(Date.now());
			Modal.info({
				title: "Reading section starts now",
				content:
					"Listening đã kết thúc. Bắt đầu phần Reading. Bạn có 75 phút (Full) / 37 phút (Mini).",
				okText: "Bắt đầu",
			});
		}
		setIdx(nextIdx);
		questionShownAt.current = Date.now();
	};

	if (error) {
		return (
			<div style={{ padding: 24 }}>
				<div style={{ color: "#ef4444", marginBottom: 12 }}>{error}</div>
				<Button onClick={() => router.push("/toeic/mock-test")}>Về Hub</Button>
			</div>
		);
	}
	if (questions.length === 0) {
		return <div style={{ padding: 24 }}>Đang tải đề mock test…</div>;
	}

	const totalAnswered = idx + 1;
	const sectionLabel = section === "listening" ? "Listening" : "Reading";

	return (
		<div style={{ padding: 16, flex: 1 }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 12,
				}}
			>
				<Tag color={section === "listening" ? "blue" : "green"}>{sectionLabel}</Tag>
				<span style={{ color: "var(--text-muted, #94a3b8)" }}>
					{totalAnswered} / {questions.length}
				</span>
			</div>
			<QuestionRunner
				question={current}
				currentIndex={idx}
				total={questions.length}
				hideExplanation
				timeLimit={sectionTimeLimit}
				startedAt={sectionStartedAt}
				onAnswer={handleAnswer}
				onNext={handleNext}
				onComplete={submitFinal}
			/>
		</div>
	);
}

export default function MockRunnerPage() {
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
				icon={<TrophyOutlined />}
				gradient="linear-gradient(135deg, #1a2332 0%, #2d3748 40%, #4a5568 100%)"
				title="Mock Test (đang thi)"
				subtitle="Strict timing — không tua audio, không quay lại"
			/>
			<Suspense fallback={<div>Loading…</div>}>
				<MockRunner />
			</Suspense>
		</div>
	);
}
