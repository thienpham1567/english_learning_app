#!/usr/bin/env tsx
/**
 * Seed 30 TOEIC dictation items (sentence-level).
 *
 * Pipeline:
 *   1. Gemini: generate 30 sentences with topic/level/vocabHints
 *      → cached to data/toeic-dictation/items.json
 *   2. Groq TTS: 1 audio per sentence (rotate 3 voices)
 *      → apps/web/public/toeic/audio/dictation/<id>.wav
 *   3. Insert toeic_dictation_item rows
 *
 * Run: cd apps/web && pnpm seed:toeic-dictation
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { toeicDictationItem } from "@repo/database";
import { openAiClient } from "@/lib/openai/client";
import { synthesizeToFile, pickVoice } from "@/lib/toeic/tts";

const MODEL = process.env.OPENAI_CHAT_MODEL ?? "google/gemini-2.5-flash";
const DATA_DIR = path.join(process.cwd(), "data/toeic-dictation");
const AUDIO_DIR = path.join(process.cwd(), "public/toeic/audio/dictation");
const CACHE_FILE = path.join(DATA_DIR, "items.json");

type Item = {
	text: string;
	level: "beginner" | "intermediate" | "advanced";
	topic: string;
	vocabHints: Array<{ word: string; vi: string }>;
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

	console.log("Generating 30 dictation sentences via Gemini...");
	const prompt = `Generate 30 short English sentences for TOEIC listening dictation practice.

Each item:
- text: a natural English sentence in TOEIC business/office style (10-25 words; standard punctuation; no quotation marks; no all-caps; no rare proper nouns)
- level: "beginner" | "intermediate" | "advanced"
- topic: one of "office" | "travel" | "business" | "finance" | "marketing" | "manufacturing" | "general"
- vocabHints: array of 0-3 challenging words from the sentence with VN translations: [{"word": "...", "vi": "..."}]

Distribute level: 10 beginner, 15 intermediate, 5 advanced.
Mix topics. No duplicate sentences.

Return ONLY strict JSON: {"items": [...]}`;

	const res = await openAiClient.chat.completions.create({
		model: MODEL,
		messages: [{ role: "user", content: prompt }],
		response_format: { type: "json_object" },
		temperature: 0.5,
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

async function ttsSafe(text: string, voice: ReturnType<typeof pickVoice>, outputPath: string): Promise<boolean> {
	if (fs.existsSync(outputPath)) return true;
	for (let attempt = 0; attempt < 3; attempt++) {
		try {
			await synthesizeToFile({ text, voice, outputPath });
			await new Promise((r) => setTimeout(r, 4000));
			return true;
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			if (msg.includes("rate_limit") || msg.includes("429")) {
				const wait = 60000 * (attempt + 1); // 60s, 120s, 180s
				console.warn(`  rate-limited; sleeping ${wait / 1000}s before retry ${attempt + 1}/3...`);
				await new Promise((r) => setTimeout(r, wait));
				continue;
			}
			console.error(`  TTS error (non-rate-limit):`, msg);
			return false;
		}
	}
	return false;
}

async function seed() {
	const items = await generateItems();
	if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

	let inserted = 0;
	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		const id = stableUuid(`dictation:${item.text}`);
		const voice = pickVoice(i);
		const audioPath = path.join(AUDIO_DIR, `${id}.wav`);
		const audioUrl = `/toeic/audio/dictation/${id}.wav`;

		console.log(`  [${i + 1}/${items.length}] (${voice}) ${item.text.slice(0, 70)}...`);

		const ok = await ttsSafe(item.text, voice, audioPath);
		if (!ok) {
			console.warn(`  skipped item ${i + 1} (TTS failed after retries)`);
			continue;
		}

		await db
			.insert(toeicDictationItem)
			.values({
				id,
				text: item.text,
				audioUrl,
				level: item.level,
				topic: item.topic,
				vocabHints: item.vocabHints ?? [],
				voice,
			})
			.onConflictDoNothing();
		inserted++;
	}

	console.log(`\nSeeded ${inserted} dictation items`);
}

seed()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
