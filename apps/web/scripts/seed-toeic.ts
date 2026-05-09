#!/usr/bin/env tsx
/**
 * Seed toeic_exam + toeic_question from data/toeic-exams.
 *
 * Source files:
 *   - index.json                  → exam list (8 ETS tests)
 *   - part5-enriched.json         → 240 Part 5 questions (with correctIndex + explanations)
 *   - multipart-enriched.json     → 1100 Part 3/4/6/7 questions (with correctIndex + explanations)
 *
 * Currently missing: Part 1 & Part 2 — added in sub-project #1.
 *
 * Idempotent: question ID is hash(examCode, number); re-running upserts.
 *
 * Run:  cd apps/web && pnpm seed:toeic
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { toeicExam, toeicQuestion } from "@repo/database";
import { sql } from "drizzle-orm";

const DATA_DIR = path.join(process.cwd(), "data/toeic-exams");

type IndexFile = {
	source: string;
	scraped_at: string;
	exams: Array<{ id: string; name: string; book: string; file: string }>;
};

type EnrichedPart5Question = {
	id: string;
	examName: string;
	examId: string;
	number: number;
	stem: string;
	options: string[];
	correctIndex: number;
	explanationEn: string;
	explanationVi: string;
	grammarTopic?: string;
};

type EnrichedMultipartQuestion = {
	id: string;
	examName: string;
	examId: string;
	part: string;
	number: number;
	content: string;
	options: string[];
	correctIndex: number;
	explanationEn: string;
	explanationVi: string;
	topic?: string;
	audio: string | null;
	images: { image_path: string }[] | null;
	parentId?: string | null;
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

/** Convert "Test 1 ETS 2021" → "ets_2021_test_1" */
function nameToCode(name: string): string {
	const m = name.match(/Test\s+(\d+)\s+ETS\s+(\d+)/i);
	if (!m) throw new Error(`Cannot derive code from exam name: ${name}`);
	return `ets_${m[2]}_test_${m[1]}`;
}

function nameToYear(name: string): number {
	const m = name.match(/ETS\s+(\d+)/i);
	return m ? parseInt(m[1], 10) : 0;
}

async function seed() {
	// 1. Load index.json → seed exams
	const indexFile = JSON.parse(
		fs.readFileSync(path.join(DATA_DIR, "index.json"), "utf-8"),
	) as IndexFile;

	console.log(`Found ${indexFile.exams.length} exams in index.json`);

	const examCodeToId = new Map<string, string>();
	const examNameToCode = new Map<string, string>();

	// Pre-compute part counts from enriched files
	const part5 = JSON.parse(
		fs.readFileSync(path.join(DATA_DIR, "part5-enriched.json"), "utf-8"),
	) as { questions: EnrichedPart5Question[] };
	const multipart = JSON.parse(
		fs.readFileSync(path.join(DATA_DIR, "multipart-enriched.json"), "utf-8"),
	) as { questions: EnrichedMultipartQuestion[] };

	const partCountsByExam = new Map<string, Record<string, number>>();
	for (const q of part5.questions) {
		const c = partCountsByExam.get(q.examName) ?? {};
		c["5"] = (c["5"] ?? 0) + 1;
		partCountsByExam.set(q.examName, c);
	}
	for (const q of multipart.questions) {
		const c = partCountsByExam.get(q.examName) ?? {};
		c[q.part] = (c[q.part] ?? 0) + 1;
		partCountsByExam.set(q.examName, c);
	}

	// 2. Upsert exams
	for (const exam of indexFile.exams) {
		const code = nameToCode(exam.name);
		const examId = stableUuid(`exam:${code}`);
		const partCounts = partCountsByExam.get(exam.name) ?? {};
		const totalQuestions = Object.values(partCounts).reduce((s, n) => s + n, 0);
		const partKeys = Object.keys(partCounts).map((k) => parseInt(k, 10));

		await db
			.insert(toeicExam)
			.values({
				id: examId,
				code,
				title: exam.name,
				source: "ETS",
				year: nameToYear(exam.name),
				totalQuestions,
				partCounts,
				hasListening: partKeys.some((p) => p <= 4),
				hasReading: partKeys.some((p) => p >= 5),
			})
			.onConflictDoUpdate({
				target: toeicExam.code,
				set: {
					title: exam.name,
					totalQuestions,
					partCounts,
					updatedAt: new Date(),
				},
			});

		examCodeToId.set(code, examId);
		examNameToCode.set(exam.name, code);
	}

	console.log(`Seeded ${examCodeToId.size} exams`);

	// 3. Upsert Part 5 questions
	let p5Count = 0;
	let p5Skipped = 0;
	for (const q of part5.questions) {
		if (q.correctIndex === null || q.correctIndex === undefined) {
			p5Skipped++;
			continue;
		}
		const code = examNameToCode.get(q.examName);
		if (!code) {
			console.warn(`Skipping Part 5 question with unknown exam: ${q.examName}`);
			continue;
		}
		const examId = examCodeToId.get(code)!;
		const qid = stableUuid(`q:${code}:${q.number}`);

		await db
			.insert(toeicQuestion)
			.values({
				id: qid,
				examId,
				number: q.number,
				part: 5,
				parentId: null,
				questionText: q.stem,
				options: q.options,
				correctIndex: q.correctIndex,
				audioUrl: null,
				imageUrls: null,
				topic: q.grammarTopic ?? null,
				explanationEn: q.explanationEn,
				explanationVi: q.explanationVi,
				skillIds: [],
				difficulty: "intermediate",
			})
			.onConflictDoNothing();
		p5Count++;
	}
	console.log(`Seeded ${p5Count} Part 5 questions (${p5Skipped} skipped — null correctIndex)`);

	// 4. Upsert multipart (Part 3/4/6/7) questions
	let mpCount = 0;
	let mpSkipped = 0;
	for (const q of multipart.questions) {
		if (q.correctIndex === null || q.correctIndex === undefined) {
			mpSkipped++;
			continue;
		}
		const code = examNameToCode.get(q.examName);
		if (!code) {
			console.warn(`Skipping multipart question with unknown exam: ${q.examName}`);
			continue;
		}
		const examId = examCodeToId.get(code)!;
		const qid = stableUuid(`q:${code}:${q.number}`);
		const parentId = q.parentId ? stableUuid(`parent:${code}:${q.parentId}`) : null;

		await db
			.insert(toeicQuestion)
			.values({
				id: qid,
				examId,
				number: q.number,
				part: parseInt(q.part, 10),
				parentId,
				questionText: q.content,
				options: q.options,
				correctIndex: q.correctIndex,
				audioUrl: q.audio,
				imageUrls: q.images?.map((i) => i.image_path) ?? null,
				topic: q.topic ?? null,
				explanationEn: q.explanationEn,
				explanationVi: q.explanationVi,
				skillIds: [],
				difficulty: "intermediate",
			})
			.onConflictDoNothing();
		mpCount++;
	}
	console.log(`Seeded ${mpCount} multipart questions (${mpSkipped} skipped — null correctIndex)`);

	// 5. Summary
	const totalRows = await db.select({ c: sql<number>`count(*)::int` }).from(toeicQuestion);
	console.log(`\nTotal questions in DB: ${totalRows[0]?.c}`);

	const byPart = await db
		.select({ part: toeicQuestion.part, c: sql<number>`count(*)::int` })
		.from(toeicQuestion)
		.groupBy(toeicQuestion.part);
	console.log("By part:", Object.fromEntries(byPart.map((r) => [r.part, r.c])));
}

seed()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
