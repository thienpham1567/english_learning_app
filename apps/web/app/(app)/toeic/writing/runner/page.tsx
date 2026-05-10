"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Tag, Input, Modal, Progress } from "antd";
import { FormOutlined } from "@ant-design/icons";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { api } from "@/lib/api-client";

type Prompt = {
	id: string;
	questionNumber: number;
	type: "q1_5_picture" | "q6_7_email" | "q8_opinion";
	imageUrl: string | null;
	mandatoryWords: string[] | null;
	emailSubject: string | null;
	emailBody: string | null;
	emailRequirements: string[] | null;
	topic: string | null;
	topicVi: string | null;
	prepSeconds: number;
	writeSeconds: number;
	maxScore: number;
};

const TYPE_LABEL: Record<Prompt["type"], string> = {
	q1_5_picture: "Q1-5 · Mô tả ảnh",
	q6_7_email: "Q6-7 · Trả lời email",
	q8_opinion: "Q8 · Opinion essay",
};

export default function WritingRunnerPage() {
	const router = useRouter();
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [prompts, setPrompts] = useState<Prompt[]>([]);
	const [idx, setIdx] = useState(0);
	const [text, setText] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [completing, setCompleting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [elapsed, setElapsed] = useState(0);
	const startedAt = useRef<number>(Date.now());

	useEffect(() => {
		(async () => {
			try {
				const r = await api.post<{ sessionId: string; prompts: Prompt[] }>(
					"/toeic-writing/start",
					{},
				);
				setSessionId(r.sessionId);
				setPrompts(r.prompts);
				startedAt.current = Date.now();
			} catch (e) {
				setError(e instanceof Error ? e.message : "Failed to start");
			}
		})();
	}, []);

	useEffect(() => {
		startedAt.current = Date.now();
		setText("");
		setElapsed(0);
	}, [idx]);

	useEffect(() => {
		if (prompts.length === 0) return;
		const tick = () => setElapsed(Date.now() - startedAt.current);
		const i = setInterval(tick, 1000);
		return () => clearInterval(i);
	}, [prompts.length]);

	const current = prompts[idx];
	const remaining = current ? Math.max(0, current.writeSeconds * 1000 - elapsed) : 0;

	useEffect(() => {
		if (current && elapsed >= current.writeSeconds * 1000 && !submitting) {
			void submit();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [elapsed]);

	const submit = async () => {
		if (!sessionId || !current || submitting) return;
		setSubmitting(true);
		try {
			await api.post("/toeic-writing/submit-response", {
				sessionId,
				promptId: current.id,
				text,
				durationMs: elapsed,
			});
			if (idx + 1 >= prompts.length) {
				setCompleting(true);
				await api.post("/toeic-writing/complete", { sessionId });
				router.push(`/toeic/writing/${sessionId}/result`);
			} else {
				setIdx(idx + 1);
			}
		} catch (e) {
			setError(e instanceof Error ? e.message : "Submit failed");
		}
		setSubmitting(false);
	};

	const skipQuestion = () => {
		Modal.confirm({
			title: "Bỏ qua câu này?",
			content: "Bạn sẽ nhận 0 điểm cho câu này. Tiếp tục?",
			onOk: () => void submit(),
		});
	};

	if (error) {
		return (
			<div style={{ padding: 24 }}>
				<div style={{ color: "#ef4444", marginBottom: 12 }}>{error}</div>
				<Button onClick={() => router.push("/toeic/writing")}>Về Hub</Button>
			</div>
		);
	}
	if (!current) {
		return <div style={{ padding: 24 }}>{completing ? "Đang chấm bài…" : "Đang tải…"}</div>;
	}

	const minRemaining = Math.floor(remaining / 60000);
	const secRemaining = Math.floor((remaining % 60000) / 1000);

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
				icon={<FormOutlined />}
				gradient="linear-gradient(135deg, #1a2332 0%, #2d3748 40%, #4a5568 100%)"
				title={`Question ${current.questionNumber} / 8`}
				subtitle={TYPE_LABEL[current.type]}
			/>
			<div style={{ padding: 16, display: "grid", gap: 12, maxWidth: 800 }}>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<Tag color={remaining < 60000 ? "red" : "blue"}>
						⏱ {minRemaining}:{String(secRemaining).padStart(2, "0")}
					</Tag>
					<span style={{ color: "var(--text-muted, #94a3b8)" }}>
						Max {current.maxScore} điểm
					</span>
				</div>
				<Progress
					percent={Math.round((elapsed / (current.writeSeconds * 1000)) * 100)}
					showInfo={false}
					size="small"
				/>

				{current.type === "q1_5_picture" && (
					<>
						{current.imageUrl && (
							<img loading="lazy" decoding="async"
								src={current.imageUrl}
								alt=""
								style={{ maxWidth: "100%", maxHeight: 300, borderRadius: 8 }}
							/>
						)}
						<Card size="small" style={{ background: "rgba(59,130,246,.08)" }}>
							<div style={{ fontSize: 13, color: "var(--text-muted)" }}>
								Viết MỘT câu mô tả ảnh, bắt buộc dùng cả 2 từ:
							</div>
							<div style={{ marginTop: 6 }}>
								{(current.mandatoryWords ?? []).map((w) => (
									<Tag key={w} color="blue" style={{ fontSize: 14 }}>
										{w}
									</Tag>
								))}
							</div>
						</Card>
					</>
				)}

				{current.type === "q6_7_email" && (
					<Card size="small">
						<div style={{ fontSize: 13, color: "var(--text-muted)" }}>Subject</div>
						<div style={{ fontWeight: 600, marginBottom: 8 }}>{current.emailSubject}</div>
						<div style={{ whiteSpace: "pre-wrap", marginBottom: 12 }}>
							{current.emailBody}
						</div>
						<div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>
							Phải đáp ứng:
						</div>
						<ul style={{ marginTop: 0 }}>
							{(current.emailRequirements ?? []).map((r) => (
								<li key={r}>{r}</li>
							))}
						</ul>
					</Card>
				)}

				{current.type === "q8_opinion" && (
					<Card size="small">
						<div style={{ fontSize: 13, color: "var(--text-muted)" }}>Topic</div>
						<div style={{ fontSize: 16, fontWeight: 500, marginTop: 4 }}>{current.topic}</div>
						{current.topicVi && (
							<div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
								{current.topicVi}
							</div>
						)}
						<div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
							Mục tiêu: ≥300 từ · cấu trúc rõ ràng (intro / arguments / conclusion)
						</div>
					</Card>
				)}

				<Input.TextArea
					value={text}
					onChange={(e) => setText(e.target.value)}
					rows={current.type === "q8_opinion" ? 14 : current.type === "q6_7_email" ? 8 : 3}
					placeholder="Type your answer here..."
					autoFocus
				/>
				<div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
					<Button onClick={skipQuestion} disabled={submitting}>
						Bỏ qua
					</Button>
					<Button
						type="primary"
						loading={submitting}
						disabled={!text.trim()}
						onClick={submit}
					>
						{idx + 1 === prompts.length ? "Nộp bài cuối" : "Câu tiếp"}
					</Button>
				</div>
			</div>
		</div>
	);
}
