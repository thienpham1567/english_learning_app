import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Card, Tag, Empty } from "antd";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import {
	toeicSpeakingSession,
	toeicSpeakingResponse,
	toeicSpeakingPrompt,
} from "@repo/database";
import { and, asc, eq, inArray } from "drizzle-orm";
import { Mic } from "lucide-react";

const TYPE_LABEL: Record<string, string> = {
	q1_2_read_aloud: "Read aloud",
	q3_4_describe_picture: "Describe picture",
	q5_7_respond_question: "Respond to question",
	q8_10_respond_info: "Respond using info",
	q11_opinion: "Opinion",
};

type PronMetrics = {
	wpm: number;
	fillerCount: number;
	fillerRate: number;
	longPauseCount: number;
	avgConfidence: number;
	lowConfidenceWords: string[];
	alignment?: {
		expectedWords: number;
		spokenWords: number;
		matchedWords: number;
		missingWords: string[];
		addedWords: string[];
		accuracy: number;
	};
};

function PronunciationSection({ metrics }: { metrics: PronMetrics }) {
	const wpmOk = metrics.wpm >= 110 && metrics.wpm <= 175;
	return (
		<div className="bg-(--surface) p-3 rounded-md mt-2" >
			<div className="font-semibold mb-1.5" >📊 Phát âm</div>
			<div className="grid gap-2 text-[13px]" style={{gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))"}} >
				<div>
					Pace: <strong>{metrics.wpm} WPM</strong> {wpmOk ? "✓" : "⚠"}
				</div>
				<div>
					Filler: <strong>{metrics.fillerCount}</strong>
					{metrics.fillerRate > 0 ? ` (${metrics.fillerRate}/phút)` : ""}
				</div>
				<div>
					Pause dài: <strong>{metrics.longPauseCount}</strong>
				</div>
				<div>
					Confidence: <strong>{metrics.avgConfidence.toFixed(2)}</strong>
				</div>
			</div>
			{metrics.lowConfidenceWords.length > 0 && (
				<div className="mt-2 text-[13px]" >
					<span className="text-text-muted" >Từ phát âm không rõ: </span>
					{metrics.lowConfidenceWords.map((w) => (
						<Tag key={w} color="orange" style={{ margin: "2px 4px 2px 0" }}>
							{w}
						</Tag>
					))}
				</div>
			)}
			{metrics.alignment && (
				<div className="mt-2 text-[13px]" >
					<div>
						Accuracy:{" "}
						<strong>
							{Math.round(metrics.alignment.accuracy * 100)}% (
							{metrics.alignment.matchedWords}/{metrics.alignment.expectedWords} từ)
						</strong>
					</div>
					{metrics.alignment.missingWords.length > 0 && (
						<div className="mt-1" >
							<span className="text-text-muted" >Bỏ qua: </span>
							{metrics.alignment.missingWords.slice(0, 8).map((w) => (
								<Tag key={w} color="red" style={{ margin: "2px 4px 2px 0" }}>
									{w}
								</Tag>
							))}
						</div>
					)}
					{metrics.alignment.addedWords.length > 0 && (
						<div className="mt-1" >
							<span className="text-text-muted" >Thêm: </span>
							{metrics.alignment.addedWords.slice(0, 8).map((w) => (
								<Tag key={w} color="purple" style={{ margin: "2px 4px 2px 0" }}>
									{w}
								</Tag>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export default async function SpeakingResultPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) notFound();

	const [s] = await db
		.select()
		.from(toeicSpeakingSession)
		.where(
			and(eq(toeicSpeakingSession.id, id), eq(toeicSpeakingSession.userId, session.user.id)),
		)
		.limit(1);
	if (!s) notFound();

	const responses = await db
		.select()
		.from(toeicSpeakingResponse)
		.where(eq(toeicSpeakingResponse.sessionId, id));
	const promptIds = responses.map((r) => r.promptId);
	const prompts = promptIds.length
		? await db
				.select()
				.from(toeicSpeakingPrompt)
				.where(inArray(toeicSpeakingPrompt.id, promptIds))
				.orderBy(asc(toeicSpeakingPrompt.questionNumber))
		: [];

	return (
		<div className="flex flex-col h-full h-[0px] flex-1 overflow-auto" >
			<div className="p-4 grid gap-4 w-[800px]" >
				<Card>
					<div className="text-center" >
						<div className="font-extrabold text-accent" style={{fontSize: 56}} >
							{s.scaledScore ?? "—"}
						</div>
						<div className="text-text-muted" >/ 200 (TOEIC Speaking)</div>
						<div className="mt-1.5 text-text-muted" >
							Raw: {s.rawScore ?? "—"} / 35
						</div>
					</div>
				</Card>

				{prompts
					.sort((a, b) => a.questionNumber - b.questionNumber)
					.map((p) => {
						const r = responses.find((x) => x.promptId === p.id);
						return (
							<Card
								key={p.id}
								size="small"
								title={`Q${p.questionNumber} · ${TYPE_LABEL[p.type] ?? p.type}`}
								extra={
									<Tag color="blue">
										{r?.rawScore ?? 0} / {p.maxScore}
									</Tag>
								}
							>
								{p.imageUrl && (
									<img loading="lazy" decoding="async"
										src={p.imageUrl}
										alt="" className="w-[200px] rounded mb-2" />
								)}
								{r ? (
									<>
										{r.audioPath && (
											<audio controls className="w-full mb-2" >
												<source
													src={`/api/toeic-speaking/audio/${r.id}`}
													type="audio/webm"
												/>
											</audio>
										)}
										<div className="bg-(--surface) rounded-md italic mb-2 text-sm" style={{padding: 10}} >
											{r.transcript ? `“${r.transcript}”` : <em className="text-text-muted" >(no transcript)</em>}
										</div>
										{r.feedbackVi && (
											<div className="text-[13px] text-text-muted" style={{borderLeft: "3px solid var(--accent)", paddingLeft: 10}} >
												<strong>Feedback:</strong> {r.feedbackVi}
											</div>
										)}
										{(() => {
											const pron = (r.rubricScores as { pronunciation?: PronMetrics } | null)
												?.pronunciation;
											return pron ? <PronunciationSection metrics={pron} /> : null;
										})()}
									</>
								) : (
									<Empty description="No response" />
								)}
							</Card>
						);
					})}

				<div className="flex gap-2" >
					<Link
						href="/toeic/speaking" className="py-2 px-4 rounded-lg text-ink border border-(--border)" style={{background: "var(--surface-hover)", textDecoration: "none"}} >
						Về Hub
					</Link>
				</div>
			</div>
		</div>
	);
}
