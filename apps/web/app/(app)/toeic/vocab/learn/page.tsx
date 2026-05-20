"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ReadOutlined } from "@ant-design/icons";
import { Button, Card, Tag, Progress } from "antd";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { api } from "@/lib/api-client";

type VocabWord = {
	id: string;
	word: string;
	pos: string;
	ipa: string | null;
	meaningEn: string;
	meaningVi: string;
	exampleEn: string | null;
	exampleVi: string | null;
	topic: string;
	level: string;
};

type Progress = {
	status: string;
	dueAt: string;
	attemptCount: number;
	easeFactor: number;
};

function LearnRunner() {
	const router = useRouter();
	const params = useSearchParams();
	const pack = params.get("pack");
	const mode = (params.get("mode") ?? "new") as "new" | "review";

	const [words, setWords] = useState<VocabWord[]>([]);
	const [progress, setProgress] = useState<Record<string, Progress>>({});
	const [idx, setIdx] = useState(0);
	const [revealed, setRevealed] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [done, setDone] = useState(false);
	const [stats, setStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 });
	const startTime = useRef<number>(Date.now());

	useEffect(() => {
		const load = async () => {
			if (mode === "review") {
				const r = await api.get<{ words: VocabWord[] }>("/toeic-vocab/due");
				setWords(r.words.slice(0, 20));
			} else if (pack) {
				const r = await api.get<{ words: VocabWord[]; progress: Record<string, Progress> }>(
					`/toeic-vocab/pack/${encodeURIComponent(pack)}`,
				);
				setProgress(r.progress);
				const newWords = r.words.filter((w) => !r.progress[w.id]);
				setWords(newWords.slice(0, 15));
			}
			startTime.current = Date.now();
		};
		void load();
	}, [pack, mode]);

	const current = words[idx];
	const total = words.length;

	const submit = async (outcome: "again" | "hard" | "good" | "easy") => {
		if (!current || submitting) return;
		setSubmitting(true);
		try {
			await api.post("/toeic-vocab/review", {
				wordId: current.id,
				outcome,
				durationMs: Date.now() - startTime.current,
			});
			setStats((s) => ({ ...s, [outcome]: s[outcome] + 1 }));
		} catch (e) {
			console.warn("vocab review failed", e);
		}
		setSubmitting(false);
		if (idx + 1 >= words.length) {
			setDone(true);
		} else {
			setIdx(idx + 1);
			setRevealed(false);
			startTime.current = Date.now();
		}
	};

	if (words.length === 0) {
		return <div style={{ padding: 24 }}>Đang tải từ vựng… (hoặc pack rỗng)</div>;
	}
	if (done) {
		return (
			<Card>
				<div style={{ fontSize: 28, fontWeight: 700 }}>Hoàn thành!</div>
				<div style={{ marginTop: 8 }}>
					<Tag color="red">Again: {stats.again}</Tag>
					<Tag color="orange">Hard: {stats.hard}</Tag>
					<Tag color="green">Good: {stats.good}</Tag>
					<Tag color="blue">Easy: {stats.easy}</Tag>
				</div>
				<Button type="primary" style={{ marginTop: 16 }} onClick={() => router.push("/toeic/vocab")}>
					Về Vocab Hub
				</Button>
			</Card>
		);
	}
	if (!current) return null;

	return (
		<div style={{ display: "grid", gap: 12, maxWidth: 600 }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					color: "var(--text-muted, #94a3b8)",
					fontSize: 14,
				}}
			>
				<span>
					Từ {idx + 1} / {total}
				</span>
				<Tag>{current.topic}</Tag>
			</div>
			<Progress percent={Math.round((idx / total) * 100)} showInfo={false} size="small" />

			<Card>
				<div style={{ textAlign: "center" }}>
					<div style={{ fontSize: 32, fontWeight: 700 }}>{current.word}</div>
					{current.ipa && (
						<div style={{ color: "var(--text-muted, #94a3b8)", marginTop: 4 }}>
							{current.ipa} <Tag>{current.pos}</Tag>
						</div>
					)}
				</div>

				{!revealed ? (
					<div style={{ textAlign: "center", marginTop: 24 }}>
						<Button type="primary" size="large" onClick={() => setRevealed(true)}>
							Hiện nghĩa
						</Button>
					</div>
				) : (
					<div style={{ marginTop: 16 }}>
						<div style={{ fontSize: 18, fontWeight: 500 }}>{current.meaningVi}</div>
						<div style={{ color: "var(--text-muted, #94a3b8)", marginTop: 4 }}>
							{current.meaningEn}
						</div>
						{current.exampleEn && (
							<div
								style={{
									marginTop: 12,
									padding: 12,
									background: "var(--surface, #0f172a)",
									borderRadius: 8,
								}}
							>
								<div style={{ fontStyle: "italic" }}>{current.exampleEn}</div>
								{current.exampleVi && (
									<div style={{ color: "var(--text-muted, #94a3b8)", fontSize: 13, marginTop: 4 }}>
										{current.exampleVi}
									</div>
								)}
							</div>
						)}
						<div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 16 }}>
							<Button danger disabled={submitting} onClick={() => submit("again")}>
								Again
							</Button>
							<Button disabled={submitting} onClick={() => submit("hard")}>
								Hard
							</Button>
							<Button type="primary" disabled={submitting} onClick={() => submit("good")}>
								Good
							</Button>
							<Button disabled={submitting} onClick={() => submit("easy")}>
								Easy
							</Button>
						</div>
					</div>
				)}
			</Card>
		</div>
	);
}

export default function VocabLearnPage() {
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
				icon={<ReadOutlined />}
				gradient="var(--gradient-vocab)"
				title="Học từ vựng"
				subtitle="Flashcard · SRS"
			/>
			<div style={{ padding: 16, flex: 1 }}>
				<Suspense fallback={<div>Loading…</div>}>
					<LearnRunner />
				</Suspense>
			</div>
		</div>
	);
}
