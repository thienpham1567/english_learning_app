import Link from "next/link";
import { headers } from "next/headers";
import { Card, Tag, Empty } from "antd";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { toeicSpeakingSession, toeicSpeakingPrompt } from "@repo/database";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { requireToeicBaseline } from "@/lib/toeic/require-baseline";
import { Mic } from "lucide-react";

export default async function ToeicSpeakingPage() {
	await requireToeicBaseline();
	const session = await auth.api.getSession({ headers: await headers() });
	const userId = session!.user!.id;

	const promptCount = await db
		.select({ c: sql<number>`count(*)::int` })
		.from(toeicSpeakingPrompt);
	const setCount = await db
		.select({ c: sql<number>`count(distinct ${toeicSpeakingPrompt.setCode})::int` })
		.from(toeicSpeakingPrompt);

	const history = await db
		.select()
		.from(toeicSpeakingSession)
		.where(
			and(
				eq(toeicSpeakingSession.userId, userId),
				isNotNull(toeicSpeakingSession.completedAt),
			),
		)
		.orderBy(desc(toeicSpeakingSession.completedAt))
		.limit(10);

	const seeded = (promptCount[0]?.c ?? 0) >= 11;

	return (
		<div className="flex flex-col h-full h-[0px] flex-1 overflow-auto" >
			<div className="p-4 grid gap-4" >
				{seeded ? (
					<Link href="/toeic/speaking/runner" style={{ textDecoration: "none" }}>
						<Card hoverable>
							<div className="flex items-center gap-2" >
								<Mic className="text-3xl text-accent" />
								<strong className="text-lg text-ink" >Bắt đầu Speaking test</strong>
							</div>
							<div className="text-text-muted mt-1.5 text-[13px]" >
								Q1-2 đọc to · Q3-4 mô tả ảnh · Q5-7 trả lời câu hỏi · Q8-10 đọc context + trả lời · Q11 opinion
							</div>
							<div className="mt-2" >
								<Tag color="orange">Cần microphone permission</Tag>
								<Tag color="green">Whisper STT + Gemini grading</Tag>
							</div>
						</Card>
					</Link>
				) : (
					<Card>
						<Empty description="Chưa có prompt. Chạy `pnpm seed:toeic-speaking`" />
					</Card>
				)}

				<Card title="Lịch sử Speaking test" size="small">
					{history.length === 0 ? (
						<Empty description="Chưa có session nào" />
					) : (
						<div className="grid gap-2" >
							{history.map((h) => (
								<Link
									key={h.id}
									href={`/toeic/speaking/${h.id}/result`} className="text-ink rounded-lg flex justify-between border border-(--border)" style={{textDecoration: "none", padding: 10, background: "var(--surface-hover)"}} >
									<span>
										{new Date(h.completedAt!).toLocaleString("vi-VN")} · {h.setCode}
									</span>
									<span className="text-lg font-bold" >
										{h.scaledScore ?? "—"} / 200
									</span>
								</Link>
							))}
						</div>
					)}
				</Card>
			</div>
		</div>
	);
}
