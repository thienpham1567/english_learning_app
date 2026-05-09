#!/usr/bin/env tsx
/**
 * Seed 25 TOEIC Part 2 (Question-Response) items.
 *
 * Pipeline:
 *   1. Gemini: generate 25 items (prompt + 3 responses + correct + explanation + skill)
 *      → cached to data/toeic-part2/items.json
 *   2. Groq TTS: generate 4 audio clips per item (Q + 3 R), rotate 3 voices
 *      → apps/web/public/toeic/audio/part2/<id>_{q,a,b,c}.wav
 *   3. Insert toeic_question rows with audioSegments populated
 *
 * Idempotent: caches Gemini output JSON and skips TTS calls for files already on disk.
 *
 * Run:  cd apps/web && pnpm seed:toeic-part2
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { toeicExam, toeicQuestion } from "@repo/database";
import { eq } from "drizzle-orm";
import { openAiClient } from "@/lib/openai/client";
import { synthesizeToFile, pickVoice, VOICES } from "@/lib/toeic/tts";

const MODEL = process.env.OPENAI_CHAT_MODEL ?? "google/gemini-2.5-flash";
const DATA_DIR = path.join(process.cwd(), "data/toeic-part2");
const AUDIO_DIR = path.join(process.cwd(), "public/toeic/audio/part2");
const CACHE_FILE = path.join(DATA_DIR, "items.json");

type Item = {
	promptType: "wh_question" | "yn_question" | "statement";
	promptText: string;
	options: string[];
	correctIndex: number;
	explanationVi: string;
	skillIds: string[];
	difficulty: "beginner" | "intermediate" | "advanced";
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

async function generateItems(): Promise<Item[]> {
	if (fs.existsSync(CACHE_FILE)) {
		console.log(`Loading cached items from ${CACHE_FILE}`);
		return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
	}

	console.log("Generating 25 Part 2 items via Gemini...");
	const prompt = `Generate 25 TOEIC Part 2 (Question-Response) items.

Each item must have:
- promptType: "wh_question" | "yn_question" | "statement"
- promptText: short prompt (max 12 words, business/office context)
- options: array of EXACTLY 3 short responses (max 10 words each); only ONE is the natural correct reply, the other two are distractors
- correctIndex: 0, 1, or 2
- explanationVi: Vietnamese explanation of why the correct option is right and why the others are not
- skillIds: array containing exactly one of "toeic.part2.wh_question" | "toeic.part2.yn_question" | "toeic.part2.statement" (matching promptType)
- difficulty: "beginner" | "intermediate" | "advanced"

Distribute promptType: 12 wh_question, 7 yn_question, 6 statement.
Distribute difficulty: 10 beginner, 10 intermediate, 5 advanced.
No duplicate promptText.

Return ONLY strict JSON: {"items": [...]}`;

	const res = await openAiClient.chat.completions.create({
		model: MODEL,
		messages: [{ role: "user", content: prompt }],
		response_format: { type: "json_object" },
		temperature: 0.4,
	});
	const raw = res.choices[0]?.message.content ?? "{}";
	const parsed = JSON.parse(raw);
	const items: Item[] = parsed.items ?? [];
	if (items.length === 0) throw new Error("Gemini returned 0 items");

	if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
	fs.writeFileSync(CACHE_FILE, JSON.stringify(items, null, 2));
	console.log(`Cached ${items.length} items to ${CACHE_FILE}`);
	return items;
}

async function ttsSafe(text: string, voice: ReturnType<typeof pickVoice>, outputPath: string): Promise<void> {
	if (fs.existsSync(outputPath)) return; // idempotent: skip if already generated
	try {
		await synthesizeToFile({ text, voice, outputPath });
		// Pace requests to stay under Groq free rate limits (~30/min)
		await new Promise((r) => setTimeout(r, 2200));
	} catch (err) {
		console.error(`  TTS failed for ${path.basename(outputPath)}:`, err instanceof Error ? err.message : err);
		throw err;
	}
}

async function seed() {
	const items = await generateItems();

	// Find or create the synthetic Part 2 exam container
	const examId = stableUuid("exam:toeic_part2_v1");
	await db
		.insert(toeicExam)
		.values({
			id: examId,
			code: "toeic_part2_v1",
			title: "TOEIC Part 2 Pack v1 (synthetic)",
			source: "synthetic",
			year: null,
			totalQuestions: items.length,
			partCounts: { "2": items.length },
			hasListening: true,
			hasReading: false,
		})
		.onConflictDoUpdate({
			target: toeicExam.code,
			set: { totalQuestions: items.length, updatedAt: new Date() },
		});

	if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

	let inserted = 0;
	let ttsCalls = 0;
	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		const number = 31 + i; // Real TOEIC Part 2 numbering 7-31; we use 31..55 to avoid clash
		const qid = stableUuid(`q:toeic_part2_v1:${number}`);
		const baseFile = path.join(AUDIO_DIR, qid);

		// Voice rotation: Q uses voice[0], options use voice[1..3]
		const voiceQ = pickVoice(i);
		const voiceA = VOICES[(i + 1) % VOICES.length];
		const voiceB = VOICES[(i + 2) % VOICES.length];
		const voiceC = VOICES[(i + 3) % VOICES.length];

		console.log(`  [${i + 1}/${items.length}] ${item.promptText.slice(0, 60)}...`);

		// Generate 4 audio clips
		await ttsSafe(item.promptText, voiceQ, `${baseFile}_q.wav`);
		ttsCalls++;
		for (let j = 0; j < 3; j++) {
			const v = [voiceA, voiceB, voiceC][j];
			const role = ["a", "b", "c"][j];
			await ttsSafe(item.options[j] ?? "", v, `${baseFile}_${role}.wav`);
			ttsCalls++;
		}

		// Insert question row
		await db
			.insert(toeicQuestion)
			.values({
				id: qid,
				examId,
				number,
				part: 2,
				parentId: null,
				questionText: null, // Part 2 is audio-only; text not shown to user
				passageText: null,
				options: ["A", "B", "C"], // labels only; text in explanation
				correctIndex: item.correctIndex,
				audioUrl: null,
				audioSegments: {
					question: `/toeic/audio/part2/${qid}_q.wav`,
					options: [
						`/toeic/audio/part2/${qid}_a.wav`,
						`/toeic/audio/part2/${qid}_b.wav`,
						`/toeic/audio/part2/${qid}_c.wav`,
					],
				},
				imageUrls: null,
				topic: item.promptType,
				skillIds: item.skillIds,
				difficulty: item.difficulty,
				explanationEn: null,
				explanationVi: item.explanationVi,
			})
			.onConflictDoUpdate({
				target: [toeicQuestion.examId, toeicQuestion.number],
				set: {
					correctIndex: item.correctIndex,
					audioSegments: {
						question: `/toeic/audio/part2/${qid}_q.wav`,
						options: [
							`/toeic/audio/part2/${qid}_a.wav`,
							`/toeic/audio/part2/${qid}_b.wav`,
							`/toeic/audio/part2/${qid}_c.wav`,
						],
					},
					skillIds: item.skillIds,
					explanationVi: item.explanationVi,
					updatedAt: new Date(),
				},
			});
		inserted++;
	}

	console.log(`\nSeeded ${inserted} Part 2 questions, ${ttsCalls} TTS calls (counts include skipped existing files)`);
}

seed()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
