"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Tag, Input, Modal, Progress, message } from "antd";

import { api } from "@/lib/api-client";
import { ClipboardList } from "lucide-react";

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
			<div className="p-6" >
				<div className="text-destructive mb-3" >{error}</div>
				<Button onClick={() => router.push("/toeic/writing")}>Về Hub</Button>
			</div>
		);
	}
	if (!current) {
		return <div className="p-6" >{completing ? "Đang chấm bài…" : "Đang tải…"}</div>;
	}

	const minRemaining = Math.floor(remaining / 60000);
	const secRemaining = Math.floor((remaining % 60000) / 1000);

	return (
		<div className="flex flex-col h-full h-[0px] flex-1 overflow-auto" >
			<div className="p-4 grid gap-3 w-[800px]" >
				<div className="flex justify-between items-center" >
					<Tag color={remaining < 60000 ? "red" : "orange"}>
						⏱ {minRemaining}:{String(secRemaining).padStart(2, "0")}
					</Tag>
					<span className="text-text-muted" >
						Max {current.maxScore} điểm
					</span>
				</div>
				<Progress
					percent={Math.round((elapsed / (current.writeSeconds * 1000)) * 100)}
					showInfo={false}
					size="small"
					strokeColor={remaining < 60000 ? "var(--error)" : "var(--accent)"}
				/>

				{current.type === "q1_5_picture" && (
					<>
						{current.imageUrl && (
							<img loading="lazy" decoding="async"
								src={current.imageUrl}
								alt="" className="h-[300px] rounded-lg" style={{maxWidth: "100%"}} />
						)}
						<Card size="small" className="border-2 border-border" style={{background: "color-mix(in srgb, var(--accent) 8%, var(--surface))"}} >
							<div className="text-[13px] text-text-muted" >
								Viết MỘT câu mô tả ảnh, bắt buộc dùng cả 2 từ:
							</div>
							<div className="mt-1.5" >
								{(current.mandatoryWords ?? []).map((w) => (
									<Tag key={w} color="orange" className="text-sm" >
										{w}
									</Tag>
								))}
							</div>
						</Card>
					</>
				)}

				{current.type === "q6_7_email" && (
					<Card size="small">
						<div className="text-[13px] text-text-muted" >Subject</div>
						<div className="font-semibold mb-2" >{current.emailSubject}</div>
						<div className="mb-3" style={{whiteSpace: "pre-wrap"}} >
							{current.emailBody}
						</div>
						<div className="text-[13px] text-text-muted mb-1" >
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
						<div className="text-[13px] text-text-muted" >Topic</div>
						<div className="text-base font-medium mt-1" >{current.topic}</div>
						{current.topicVi && (
							<div className="text-text-muted text-[13px] mt-1" >
								{current.topicVi}
							</div>
						)}
						<div className="mt-2 text-xs text-text-muted" >
							Mục tiêu: ≥300 từ · cấu trúc rõ ràng (intro / arguments / conclusion)
						</div>
					</Card>
				)}

				<Input.TextArea
					value={text}
					onChange={(e) => setText(e.target.value)}
					onPaste={(e) => {
						e.preventDefault();
						void message.warning("Paste bị chặn — hãy gõ lại bằng tay để luyện viết.");
					}}
					rows={current.type === "q8_opinion" ? 14 : current.type === "q6_7_email" ? 8 : 3}
					placeholder="Type your answer here..."
					autoFocus
				/>
				<div className="flex gap-2 justify-end" >
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
