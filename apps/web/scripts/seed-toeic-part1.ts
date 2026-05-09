#!/usr/bin/env tsx
/**
 * Seed TOEIC Part 1 (Photo questions).
 *
 * Pipeline:
 *   1. Read data/toeic-part1/photos.json (curated Pexels CDN URLs).
 *   2. For each photo: Gemini multimodal (image input) → 4 captions
 *      (1 correct, 3 distractors) + correctIndex + explanation.
 *   3. Groq TTS: 4 audio clips per photo (rotate diana/hannah/daniel).
 *   4. Insert toeic_question(part=1) with audioSegments + imageUrls.
 *
 * Idempotent: caches Gemini output JSON; skips TTS if file exists; upserts DB.
 *
 * Run: cd apps/web && pnpm seed:toeic-part1
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
const DATA_DIR = path.join(process.cwd(), "data/toeic-part1");
const AUDIO_DIR = path.join(process.cwd(), "public/toeic/audio/part1");
const PHOTOS_FILE = path.join(DATA_DIR, "photos.json");
const CACHE_FILE = path.join(DATA_DIR, "captions.json");

type PhotoSpec = { id: string; topic: string; hint: string };
type Caption = {
	photoId: string;
	options: string[]; // 4 captions A-D
	correctIndex: number;
	explanationVi: string;
	difficulty: "beginner" | "intermediate" | "advanced";
	skillIds: string[];
};

function pexelsUrl(id: string, w = 640): string {
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

async function captionPhoto(spec: PhotoSpec): Promise<Caption | null> {
	const url = pexelsUrl(spec.id, 1024);
	const prompt = `You see a photograph. Generate a TOEIC Part 1 (photo description) item.

Hint about the photo: ${spec.hint}

Output strict JSON: {
  "options": [<4 short captions, max 12 words each, neutral business/everyday English>],
  "correctIndex": <0-3, the option that BEST describes the photo>,
  "explanationVi": <Vietnamese explanation: why correct option matches the photo and why distractors don't>,
  "difficulty": "beginner" | "intermediate" | "advanced",
  "skillId": one of "toeic.part1.people_action" | "toeic.part1.object_state" | "toeic.part1.scene"
}

Distractors should be plausible but clearly wrong (mention objects/actions NOT in the photo).
The correct option should be specific enough to distinguish from distractors.
Avoid mentioning specific names, brands, or anything you can't verify from the photo.`;

	try {
		const res = await openAiClient.chat.completions.create({
			model: MODEL,
			messages: [
				{
					role: "user",
					content: [
						{ type: "text", text: prompt },
						{ type: "image_url", image_url: { url } },
					] as never,
				},
			],
			response_format: { type: "json_object" },
			temperature: 0.4,
		});
		const raw = res.choices[0]?.message.content ?? "{}";
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed.options) || parsed.options.length !== 4) return null;
		if (typeof parsed.correctIndex !== "number") return null;
		return {
			photoId: spec.id,
			options: parsed.options,
			correctIndex: parsed.correctIndex,
			explanationVi: parsed.explanationVi ?? "",
			difficulty: parsed.difficulty ?? "intermediate",
			skillIds: [parsed.skillId ?? "toeic.part1.scene"],
		};
	} catch (err) {
		console.error(`  caption failed for ${spec.id}:`, err instanceof Error ? err.message : err);
		return null;
	}
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
				const wait = 60000 * (attempt + 1);
				console.warn(`  rate-limited; sleeping ${wait / 1000}s before retry...`);
				await new Promise((r) => setTimeout(r, wait));
				continue;
			}
			console.error(`  TTS error:`, msg);
			return false;
		}
	}
	return false;
}

async function loadCaptions(specs: PhotoSpec[]): Promise<Map<string, Caption>> {
	const cached: Record<string, Caption> = fs.existsSync(CACHE_FILE)
		? JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"))
		: {};

	const out = new Map<string, Caption>();
	for (const [id, c] of Object.entries(cached)) out.set(id, c);

	let updated = false;
	for (const spec of specs) {
		if (out.has(spec.id)) continue;
		console.log(`  captioning ${spec.id} (${spec.topic})...`);
		const c = await captionPhoto(spec);
		if (c) {
			out.set(spec.id, c);
			cached[spec.id] = c;
			updated = true;
		}
	}
	if (updated) {
		fs.writeFileSync(CACHE_FILE, JSON.stringify(cached, null, 2));
		console.log(`  cached ${out.size} captions to ${CACHE_FILE}`);
	}
	return out;
}

async function seed() {
	const { photos: specs } = JSON.parse(fs.readFileSync(PHOTOS_FILE, "utf-8")) as {
		photos: PhotoSpec[];
	};

	console.log(`Loaded ${specs.length} photos.`);
	const captions = await loadCaptions(specs);
	console.log(`Have captions for ${captions.size}/${specs.length} photos.`);

	if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

	// Find or create the synthetic Part 1 exam container
	const examId = stableUuid("exam:toeic_part1_v1");
	await db
		.insert(toeicExam)
		.values({
			id: examId,
			code: "toeic_part1_v1",
			title: "TOEIC Part 1 Pack v1 (Pexels + AI captions)",
			source: "synthetic",
			year: null,
			totalQuestions: captions.size,
			partCounts: { "1": captions.size },
			hasListening: true,
			hasReading: false,
		})
		.onConflictDoUpdate({
			target: toeicExam.code,
			set: { totalQuestions: captions.size, updatedAt: new Date() },
		});

	let inserted = 0;
	let i = 0;
	for (const spec of specs) {
		const caption = captions.get(spec.id);
		if (!caption) continue;

		const number = 1 + i++;
		const qid = stableUuid(`q:toeic_part1_v1:${spec.id}`);
		const baseFile = path.join(AUDIO_DIR, qid);

		console.log(`  [${number}/${captions.size}] photo ${spec.id} (${spec.topic})...`);

		// Generate 4 caption audios (rotate voices)
		const audioOk: boolean[] = [];
		for (let j = 0; j < 4; j++) {
			const v = VOICES[(i + j) % VOICES.length];
			const role = ["a", "b", "c", "d"][j];
			const ok = await ttsSafe(caption.options[j] ?? "", v, `${baseFile}_${role}.wav`);
			audioOk.push(ok);
		}
		if (!audioOk.every(Boolean)) {
			console.warn(`  skipped ${spec.id} — TTS failed`);
			continue;
		}

		await db
			.insert(toeicQuestion)
			.values({
				id: qid,
				examId,
				number,
				part: 1,
				parentId: null,
				questionText: null,
				passageText: null,
				options: ["A", "B", "C", "D"],
				correctIndex: caption.correctIndex,
				audioUrl: null,
				audioSegments: {
					question: "",
					options: [
						`/toeic/audio/part1/${qid}_a.wav`,
						`/toeic/audio/part1/${qid}_b.wav`,
						`/toeic/audio/part1/${qid}_c.wav`,
						`/toeic/audio/part1/${qid}_d.wav`,
					],
				},
				imageUrls: [pexelsUrl(spec.id, 1024)],
				topic: spec.topic,
				skillIds: caption.skillIds,
				difficulty: caption.difficulty,
				explanationEn: null,
				explanationVi: caption.explanationVi,
			})
			.onConflictDoUpdate({
				target: [toeicQuestion.examId, toeicQuestion.number],
				set: {
					correctIndex: caption.correctIndex,
					skillIds: caption.skillIds,
					explanationVi: caption.explanationVi,
					updatedAt: new Date(),
				},
			});
		inserted++;
	}

	console.log(`\nSeeded ${inserted} Part 1 questions`);
}

seed()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
