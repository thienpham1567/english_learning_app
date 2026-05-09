#!/usr/bin/env tsx
/**
 * One-time job: send each unlabeled toeic_question to Gemini (via OpenRouter)
 * and ask for skillIds from the TOEIC taxonomy. Idempotent: skips rows that
 * already have skillIds.
 *
 * Run:        cd apps/web && pnpm label:toeic
 * With limit: cd apps/web && pnpm label:toeic -- --limit=50
 *
 * Required env: OPENAI_API_KEY (OpenRouter key) and optionally OPENAI_BASE_URL,
 * OPENAI_CHAT_MODEL.
 */
import { db } from "@/lib/db";
import { toeicQuestion } from "@repo/database";
import { eq, sql } from "drizzle-orm";
import { TOEIC_SKILLS, getSkillsByPart } from "@repo/contracts";
import { openAiClient } from "@/lib/openai/client";

const MODEL = process.env.OPENAI_CHAT_MODEL ?? "google/gemini-2.5-flash";
const BATCH_SIZE = 25;

type Row = {
	id: string;
	part: number;
	questionText: string | null;
	options: string[];
	correctIndex: number;
	explanationVi: string | null;
};

function buildPrompt(q: Row): string {
	const skillsForPart = getSkillsByPart(q.part).join(", ");
	const correctOption = q.options[q.correctIndex] ?? "(unknown)";
	return `You are labeling a TOEIC question with skill IDs from a fixed taxonomy.

Question (Part ${q.part}):
${q.questionText ?? "(no text — likely Part 1 photo or Part 2 audio-only)"}

Options:
${q.options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join("\n")}

Correct: ${String.fromCharCode(65 + q.correctIndex)}. ${correctOption}

Vietnamese explanation:
${q.explanationVi ?? "(none)"}

Allowed skill IDs for Part ${q.part}: ${skillsForPart}

Return ONLY a JSON object {"skills": ["<skill_id>"]} with 1 to 2 skill IDs from the allowed list, ordered most relevant first. No prose.

Example: {"skills": ["toeic.part5.verb_form"]}`;
}

async function labelOne(q: Row): Promise<string[]> {
	const res = await openAiClient.chat.completions.create({
		model: MODEL,
		messages: [{ role: "user", content: buildPrompt(q) }],
		response_format: { type: "json_object" },
		temperature: 0,
	});
	const raw = res.choices[0]?.message.content ?? "{}";
	try {
		const parsed = JSON.parse(raw);
		const arr: string[] = Array.isArray(parsed)
			? parsed
			: Array.isArray(parsed.skills)
				? parsed.skills
				: [];
		return arr.filter((s) => (TOEIC_SKILLS as readonly string[]).includes(s)).slice(0, 2);
	} catch {
		return [];
	}
}

function parseLimit(): number | null {
	const arg = process.argv.find((a) => a.startsWith("--limit="));
	if (!arg) return null;
	const n = parseInt(arg.split("=")[1], 10);
	return Number.isFinite(n) && n > 0 ? n : null;
}

async function main() {
	const limit = parseLimit();

	const baseQuery = db
		.select({
			id: toeicQuestion.id,
			part: toeicQuestion.part,
			questionText: toeicQuestion.questionText,
			options: toeicQuestion.options,
			correctIndex: toeicQuestion.correctIndex,
			explanationVi: toeicQuestion.explanationVi,
		})
		.from(toeicQuestion)
		.where(sql`jsonb_array_length(${toeicQuestion.skillIds}) = 0`);

	const rows = limit ? await baseQuery.orderBy(sql`random()`).limit(limit) : await baseQuery;

	console.log(`Found ${rows.length} unlabeled questions${limit ? ` (limited to ${limit})` : ""}`);

	let ok = 0;
	let fail = 0;
	for (let i = 0; i < rows.length; i += BATCH_SIZE) {
		const batch = rows.slice(i, i + BATCH_SIZE);
		const results = await Promise.all(
			batch.map(async (q) => {
				try {
					const skills = await labelOne(q as Row);
					if (skills.length === 0) return { id: q.id, ok: false };
					await db
						.update(toeicQuestion)
						.set({ skillIds: skills, updatedAt: new Date() })
						.where(eq(toeicQuestion.id, q.id));
					return { id: q.id, ok: true };
				} catch (err) {
					console.error(`Failed ${q.id}:`, err instanceof Error ? err.message : err);
					return { id: q.id, ok: false };
				}
			}),
		);
		for (const r of results) {
			if (r.ok) ok++;
			else fail++;
		}
		console.log(`Progress: ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length} (ok=${ok}, fail=${fail})`);
	}

	console.log(`\nDone. ok=${ok}, fail=${fail}`);
}

main()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
