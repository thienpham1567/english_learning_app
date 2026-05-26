"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Tag, Modal } from "antd";

import { api } from "@/lib/api-client";
import type { ToeicSessionQuestion } from "@/hooks/useToeicSession";
import { QuestionRunner } from "../../practice/_components/QuestionRunner";
import { Trophy } from "lucide-react";

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

	// Soft anti-cheat: track tab switches + paste events while a mock is in progress.
	useEffect(() => {
		if (!attemptId) return;
		let blurredAt: number | null = null;
		const onVisibility = () => {
			if (document.visibilityState === "hidden") {
				blurredAt = Date.now();
			} else if (document.visibilityState === "visible" && blurredAt !== null) {
				const durationMsOff = Date.now() - blurredAt;
				blurredAt = null;
				void api.post("/toeic-practice/answer", {
					attemptId,
					questionId: questions[idx]?.id ?? questions[0]?.id,
					selectedIndex: null,
					durationMs: 0,
					cheatEvent: "tabSwitch",
					durationMsOff,
				}).catch(() => {});
			}
		};
		const onPaste = () => {
			void api.post("/toeic-practice/answer", {
				attemptId,
				questionId: questions[idx]?.id ?? questions[0]?.id,
				selectedIndex: null,
				durationMs: 0,
				cheatEvent: "paste",
			}).catch(() => {});
		};
		document.addEventListener("visibilitychange", onVisibility);
		document.addEventListener("paste", onPaste);
		return () => {
			document.removeEventListener("visibilitychange", onVisibility);
			document.removeEventListener("paste", onPaste);
		};
	}, [attemptId, idx, questions]);

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
			<div className="p-6" >
				<div className="text-destructive mb-3" >{error}</div>
				<Button onClick={() => router.push("/toeic/mock-test")}>Về Hub</Button>
			</div>
		);
	}
	if (questions.length === 0) {
		return <div className="p-6" >Đang tải đề mock test…</div>;
	}

	const totalAnswered = idx + 1;
	const sectionLabel = section === "listening" ? "Listening" : "Reading";

	// Preload next 5 questions' audio + images for smooth transitions
	const preloadUrls = (() => {
		const urls: string[] = [];
		for (let i = idx + 1; i <= idx + 5 && i < questions.length; i++) {
			const q = questions[i];
			if (q.audioUrl) urls.push(q.audioUrl);
			if (q.audioSegments?.question) urls.push(q.audioSegments.question);
			q.audioSegments?.options?.forEach((u) => urls.push(u));
			q.imageUrls?.forEach((u) => urls.push(u));
		}
		return urls;
	})();

	return (
		<div className="p-4 flex-1" >
			<div className="flex justify-between items-center mb-3" >
				<Tag color={section === "listening" ? "orange" : "green"}>{sectionLabel}</Tag>
				<span className="text-text-muted" >
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
				attemptId={attemptId ?? undefined}
				onAnswer={handleAnswer}
				onNext={handleNext}
				onComplete={submitFinal}
			/>
			{/* Hidden preload — browser fetches next 5 questions' media in background */}
			<div  aria-hidden className="hidden" >
				{preloadUrls.map((u) => (
					u.match(/\.(wav|mp3|webm|ogg)$/i) ? (
						<audio key={u} preload="auto" src={u} />
					) : (
						<img key={u} src={u} alt="" loading="eager" decoding="async" />
					)
				))}
			</div>
		</div>
	);
}

export default function MockRunnerPage() {
	return (
		<div className="flex flex-col h-full h-[0px] flex-1 overflow-auto" >
			<Suspense fallback={<div>Loading…</div>}>
				<MockRunner />
			</Suspense>
		</div>
	);
}
