#!/usr/bin/env tsx
/**
 * Seed 5 sets × 8 prompts = 40 TOEIC Writing prompts.
 *
 * Pipeline:
 *   1. Gemini generates per-set: 5 picture prompts (with mandatory words),
 *      2 email scenarios, 1 opinion topic.
 *   2. Pictures use the same Pexels photo IDs as Part 1 (variety per set).
 *   3. Cache to data/toeic-writing/sets.json; idempotent re-run.
 *
 * Run: cd apps/web && pnpm seed:toeic-writing
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { toeicWritingPrompt } from "@repo/database";
import { openAiClient } from "@/lib/openai/client";

const MODEL = process.env.OPENAI_CHAT_MODEL ?? "google/gemini-2.5-flash";
const DATA_DIR = path.join(process.cwd(), "data/toeic-writing");
const CACHE_FILE = path.join(DATA_DIR, "sets.json");
const PHOTOS_FILE = path.join(process.cwd(), "data/toeic-part1/photos.json");

const SETS_COUNT = 5;
const TIMING = {
	q1_5_picture: { prepSeconds: 0, writeSeconds: 96, maxScore: 3 }, // ~96s/each (8 min for 5)
	q6_7_email: { prepSeconds: 0, writeSeconds: 600, maxScore: 4 }, // 10 min each
	q8_opinion: { prepSeconds: 0, writeSeconds: 1800, maxScore: 5 }, // 30 min
};

type GeneratedSet = {
	pictures: Array<{ pexelsId: string; mandatoryWords: [string, string]; topicVi: string }>;
	emails: Array<{
		subject: string;
		body: string;
		requirements: string[];
		topicVi: string;
	}>;
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
	const photoIdList = photoIds.slice(setIndex * 5, setIndex * 5 + 5);
	const prompt = `Generate 1 set of TOEIC Writing test content. Output strict JSON.

Set ${setIndex + 1}.

Picture prompts (5): for each of these Pexels photo IDs ${JSON.stringify(photoIdList)}, choose 2 mandatory words that a test-taker must use in a single sentence describing the photo. Words should be a noun + verb OR adjective + noun OR similar TOEIC-style pairs. Vary words across the 5.

Email scenarios (2): each is a short business email (subject + 2-3 sentence body) that requires a reply. Specify EXACTLY 2-3 requirements the reply must address (e.g. "Apologize for the delay", "Ask 2 specific questions", "Propose a new date"). Keep TOEIC business tone.

Opinion topic (1): a TOEIC-style opinion question (e.g. "Some people prefer X. Others prefer Y. Which do you prefer? Why?"). Provide a Vietnamese version.

Output strict JSON:
{
  "pictures": [
    {"pexelsId": "${photoIdList[0]}", "mandatoryWords": ["...", "..."], "topicVi": "..."},
    ...5 total
  ],
  "emails": [
    {"subject": "...", "body": "...", "requirements": ["...", "..."], "topicVi": "..."},
    ...2 total
  ],
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
				Array.isArray(parsed.pictures) &&
				Array.isArray(parsed.emails) &&
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
			fs.writeFileSync(CACHE_FILE, JSON.stringify(sets, null, 2)); // checkpoint
		} else {
			console.warn(`  set ${i + 1} skipped after retries`);
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

		// Q1-5: pictures
		for (const pic of set.pictures) {
			const id = stableUuid(`writing:${setCode}:q${qNum}`);
			await db
				.insert(toeicWritingPrompt)
				.values({
					id,
					setCode,
					questionNumber: qNum,
					type: "q1_5_picture",
					imageUrl: pexelsUrl(pic.pexelsId),
					mandatoryWords: pic.mandatoryWords,
					prepSeconds: TIMING.q1_5_picture.prepSeconds,
					writeSeconds: TIMING.q1_5_picture.writeSeconds,
					maxScore: TIMING.q1_5_picture.maxScore,
					topicVi: pic.topicVi,
				})
				.onConflictDoNothing();
			inserted++;
			qNum++;
		}

		// Q6-7: emails
		for (const email of set.emails) {
			const id = stableUuid(`writing:${setCode}:q${qNum}`);
			await db
				.insert(toeicWritingPrompt)
				.values({
					id,
					setCode,
					questionNumber: qNum,
					type: "q6_7_email",
					emailSubject: email.subject,
					emailBody: email.body,
					emailRequirements: email.requirements,
					prepSeconds: TIMING.q6_7_email.prepSeconds,
					writeSeconds: TIMING.q6_7_email.writeSeconds,
					maxScore: TIMING.q6_7_email.maxScore,
					topicVi: email.topicVi,
				})
				.onConflictDoNothing();
			inserted++;
			qNum++;
		}

		// Q8: opinion
		{
			const id = stableUuid(`writing:${setCode}:q${qNum}`);
			await db
				.insert(toeicWritingPrompt)
				.values({
					id,
					setCode,
					questionNumber: qNum,
					type: "q8_opinion",
					topic: set.opinion.topic,
					topicVi: set.opinion.topicVi,
					prepSeconds: TIMING.q8_opinion.prepSeconds,
					writeSeconds: TIMING.q8_opinion.writeSeconds,
					maxScore: TIMING.q8_opinion.maxScore,
				})
				.onConflictDoNothing();
			inserted++;
		}
	}

	console.log(`\nSeeded ${inserted} writing prompts across ${sets.length} sets`);
}

seed()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
