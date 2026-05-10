"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Tag, Progress, Modal } from "antd";
import { AudioOutlined, AudioMutedOutlined } from "@ant-design/icons";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { api } from "@/lib/api-client";

type Prompt = {
	id: string;
	questionNumber: number;
	type:
		| "q1_2_read_aloud"
		| "q3_4_describe_picture"
		| "q5_7_respond_question"
		| "q8_10_respond_info"
		| "q11_opinion";
	textToRead: string | null;
	imageUrl: string | null;
	questionText: string | null;
	contextText: string | null;
	topic: string | null;
	topicVi: string | null;
	prepSeconds: number;
	speakSeconds: number;
	maxScore: number;
};

const TYPE_LABEL: Record<Prompt["type"], string> = {
	q1_2_read_aloud: "Q1-2 · Read aloud",
	q3_4_describe_picture: "Q3-4 · Describe picture",
	q5_7_respond_question: "Q5-7 · Respond to question",
	q8_10_respond_info: "Q8-10 · Respond using info",
	q11_opinion: "Q11 · Opinion",
};

type Phase = "loading" | "prep" | "recording" | "uploading" | "next" | "complete";

export default function SpeakingRunnerPage() {
	const router = useRouter();
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [prompts, setPrompts] = useState<Prompt[]>([]);
	const [idx, setIdx] = useState(0);
	const [phase, setPhase] = useState<Phase>("loading");
	const [phaseStartedAt, setPhaseStartedAt] = useState(Date.now());
	const [elapsed, setElapsed] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const [permissionDenied, setPermissionDenied] = useState(false);

	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const recordedChunks = useRef<Blob[]>([]);
	const streamRef = useRef<MediaStream | null>(null);

	useEffect(() => {
		(async () => {
			try {
				const r = await api.post<{ sessionId: string; prompts: Prompt[] }>(
					"/toeic-speaking/start",
					{},
				);
				setSessionId(r.sessionId);
				setPrompts(r.prompts);
				setPhase(r.prompts[0].prepSeconds > 0 ? "prep" : "recording");
				setPhaseStartedAt(Date.now());
				if (r.prompts[0].prepSeconds === 0) await startRecording();
			} catch (e) {
				setError(e instanceof Error ? e.message : "Failed to start");
			}
		})();
		return () => {
			streamRef.current?.getTracks().forEach((t) => t.stop());
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const current = prompts[idx];

	useEffect(() => {
		if (phase === "loading" || phase === "complete") return;
		setPhaseStartedAt(Date.now());
		setElapsed(0);
	}, [phase, idx]);

	useEffect(() => {
		if (phase === "loading" || phase === "complete" || phase === "uploading") return;
		const tick = () => setElapsed(Date.now() - phaseStartedAt);
		const i = setInterval(tick, 200);
		return () => clearInterval(i);
	}, [phase, phaseStartedAt]);

	useEffect(() => {
		if (!current) return;
		if (phase === "prep" && elapsed >= current.prepSeconds * 1000) {
			void startRecording();
		} else if (phase === "recording" && elapsed >= current.speakSeconds * 1000) {
			void stopAndSubmit();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [elapsed]);

	function pickMimeType(): string {
		const candidates = [
			"audio/webm;codecs=opus",
			"audio/webm",
			"audio/mp4",
			"audio/mpeg",
			"audio/ogg;codecs=opus",
		];
		for (const m of candidates) {
			if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) {
				return m;
			}
		}
		return "";
	}

	async function startRecording() {
		try {
			if (!streamRef.current) {
				const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
				streamRef.current = stream;
			}
			recordedChunks.current = [];
			const mimeType = pickMimeType();
			const mr = mimeType
				? new MediaRecorder(streamRef.current, { mimeType })
				: new MediaRecorder(streamRef.current);
			mr.ondataavailable = (e) => {
				if (e.data.size > 0) recordedChunks.current.push(e.data);
			};
			mr.start();
			mediaRecorderRef.current = mr;
			setPhase("recording");
			setPhaseStartedAt(Date.now());
		} catch {
			setPermissionDenied(true);
			setPhase("complete");
		}
	}

	async function stopAndSubmit() {
		const mr = mediaRecorderRef.current;
		if (!mr || mr.state === "inactive") return;
		setPhase("uploading");

		await new Promise<void>((resolve) => {
			mr.onstop = () => resolve();
			mr.stop();
		});

		const blobType = mediaRecorderRef.current?.mimeType || "audio/webm";
		const blob = new Blob(recordedChunks.current, { type: blobType });
		const fd = new FormData();
		fd.append("sessionId", sessionId ?? "");
		fd.append("promptId", current.id);
		fd.append("durationMs", String(elapsed));
		fd.append("audio", blob, "answer.webm");

		try {
			const res = await fetch("/api/toeic-speaking/submit-response", {
				method: "POST",
				body: fd,
			});
			if (!res.ok) throw new Error(`Server returned ${res.status}`);
			await res.json();
		} catch (e) {
			console.error("submit failed", e);
		}

		// Move to next or complete
		if (idx + 1 >= prompts.length) {
			try {
				await api.post("/toeic-speaking/complete", { sessionId });
			} catch {}
			streamRef.current?.getTracks().forEach((t) => t.stop());
			router.push(`/toeic/speaking/${sessionId}/result`);
			return;
		}
		setIdx(idx + 1);
		const nextP = prompts[idx + 1];
		setPhase(nextP.prepSeconds > 0 ? "prep" : "recording");
		if (nextP.prepSeconds === 0) await startRecording();
	}

	if (error) {
		return (
			<div style={{ padding: 24 }}>
				<div style={{ color: "#ef4444", marginBottom: 12 }}>{error}</div>
				<Button onClick={() => router.push("/toeic/speaking")}>Về Hub</Button>
			</div>
		);
	}
	if (permissionDenied) {
		return (
			<div style={{ padding: 24 }}>
				<div style={{ color: "#ef4444", marginBottom: 12 }}>
					Cần quyền microphone để làm Speaking test. Cho phép trong cài đặt browser rồi reload.
				</div>
				<Button onClick={() => router.push("/toeic/speaking")}>Về Hub</Button>
			</div>
		);
	}
	if (!current) {
		return <div style={{ padding: 24 }}>Đang khởi tạo…</div>;
	}

	const phaseLimit =
		phase === "prep"
			? current.prepSeconds * 1000
			: phase === "recording"
				? current.speakSeconds * 1000
				: 0;
	const remaining = Math.max(0, phaseLimit - elapsed);
	const sec = Math.ceil(remaining / 1000);

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
				icon={<AudioOutlined />}
				gradient="linear-gradient(135deg, #1a2332 0%, #2d3748 40%, #4a5568 100%)"
				title={`Question ${current.questionNumber} / 11`}
				subtitle={TYPE_LABEL[current.type]}
			/>
			<div style={{ padding: 16, display: "grid", gap: 12, maxWidth: 720 }}>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<Tag color={phase === "recording" ? "red" : phase === "prep" ? "orange" : "default"}>
						{phase === "prep" && `Chuẩn bị · ${sec}s`}
						{phase === "recording" && (
							<>
								<AudioOutlined /> Đang ghi · {sec}s
							</>
						)}
						{phase === "uploading" && (
							<>
								<AudioMutedOutlined /> Đang upload + chấm…
							</>
						)}
					</Tag>
					<span style={{ color: "var(--text-muted, #94a3b8)" }}>Max {current.maxScore} điểm</span>
				</div>
				<Progress
					percent={Math.round((elapsed / Math.max(1, phaseLimit)) * 100)}
					showInfo={false}
					size="small"
					strokeColor={phase === "recording" ? "#ef4444" : "#3b82f6"}
				/>

				{current.type === "q1_2_read_aloud" && (
					<Card>
						<div style={{ fontSize: 13, color: "var(--text-muted)" }}>Đọc to đoạn dưới</div>
						<div style={{ fontSize: 18, lineHeight: 1.6, marginTop: 8 }}>
							{current.textToRead}
						</div>
					</Card>
				)}

				{current.type === "q3_4_describe_picture" && current.imageUrl && (
					<Card>
						<img
							src={current.imageUrl}
							alt=""
							style={{ maxWidth: "100%", maxHeight: 320, borderRadius: 8 }}
						/>
						<div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>
							Mô tả ảnh càng chi tiết càng tốt
						</div>
					</Card>
				)}

				{current.type === "q5_7_respond_question" && (
					<Card>
						<div style={{ fontSize: 13, color: "var(--text-muted)" }}>Trả lời câu hỏi</div>
						<div style={{ fontSize: 18, marginTop: 8 }}>{current.questionText}</div>
					</Card>
				)}

				{current.type === "q8_10_respond_info" && (
					<>
						<Card size="small">
							<div style={{ fontSize: 13, color: "var(--text-muted)" }}>Context</div>
							<div style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>{current.contextText}</div>
						</Card>
						<Card>
							<div style={{ fontSize: 13, color: "var(--text-muted)" }}>Câu hỏi</div>
							<div style={{ fontSize: 18, marginTop: 8 }}>{current.questionText}</div>
						</Card>
					</>
				)}

				{current.type === "q11_opinion" && (
					<Card>
						<div style={{ fontSize: 13, color: "var(--text-muted)" }}>Topic</div>
						<div style={{ fontSize: 18, marginTop: 8 }}>{current.topic}</div>
						{current.topicVi && (
							<div style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>
								{current.topicVi}
							</div>
						)}
					</Card>
				)}

				{phase === "recording" && (
					<Button danger onClick={() => void stopAndSubmit()}>
						Dừng + Nộp câu này
					</Button>
				)}
				{phase === "prep" && (
					<Button type="primary" onClick={() => void startRecording()}>
						Sẵn sàng — bắt đầu ghi sớm
					</Button>
				)}
			</div>
		</div>
	);
}
