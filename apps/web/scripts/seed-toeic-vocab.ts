#!/usr/bin/env tsx
/**
 * Seed 600 TOEIC essential words across 10 topic packs.
 *
 * Strategy: ask Gemini to generate ~60 high-frequency, TOEIC-relevant words
 * per topic with full metadata (POS, IPA, meaning EN/VI, example EN/VI, level).
 * Output cached to data/toeic-vocab/600-essential.json so re-runs are free.
 *
 * Run: cd apps/web && pnpm seed:toeic-vocab
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { toeicVocab } from "@repo/database";
import { sql } from "drizzle-orm";
import { openAiClient } from "@/lib/openai/client";

const MODEL = process.env.OPENAI_CHAT_MODEL ?? "google/gemini-2.5-flash";
const DATA_DIR = path.join(process.cwd(), "data/toeic-vocab");
const CACHE_FILE = path.join(DATA_DIR, "600-essential.json");

const TOPICS = [
	{ key: "office", label: "Office & administration" },
	{ key: "business", label: "Business meetings & strategy" },
	{ key: "finance", label: "Finance, accounting & banking" },
	{ key: "marketing", label: "Marketing, advertising & sales" },
	{ key: "manufacturing", label: "Manufacturing, production & shipping" },
	{ key: "travel", label: "Travel, hotels & transportation" },
	{ key: "restaurants", label: "Restaurants, food & hospitality" },
	{ key: "health", label: "Health, medical & wellness" },
	{ key: "technology", label: "Technology, IT & communications" },
	{ key: "general", label: "General workplace & daily life" },
];

const WORDS_PER_TOPIC = 60;

type WordEntry = {
	word: string;
	pos: "noun" | "verb" | "adj" | "adv" | "phrase";
	ipa: string;
	meaningEn: string;
	meaningVi: string;
	exampleEn: string;
	exampleVi: string;
	level: "beginner" | "intermediate" | "advanced";
	frequency: number;
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

async function generateForTopic(topic: { key: string; label: string }): Promise<WordEntry[]> {
	const prompt = `You are creating a TOEIC vocabulary pack.

Topic: "${topic.label}" (key: ${topic.key})

Generate exactly ${WORDS_PER_TOPIC} high-frequency English words/phrases that appear in real TOEIC tests for this topic. Mix nouns, verbs, adjectives, adverbs, and a few common phrases.

Each entry MUST have:
- word: lowercase, single word or 2-3 word phrase
- pos: one of "noun", "verb", "adj", "adv", "phrase"
- ipa: IPA phonetic transcription with slashes, e.g. "/əˈbændən/"
- meaningEn: 1-line English definition (max 12 words)
- meaningVi: Vietnamese translation (1-3 words)
- exampleEn: natural sentence in TOEIC business style (max 20 words)
- exampleVi: Vietnamese translation of the example
- level: "beginner" (very common), "intermediate", or "advanced"
- frequency: integer 1-100 (1 = most common in TOEIC; rank within this topic)

Avoid duplicating extremely basic words like "the", "and", "is".
Prefer words that appear in TOEIC Part 5 (vocab questions) and Part 7 (vocab in context).
No duplicate words within the list.

Return ONLY valid JSON: {"words": [<entry>, <entry>, ...]}`;

	const res = await openAiClient.chat.completions.create({
		model: MODEL,
		messages: [{ role: "user", content: prompt }],
		response_format: { type: "json_object" },
		temperature: 0.3,
	});

	const raw = res.choices[0]?.message.content ?? "{}";
	const parsed = JSON.parse(raw);
	const words = (parsed.words ?? []) as WordEntry[];
	return words;
}

async function loadOrGenerate(): Promise<Record<string, WordEntry[]>> {
	if (fs.existsSync(CACHE_FILE)) {
		console.log(`Loading cached words from ${CACHE_FILE}`);
		return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
	}

	console.log("Generating words via Gemini (one batch per topic)...");
	const all: Record<string, WordEntry[]> = {};
	for (const topic of TOPICS) {
		console.log(`  Generating ${topic.key}...`);
		try {
			const words = await generateForTopic(topic);
			all[topic.key] = words;
			console.log(`    got ${words.length} words`);
		} catch (err) {
			console.error(`    FAILED for ${topic.key}:`, err instanceof Error ? err.message : err);
			all[topic.key] = [];
		}
	}

	if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
	fs.writeFileSync(CACHE_FILE, JSON.stringify(all, null, 2));
	console.log(`Cached to ${CACHE_FILE}`);

	return all;
}

async function seed() {
	const all = await loadOrGenerate();

	const seenWords = new Set<string>();
	let total = 0;
	let dupes = 0;
	let inserted = 0;

	for (const [topic, words] of Object.entries(all)) {
		for (const w of words) {
			total++;
			const word = w.word.toLowerCase().trim();
			if (!word) continue;
			if (seenWords.has(word)) {
				dupes++;
				continue;
			}
			seenWords.add(word);

			const id = stableUuid(`vocab:${word}`);
			await db
				.insert(toeicVocab)
				.values({
					id,
					word,
					pos: w.pos ?? "noun",
					ipa: w.ipa ?? null,
					meaningEn: w.meaningEn ?? "",
					meaningVi: w.meaningVi ?? "",
					exampleEn: w.exampleEn ?? null,
					exampleVi: w.exampleVi ?? null,
					topic,
					level: (["beginner", "intermediate", "advanced"].includes(w.level)
						? w.level
						: "intermediate"),
					frequency: typeof w.frequency === "number" ? w.frequency : 50,
				})
				.onConflictDoUpdate({
					target: toeicVocab.word,
					set: {
						topic,
						meaningVi: w.meaningVi ?? "",
						meaningEn: w.meaningEn ?? "",
						exampleEn: w.exampleEn ?? null,
						exampleVi: w.exampleVi ?? null,
						ipa: w.ipa ?? null,
						pos: w.pos ?? "noun",
						frequency: typeof w.frequency === "number" ? w.frequency : 50,
						updatedAt: new Date(),
					},
				});
			inserted++;
		}
	}

	const dbTotal = await db.select({ c: sql<number>`count(*)::int` }).from(toeicVocab);
	console.log(`\nSeeded ${inserted} words (${dupes} cross-topic dupes deduped from ${total} generated)`);
	console.log(`Total in DB: ${dbTotal[0]?.c}`);

	const byTopic = await db
		.select({ topic: toeicVocab.topic, c: sql<number>`count(*)::int` })
		.from(toeicVocab)
		.groupBy(toeicVocab.topic);
	console.log("By topic:", Object.fromEntries(byTopic.map((r) => [r.topic, r.c])));
}

seed()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
