#!/usr/bin/env tsx
/**
 * Build the diagnostic_v1 exam by selecting 30 medium-difficulty questions
 * from the existing pool, covering all TOEIC subskills present (Parts 3-7).
 * Parts 1 & 2 are excluded — they will join in diagnostic_v2 once #1 ships.
 *
 * Re-runnable: replaces diagnostic_v1's questions on each run.
 *
 * Run: cd apps/web && pnpm build:diagnostic
 */
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { toeicExam, toeicQuestion } from "@repo/database";
import { eq, and, sql } from "drizzle-orm";

const PART_QUOTAS: Record<number, number> = {
	3: 3,
	4: 3,
	5: 8,
	6: 4,
	7: 12,
};

function stableUuid(seed: string): string {
	const h = crypto.createHash("sha256").update(seed).digest("hex");
	return [
		h.slice(0, 8),
		h.slice(8, 12),
		"5" + h.slice(13, 16),
		((parseInt(h.slice(16, 18), 16) & 0x3f) | 0x80).toString(16) + h.slice(18, 20),
		h.slice(20, 32),
	].join("-");
}

async function main() {
	const examId = stableUuid("exam:diagnostic_v1");
	const partCounts: Record<string, number> = {};
	const totalTarget = Object.values(PART_QUOTAS).reduce((s, n) => s + n, 0);

	// Upsert exam
	await db
		.insert(toeicExam)
		.values({
			id: examId,
			code: "diagnostic_v1",
			title: "TOEIC Diagnostic v1 (30Q · 20m)",
			source: "synthetic",
			year: null,
			totalQuestions: totalTarget,
			partCounts: PART_QUOTAS as unknown as Record<string, number>,
			hasListening: true,
			hasReading: true,
		})
		.onConflictDoUpdate({
			target: toeicExam.code,
			set: { totalQuestions: totalTarget, updatedAt: new Date() },
		});

	// Remove existing diagnostic_v1 questions (cascade-safe via FK)
	await db.delete(toeicQuestion).where(eq(toeicQuestion.examId, examId));

	let number = 1;
	for (const [partStr, quota] of Object.entries(PART_QUOTAS)) {
		const part = parseInt(partStr, 10);

		// Prefer labeled questions; fall back to unlabeled if pool is too small
		let candidates = await db
			.select()
			.from(toeicQuestion)
			.where(
				and(
					eq(toeicQuestion.part, part),
					sql`jsonb_array_length(${toeicQuestion.skillIds}) > 0`,
				),
			)
			.orderBy(sql`random()`)
			.limit(quota * 4);

		if (candidates.length < quota) {
			const fallback = await db
				.select()
				.from(toeicQuestion)
				.where(eq(toeicQuestion.part, part))
				.orderBy(sql`random()`)
				.limit(quota * 4);
			candidates = candidates.concat(
				fallback.filter((c) => !candidates.some((x) => x.id === c.id)),
			);
		}

		// Distribute by subskill to maximize coverage
		const seenSkills = new Set<string>();
		const picked: typeof candidates = [];
		for (const c of candidates) {
			if (picked.length >= quota) break;
			const newSkill = c.skillIds.find((s) => !seenSkills.has(s));
			if (newSkill || picked.length < quota) {
				picked.push(c);
				c.skillIds.forEach((s) => seenSkills.add(s));
			}
		}
		// Top up if still short
		for (const c of candidates) {
			if (picked.length >= quota) break;
			if (!picked.includes(c)) picked.push(c);
		}

		for (const src of picked.slice(0, quota)) {
			const newId = stableUuid(`q:diagnostic_v1:${number}`);
			await db.insert(toeicQuestion).values({
				id: newId,
				examId,
				number,
				part: src.part,
				parentId: null, // flatten — diagnostic doesn't preserve groups
				questionText: src.questionText,
				passageText: src.passageText,
				options: src.options,
				correctIndex: src.correctIndex,
				audioUrl: src.audioUrl,
				imageUrls: src.imageUrls,
				topic: src.topic,
				skillIds: src.skillIds,
				difficulty: src.difficulty,
				explanationEn: src.explanationEn,
				explanationVi: src.explanationVi,
			});
			partCounts[partStr] = (partCounts[partStr] ?? 0) + 1;
			number++;
		}
	}

	console.log(`Built diagnostic_v1 with ${number - 1} questions:`, partCounts);
}

main()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
