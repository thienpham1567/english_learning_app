#!/usr/bin/env tsx
/**
 * Seed 5 sets × 11 = 55 TOEIC Speaking prompts.
 *
 * Per set:
 *   Q1-2: read aloud (text)
 *   Q3-4: describe picture (Pexels image, reuse Part 1 IDs)
 *   Q5-7: respond to questions (text)
 *   Q8-10: respond using info (context + question)
 *   Q11: opinion topic
 *
 * Run: cd apps/web && pnpm seed:toeic-speaking
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { toeicSpeakingPrompt } from "@repo/database";
import { openAiClient } from "@/lib/openai/client";

const MODEL = process.env.OPENAI_CHAT_MODEL ?? "google/gemini-2.5-flash";
const DATA_DIR = path.join(process.cwd(), "data/toeic-speaking");
const CACHE_FILE = path.join(DATA_DIR, "sets.json");
const PHOTOS_FILE = path.join(process.cwd(), "data/toeic-part1/photos.json");

const SETS_COUNT = 5;
const TIMING = {
	q1_2_read_aloud: { prepSeconds: 45, speakSeconds: 45, maxScore: 3 },
	q3_4_describe_picture: { prepSeconds: 45, speakSeconds: 30, maxScore: 3 },
	q5_7_respond_question: { prepSeconds: 0, speakSeconds: 30, maxScore: 3 },
	q8_10_respond_info: { prepSeconds: 30, speakSeconds: 30, maxScore: 3 },
	q11_opinion: { prepSeconds: 30, speakSeconds: 60, maxScore: 5 },
};

type GeneratedSet = {
	readAloud: string[]; // 2
	describePicturePexelsIds: string[]; // 2 photo IDs
	respondQuestion: string[]; // 3 questions for Q5-7
	respondInfo: Array<{ context: string; questions: string[] }>; // 1 context + 3 questions for Q8-10
	opinion: { topic: string; topicVi: string };
};

function pexelsUrl(id: string, w = 800): string {
	return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
}

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

async function generateSet(setIndex: number, photoIds: string[]): Promise<GeneratedSet | null> {
	const picIds = photoIds.slice(setIndex * 2, setIndex * 2 + 2);
	const prompt = `Generate 1 set of TOEIC Speaking test content. Output strict JSON.

Set ${setIndex + 1}.

readAloud (2): two short business announcements/passages (40-60 words each) suitable for read-aloud TOEIC tasks. Topics: voicemail/announcement/instruction.

describePicturePexelsIds (2): use exactly these Pexels IDs as-is: ${JSON.stringify(picIds)}.

respondQuestion (3): three TOEIC-style "respond to questions" prompts. Imagine the user is asked these questions in a casual workplace survey. Each is 1 simple question.

respondInfo (1): one context (an itinerary, agenda, schedule, or short email — 50-80 words) plus three questions about that context. Q1 is detail, Q2 is detail, Q3 asks for prediction/clarification.

opinion (1): one TOEIC-style opinion question + Vietnamese version.

Output strict JSON:
{
  "readAloud": ["...", "..."],
  "describePicturePexelsIds": ${JSON.stringify(picIds)},
  "respondQuestion": ["...", "...", "..."],
  "respondInfo": [{"context": "...", "questions": ["...", "...", "..."]}],
  "opinion": {"topic": "...", "topicVi": "..."}
}`;

	for (let attempt = 0; attempt < 3; attempt++) {
		try {
			const res = await openAiClient.chat.completions.create({
				model: MODEL,
				messages: [{ role: "user", content: prompt }],
				response_format: { type: "json_object" },
				temperature: 0.5,
				max_tokens: 4000,
			});
			const raw = res.choices[0]?.message.content ?? "{}";
			const parsed = JSON.parse(raw);
			if (
				Array.isArray(parsed.readAloud) &&
				parsed.readAloud.length >= 2 &&
				Array.isArray(parsed.respondQuestion) &&
				parsed.respondQuestion.length >= 3 &&
				Array.isArray(parsed.respondInfo) &&
				parsed.respondInfo.length >= 1 &&
				parsed.opinion?.topic
			) {
				return parsed;
			}
			console.warn(`  set ${setIndex + 1}: invalid shape, retry ${attempt + 1}/3`);
		} catch (err) {
			console.warn(
				`  set ${setIndex + 1}: parse error, retry ${attempt + 1}/3 — ${err instanceof Error ? err.message.slice(0, 80) : err}`,
			);
		}
	}
	return null;
}

async function loadSets(photoIds: string[]): Promise<GeneratedSet[]> {
	if (fs.existsSync(CACHE_FILE)) {
		const cached = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8")) as GeneratedSet[];
		if (cached.length >= SETS_COUNT) {
			console.log(`Loading ${cached.length} sets from cache`);
			return cached;
		}
	}
	console.log(`Generating ${SETS_COUNT} sets via Gemini...`);
	const sets: GeneratedSet[] = [];
	if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
	for (let i = 0; i < SETS_COUNT; i++) {
		console.log(`  set ${i + 1}/${SETS_COUNT}...`);
		const s = await generateSet(i, photoIds);
		if (s) {
			sets.push(s);
			fs.writeFileSync(CACHE_FILE, JSON.stringify(sets, null, 2));
		} else {
			console.warn(`  set ${i + 1} skipped`);
		}
	}
	console.log(`Cached ${sets.length}/${SETS_COUNT} sets to ${CACHE_FILE}`);
	return sets;
}

async function seed() {
	const photos = JSON.parse(fs.readFileSync(PHOTOS_FILE, "utf-8")) as {
		photos: Array<{ id: string }>;
	};
	const photoIds = photos.photos.map((p) => p.id);

	const sets = await loadSets(photoIds);

	let inserted = 0;
	for (let i = 0; i < sets.length; i++) {
		const set = sets[i];
		const setCode = `set_${i + 1}`;
		let qNum = 1;

		// Q1-2
		for (const text of set.readAloud.slice(0, 2)) {
			const id = stableUuid(`speaking:${setCode}:q${qNum}`);
			await db
				.insert(toeicSpeakingPrompt)
				.values({
					id,
					setCode,
					questionNumber: qNum,
					type: "q1_2_read_aloud",
					textToRead: text,
					prepSeconds: TIMING.q1_2_read_aloud.prepSeconds,
					speakSeconds: TIMING.q1_2_read_aloud.speakSeconds,
					maxScore: TIMING.q1_2_read_aloud.maxScore,
				})
				.onConflictDoNothing();
			inserted++;
			qNum++;
		}

		// Q3-4
		for (const pid of set.describePicturePexelsIds.slice(0, 2)) {
			const id = stableUuid(`speaking:${setCode}:q${qNum}`);
			await db
				.insert(toeicSpeakingPrompt)
				.values({
					id,
					setCode,
					questionNumber: qNum,
					type: "q3_4_describe_picture",
					imageUrl: pexelsUrl(pid),
					prepSeconds: TIMING.q3_4_describe_picture.prepSeconds,
					speakSeconds: TIMING.q3_4_describe_picture.speakSeconds,
					maxScore: TIMING.q3_4_describe_picture.maxScore,
				})
				.onConflictDoNothing();
			inserted++;
			qNum++;
		}

		// Q5-7
		for (const q of set.respondQuestion.slice(0, 3)) {
			const id = stableUuid(`speaking:${setCode}:q${qNum}`);
			await db
				.insert(toeicSpeakingPrompt)
				.values({
					id,
					setCode,
					questionNumber: qNum,
					type: "q5_7_respond_question",
					questionText: q,
					prepSeconds: TIMING.q5_7_respond_question.prepSeconds,
					speakSeconds: TIMING.q5_7_respond_question.speakSeconds,
					maxScore: TIMING.q5_7_respond_question.maxScore,
				})
				.onConflictDoNothing();
			inserted++;
			qNum++;
		}

		// Q8-10
		const info = set.respondInfo[0];
		if (info) {
			for (const q of info.questions.slice(0, 3)) {
				const id = stableUuid(`speaking:${setCode}:q${qNum}`);
				await db
					.insert(toeicSpeakingPrompt)
					.values({
						id,
						setCode,
						questionNumber: qNum,
						type: "q8_10_respond_info",
						contextText: info.context,
						questionText: q,
						prepSeconds: TIMING.q8_10_respond_info.prepSeconds,
						speakSeconds: TIMING.q8_10_respond_info.speakSeconds,
						maxScore: TIMING.q8_10_respond_info.maxScore,
					})
					.onConflictDoNothing();
				inserted++;
				qNum++;
			}
		}

		// Q11
		{
			const id = stableUuid(`speaking:${setCode}:q${qNum}`);
			await db
				.insert(toeicSpeakingPrompt)
				.values({
					id,
					setCode,
					questionNumber: qNum,
					type: "q11_opinion",
					topic: set.opinion.topic,
					topicVi: set.opinion.topicVi,
					prepSeconds: TIMING.q11_opinion.prepSeconds,
					speakSeconds: TIMING.q11_opinion.speakSeconds,
					maxScore: TIMING.q11_opinion.maxScore,
				})
				.onConflictDoNothing();
			inserted++;
		}
	}

	console.log(`\nSeeded ${inserted} speaking prompts across ${sets.length} sets`);
}

seed()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
