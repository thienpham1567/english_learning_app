"use client";

import { TrophyOutlined } from "@ant-design/icons";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { useToeicSession } from "@/hooks/useToeicSession";
import { DiagnosticIntro } from "./_components/DiagnosticIntro";
import { DiagnosticResult } from "./_components/DiagnosticResult";
import { QuestionRunner } from "../practice/_components/QuestionRunner";

const TIME_LIMIT_MS = 20 * 60 * 1000;

export default function DiagnosticPage() {
	const session = useToeicSession();

	const handleStart = () => {
		void session.start({ mode: "diagnostic", count: 30, timeLimit: TIME_LIMIT_MS });
	};

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
				title="Diagnostic Test"
				subtitle="30 câu · 20 phút · Phủ Part 3–7"
			/>
			<div style={{ padding: 16, flex: 1 }}>
				{session.state === "idle" && <DiagnosticIntro onStart={handleStart} />}
				{(session.state === "loading") && <div>Đang tải đề…</div>}
				{(session.state === "active" || session.state === "submitting") && (
					<QuestionRunner
						question={session.currentQuestion}
						currentIndex={session.currentIndex}
						total={session.questions.length}
						hideExplanation
						timeLimit={TIME_LIMIT_MS}
						startedAt={session.startedAt}
						attemptId={session.attemptId ?? undefined}
						onAnswer={session.answer}
						onNext={session.next}
						onComplete={session.complete}
					/>
				)}
				{session.state === "completed" && session.baselineSnapshot && (
					<DiagnosticResult snapshot={session.baselineSnapshot} score={session.score} />
				)}
				{session.error && (
					<div style={{ color: "#ef4444", marginTop: 8 }}>{session.error}</div>
				)}
			</div>
		</div>
	);
}
