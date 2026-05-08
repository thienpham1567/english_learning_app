# TOEIC Backbone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the TOEIC backbone — data model, contracts, hub UI shell, diagnostic flow, and event pipeline — so all future TOEIC features (#1–#9) plug into the existing learning engine instead of staying disconnected.

**Architecture:** Extend the existing `learningEvent` / `userSkillState` / `reviewTask` infrastructure to cover TOEIC by (a) adding TOEIC values to `LearningModuleType`, (b) defining a 25-node TOEIC skill taxonomy, (c) migrating questions from JSON to four new Postgres tables, (d) emitting `LearningEvent`s on every answer so existing modules (`mastery-engine`, `daily-plan-generator`, `error-drill-generator`, `dashboard-query-service`, `recommendation-scorer`) automatically pick up TOEIC activity, and (e) replacing the current two TOEIC pages with a unified `/toeic` hub gated by a 30-question diagnostic.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Drizzle ORM + Postgres, Zod v4, Antd 6, better-auth, OpenAI SDK pointed at Gemini (`gemini-2.5-flash` for one-time auto-label), pino logger.

**Spec:** `docs/superpowers/specs/2026-05-08-toeic-backbone-design.md`

**Note:** User instructed to skip writing test files. Tasks below contain implementation steps only; manual smoke-test steps are kept.

---

## File Structure

### New files

```
packages/contracts/src/learning/
  toeic-skill-taxonomy.ts         # 25-node TOEIC subskill enum + helpers
  toeic-attempt.ts                # Zod DTOs for attempt/answer
  module-skill-mapping.ts         # Static module → skillIds mapping (if not already present)

packages/database/src/schema/
  index.ts                        # MODIFY: add 4 tables + extend module type

apps/web/scripts/
  seed-toeic.ts                   # Seed exams + questions from JSON
  label-toeic-skills.ts           # One-time Gemini auto-label
  build-diagnostic-set.ts         # Pick 30 questions for diagnostic_v1

apps/web/lib/toeic/
  taxonomy.ts                     # Re-export + UI labels
  scoring.ts                      # Raw → scaled stub (full impl in #9)
  event-emitter.ts                # emitToeicLearningEvent helper

apps/web/app/api/toeic-practice/
  start/route.ts                  # POST: create attempt
  answer/route.ts                 # POST: submit answer + event pipeline
  complete/route.ts               # POST: close attempt, write baseline if diagnostic
  attempt/[id]/route.ts           # GET: resume/review
  questions/route.ts              # GET: filter
  exams/route.ts                  # GET: list exams
  import-history/route.ts         # POST: best-effort localStorage migration

apps/web/hooks/
  useToeicSession.ts              # NEW: generic session driver

apps/web/app/(app)/toeic/
  layout.tsx                      # Server: first-visit gate + sub-nav
  page.tsx                        # Hub homepage (widgets)
  _components/
    HubWidgets.tsx                # Predicted score, daily plan, streak, review-due
    SubNav.tsx                    # Sticky tabs
    QuickActions.tsx              # Grid of links to sub-routes
  diagnostic/
    page.tsx                      # Diagnostic runner
    _components/
      DiagnosticIntro.tsx
      DiagnosticResult.tsx
  practice/
    page.tsx                      # Practice (refactored from /toeic-practice)
    [attemptId]/page.tsx          # Resume/review
    _components/
      PracticeSetup.tsx
      QuestionRunner.tsx          # Used by practice + diagnostic + future mock
      ResultSummary.tsx
  skills/
    page.tsx                      # 4-skill overview (refactored from /toeic-skills)
```

### Modified files

```
packages/contracts/src/learning/learning-event.ts  # Extend LearningModuleType enum
packages/contracts/src/learning/index.ts           # Re-export new modules
packages/database/src/schema/index.ts              # Add 4 tables
apps/web/hooks/useToeicPractice.ts                 # Refactor → wrapper of useToeicSession
apps/web/app/(app)/toeic-practice/page.tsx         # DELETE after redirect added
apps/web/app/(app)/toeic-skills/page.tsx           # DELETE after redirect added
apps/web/app/(app)/toeic-practice/page.tsx         # OR replace with redirect
apps/web/middleware.ts (or next.config.ts)         # 308 redirects
apps/web/components/shared/Sidebar.tsx (or wherever sidebar lives) # consolidate TOEIC entry
apps/web/package.json                              # add: tsx (if missing) for scripts
```

### Deleted/deprecated files

```
apps/web/app/(app)/toeic-practice/  # Replaced by /toeic/practice
apps/web/app/(app)/toeic-skills/    # Replaced by /toeic/skills
# Existing /api/toeic-practice/route.ts: DEPRECATED but kept until consumers migrate.
# Existing /api/toeic-practice/describe-picture etc: leave alone (#6 territory).
```

---

## Task 1: Skill taxonomy + module type extension

**Files:**
- Create: `packages/contracts/src/learning/toeic-skill-taxonomy.ts`
- Modify: `packages/contracts/src/learning/learning-event.ts` (add 5 enum values)
- Modify: `packages/contracts/src/learning/index.ts` (re-export)
- Create: `packages/contracts/src/learning/module-skill-mapping.ts` if not present (check first)

- [ ] **Step 1.1: Extend `LearningModuleType`**

Edit `packages/contracts/src/learning/learning-event.ts` — find the `LearningModuleType` enum block and add 5 new values:

```ts
export const LearningModuleType = z.enum([
	"chatbot",
	"dictionary",
	"flashcard",
	"daily_challenge",
	"grammar_quiz",
	"grammar_lesson",
	"writing",
	"listening",
	"speaking",
	"reading",
	"diagnostic",
	"scenarios",
	// TOEIC additions
	"toeic_practice",
	"toeic_mock_test",
	"toeic_diagnostic",
	"toeic_speaking",
	"toeic_writing",
]);
```

- [ ] **Step 1.2: Create TOEIC taxonomy**

Create `packages/contracts/src/learning/toeic-skill-taxonomy.ts`:

```ts
import { z } from "zod/v4";

export const TOEIC_SKILLS = [
	// Part 1 — Photo (3)
	"toeic.part1.people_action",
	"toeic.part1.object_state",
	"toeic.part1.scene",
	// Part 2 — Question-Response (3)
	"toeic.part2.wh_question",
	"toeic.part2.yn_question",
	"toeic.part2.statement",
	// Part 3 — Conversations (3)
	"toeic.part3.gist",
	"toeic.part3.detail",
	"toeic.part3.inference",
	// Part 4 — Talks (3)
	"toeic.part4.gist",
	"toeic.part4.detail",
	"toeic.part4.inference",
	// Part 5 — Incomplete sentences (5)
	"toeic.part5.verb_form",
	"toeic.part5.preposition",
	"toeic.part5.conjunction",
	"toeic.part5.vocab",
	"toeic.part5.pronoun",
	// Part 6 — Cloze passages (2)
	"toeic.part6.grammar",
	"toeic.part6.discourse",
	// Part 7 — Reading comprehension (5)
	"toeic.part7.detail",
	"toeic.part7.inference",
	"toeic.part7.vocab_in_context",
	"toeic.part7.main_idea",
	"toeic.part7.not_question",
] as const;

export const ToeicSkillSchema = z.enum(TOEIC_SKILLS);
export type ToeicSkill = z.infer<typeof ToeicSkillSchema>;

const SKILL_LABELS: Record<ToeicSkill, { en: string; vi: string }> = {
	"toeic.part1.people_action": { en: "Part 1 · People & actions", vi: "Part 1 · Người & hành động" },
	"toeic.part1.object_state": { en: "Part 1 · Object state", vi: "Part 1 · Trạng thái vật" },
	"toeic.part1.scene": { en: "Part 1 · Scene description", vi: "Part 1 · Mô tả khung cảnh" },
	"toeic.part2.wh_question": { en: "Part 2 · WH questions", vi: "Part 2 · Câu hỏi WH" },
	"toeic.part2.yn_question": { en: "Part 2 · Yes/No questions", vi: "Part 2 · Câu hỏi Yes/No" },
	"toeic.part2.statement": { en: "Part 2 · Statement response", vi: "Part 2 · Đáp lại câu trần thuật" },
	"toeic.part3.gist": { en: "Part 3 · Gist", vi: "Part 3 · Ý chính" },
	"toeic.part3.detail": { en: "Part 3 · Detail", vi: "Part 3 · Chi tiết" },
	"toeic.part3.inference": { en: "Part 3 · Inference", vi: "Part 3 · Suy luận" },
	"toeic.part4.gist": { en: "Part 4 · Gist", vi: "Part 4 · Ý chính" },
	"toeic.part4.detail": { en: "Part 4 · Detail", vi: "Part 4 · Chi tiết" },
	"toeic.part4.inference": { en: "Part 4 · Inference", vi: "Part 4 · Suy luận" },
	"toeic.part5.verb_form": { en: "Part 5 · Verb form/tense", vi: "Part 5 · Thì & dạng động từ" },
	"toeic.part5.preposition": { en: "Part 5 · Preposition", vi: "Part 5 · Giới từ" },
	"toeic.part5.conjunction": { en: "Part 5 · Conjunction", vi: "Part 5 · Liên từ" },
	"toeic.part5.vocab": { en: "Part 5 · Vocabulary", vi: "Part 5 · Từ vựng" },
	"toeic.part5.pronoun": { en: "Part 5 · Pronoun", vi: "Part 5 · Đại từ" },
	"toeic.part6.grammar": { en: "Part 6 · Grammar in cloze", vi: "Part 6 · Ngữ pháp trong đoạn" },
	"toeic.part6.discourse": { en: "Part 6 · Discourse/cohesion", vi: "Part 6 · Liên kết đoạn" },
	"toeic.part7.detail": { en: "Part 7 · Detail", vi: "Part 7 · Chi tiết" },
	"toeic.part7.inference": { en: "Part 7 · Inference", vi: "Part 7 · Suy luận" },
	"toeic.part7.vocab_in_context": { en: "Part 7 · Vocab in context", vi: "Part 7 · Từ vựng trong ngữ cảnh" },
	"toeic.part7.main_idea": { en: "Part 7 · Main idea", vi: "Part 7 · Ý chính bài đọc" },
	"toeic.part7.not_question": { en: "Part 7 · NOT/EXCEPT", vi: "Part 7 · Câu phủ định/loại trừ" },
};

export function getSkillLabel(id: ToeicSkill, lang: "en" | "vi" = "vi"): string {
	return SKILL_LABELS[id]?.[lang] ?? id;
}

export function getSkillsByPart(part: number): ToeicSkill[] {
	const prefix = `toeic.part${part}.`;
	return TOEIC_SKILLS.filter((s) => s.startsWith(prefix));
}

export function isToeicSkill(id: string): id is ToeicSkill {
	return (TOEIC_SKILLS as readonly string[]).includes(id);
}
```

- [ ] **Step 1.3: Create / extend module-skill mapping**

Check first whether `packages/contracts/src/learning/module-skill-mapping.ts` exists. If not, create it. If yes, extend the array. Run:

```bash
ls packages/contracts/src/learning/module-skill-mapping.ts 2>/dev/null && echo EXISTS || echo MISSING
```

If MISSING, create it with the full content. If EXISTS, append the TOEIC entries to the existing array.

```ts
import type { ModuleSkillMapping } from "./skill-taxonomy";
import { TOEIC_SKILLS } from "./toeic-skill-taxonomy";

export const MODULE_SKILL_MAPPING: ModuleSkillMapping[] = [
	// ... preserve any existing entries from the file ...
	{ moduleType: "toeic_practice", skillIds: [...TOEIC_SKILLS] },
	{ moduleType: "toeic_diagnostic", skillIds: [...TOEIC_SKILLS] },
	{ moduleType: "toeic_mock_test", skillIds: [...TOEIC_SKILLS] },
	// Speaking/Writing get their own subskills in #6/#7; map to all TOEIC for now.
	{ moduleType: "toeic_speaking", skillIds: [...TOEIC_SKILLS] },
	{ moduleType: "toeic_writing", skillIds: [...TOEIC_SKILLS] },
];
```

- [ ] **Step 1.4: Re-export from contracts index**

Edit `packages/contracts/src/learning/index.ts`. Add:

```ts
export * from "./toeic-skill-taxonomy";
export * from "./module-skill-mapping";
```

- [ ] **Step 1.5: Verify package builds**

```bash
cd packages/contracts && pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 1.6: Commit**

```bash
git add packages/contracts/src/learning/
git commit -m "feat(contracts): add TOEIC skill taxonomy and module type"
```

---

## Task 2: Database schema — 4 new TOEIC tables

**Files:**
- Modify: `packages/database/src/schema/index.ts`
- Create: `packages/database/drizzle/<timestamp>_toeic_backbone.sql` (auto-generated)

- [ ] **Step 2.1: Append TOEIC tables to schema**

Open `packages/database/src/schema/index.ts`. At the bottom of the file (before any final exports if applicable, otherwise at end), add:

```ts
/** TOEIC Exam — bộ đề (ETS 2021 Test 1, diagnostic_v1, ...) */
export const toeicExam = pgTable("toeic_exam", {
	id: uuid("id").defaultRandom().primaryKey(),
	code: text("code").notNull().unique(),
	title: text("title").notNull(),
	source: text("source").notNull(),
	year: integer("year"),
	totalQuestions: integer("total_questions").notNull(),
	hasListening: boolean("has_listening").notNull().default(true),
	hasReading: boolean("has_reading").notNull().default(true),
	partCounts: jsonb("part_counts").$type<Record<string, number>>().notNull().default({}),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ToeicExamRow = typeof toeicExam.$inferSelect;

/** TOEIC Question — 1 câu hỏi (Part 1-7) */
export const toeicQuestion = pgTable("toeic_question", {
	id: uuid("id").defaultRandom().primaryKey(),
	examId: uuid("exam_id").notNull().references(() => toeicExam.id, { onDelete: "cascade" }),
	number: integer("number").notNull(),
	part: integer("part").notNull(),
	parentId: uuid("parent_id"),
	groupOrder: integer("group_order"),
	questionText: text("question_text"),
	passageText: text("passage_text"),
	options: jsonb("options").$type<string[]>().notNull(),
	correctIndex: integer("correct_index").notNull(),
	audioUrl: text("audio_url"),
	imageUrls: jsonb("image_urls").$type<string[]>(),
	topic: text("topic"),
	skillIds: jsonb("skill_ids").$type<string[]>().notNull().default([]),
	difficulty: text("difficulty").notNull().default("intermediate"),
	explanationEn: text("explanation_en"),
	explanationVi: text("explanation_vi"),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("toeic_question_exam_number_idx").on(table.examId, table.number),
	index("toeic_question_part_idx").on(table.part),
	index("toeic_question_skill_ids_gin_idx").using("gin", table.skillIds),
]);

export type ToeicQuestionRow = typeof toeicQuestion.$inferSelect;

/** TOEIC Attempt — 1 phiên làm bài (practice/mock_test/diagnostic/drill) */
export const toeicAttempt = pgTable("toeic_attempt", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: text("user_id").notNull(),
	mode: text("mode").notNull(),
	examId: uuid("exam_id").references(() => toeicExam.id, { onDelete: "set null" }),
	partFilter: integer("part_filter"),
	questionCount: integer("question_count").notNull(),
	startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { withTimezone: true }),
	durationMs: integer("duration_ms"),
	rawListening: integer("raw_listening"),
	rawReading: integer("raw_reading"),
	scaledListening: integer("scaled_listening"),
	scaledReading: integer("scaled_reading"),
	totalScaled: integer("total_scaled"),
	baselineSnapshot: jsonb("baseline_snapshot").$type<Record<string, number>>(),
}, (table) => [
	index("toeic_attempt_user_mode_completed_idx").on(table.userId, table.mode, table.completedAt),
]);

export type ToeicAttemptRow = typeof toeicAttempt.$inferSelect;

/** TOEIC Answer — 1 câu trả lời trong attempt */
export const toeicAnswer = pgTable("toeic_answer", {
	id: uuid("id").defaultRandom().primaryKey(),
	attemptId: uuid("attempt_id").notNull().references(() => toeicAttempt.id, { onDelete: "cascade" }),
	questionId: uuid("question_id").notNull().references(() => toeicQuestion.id, { onDelete: "cascade" }),
	selectedIndex: integer("selected_index"),
	isCorrect: boolean("is_correct"),
	durationMs: integer("duration_ms").notNull().default(0),
	flagged: boolean("flagged").notNull().default(false),
	changedCount: integer("changed_count").notNull().default(0),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("toeic_answer_attempt_question_idx").on(table.attemptId, table.questionId),
	index("toeic_answer_attempt_idx").on(table.attemptId),
]);

export type ToeicAnswerRow = typeof toeicAnswer.$inferSelect;
```

If the imports `pgTable, uuid, text, integer, boolean, jsonb, timestamp, index, uniqueIndex` are not already at the top of the file, add the missing ones to the existing import block. Check with:

```bash
head -10 packages/database/src/schema/index.ts
```

- [ ] **Step 2.2: Generate migration**

```bash
cd apps/web && pnpm db:generate
```

Expected: a new SQL file appears in `packages/database/drizzle/` (or wherever the project's `out` is). Inspect it.

- [ ] **Step 2.3: Verify migration SQL**

Open the new migration file. Confirm:
- `CREATE TABLE toeic_exam`, `toeic_question`, `toeic_attempt`, `toeic_answer`
- `CREATE INDEX` for the indexes declared
- The GIN index on `toeic_question.skill_ids` uses `USING GIN`

If the GIN index is missing or wrong, hand-edit the SQL file to add:

```sql
CREATE INDEX IF NOT EXISTS "toeic_question_skill_ids_gin_idx" ON "toeic_question" USING GIN ("skill_ids");
```

- [ ] **Step 2.4: Apply migration to local DB**

```bash
cd apps/web && pnpm db:migrate
```

Expected: completes without error.

- [ ] **Step 2.5: Verify tables exist**

Run an ad-hoc query to confirm. If the project has a `pnpm db:studio` or psql access:

```bash
psql "$DATABASE_URL" -c "\dt toeic_*"
```

Expected: 4 tables listed.

- [ ] **Step 2.6: Commit**

```bash
git add packages/database/src/schema/index.ts packages/database/drizzle/
git commit -m "feat(db): add toeic_exam/question/attempt/answer tables"
```

---

## Task 3: Seed exams + questions from JSON

**Files:**
- Create: `apps/web/scripts/seed-toeic.ts`
- Modify: `apps/web/package.json` (add script)

- [ ] **Step 3.1: Inspect existing JSON shape**

The data lives in `apps/web/data/toeic-exams/`. Confirm structure:

```bash
ls apps/web/data/toeic-exams/*.json
node -e "const d = require('./apps/web/data/toeic-exams/test_1_ets_2021.json'); console.log(Object.keys(d)); console.log(d.questions?.[0] ?? d[0]);"
```

Read `index.json` to understand which file maps to which exam.

- [ ] **Step 3.2: Create seed script**

Create `apps/web/scripts/seed-toeic.ts`:

```ts
#!/usr/bin/env tsx
/**
 * Seed toeic_exam + toeic_question from data/toeic-exams/*.json.
 * Idempotent: question ID is hash(examCode + number).
 *
 * Run:  pnpm tsx apps/web/scripts/seed-toeic.ts
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { toeicExam, toeicQuestion } from "@repo/database";
import { eq, sql } from "drizzle-orm";

const DATA_DIR = path.join(process.cwd(), "data/toeic-exams");

type RawQuestion = {
	number: number;
	part: number | string;
	content?: string;
	stem?: string;
	options: string[];
	correctIndex: number;
	explanationEn?: string;
	explanationVi?: string;
	topic?: string;
	audio?: string | null;
	images?: { image_path: string }[] | null;
	parentId?: string | null;
};

type RawFile = {
	exam: { code: string; title: string; source: string; year: number };
	questions: RawQuestion[];
};

function stableUuid(seed: string): string {
	const h = crypto.createHash("sha256").update(seed).digest("hex");
	// Format as UUID v5-like
	return [
		h.slice(0, 8),
		h.slice(8, 12),
		"5" + h.slice(13, 16),
		((parseInt(h.slice(16, 18), 16) & 0x3f) | 0x80).toString(16) + h.slice(18, 20),
		h.slice(20, 32),
	].join("-");
}

function loadFiles(): { file: string; data: RawFile }[] {
	const files = fs.readdirSync(DATA_DIR).filter((f) => f.startsWith("test_") && f.endsWith(".json"));
	return files.map((file) => {
		const raw = fs.readFileSync(path.join(DATA_DIR, file), "utf-8");
		const data = JSON.parse(raw) as RawFile;
		// If the JSON doesn't already have an `exam` block, derive it from the filename.
		if (!data.exam) {
			const m = file.match(/^test_(\d+)_ets_(\d+)\.json$/);
			if (!m) throw new Error(`Cannot derive exam metadata from filename: ${file}`);
			const [, num, year] = m;
			(data as RawFile).exam = {
				code: `ets_${year}_test_${num}`,
				title: `ETS ${year} · Test ${num}`,
				source: "ETS",
				year: parseInt(year, 10),
			};
		}
		return { file, data };
	});
}

async function seed() {
	const files = loadFiles();
	console.log(`Found ${files.length} exam files`);

	for (const { file, data } of files) {
		const partCounts: Record<string, number> = {};
		for (const q of data.questions) {
			const p = String(q.part);
			partCounts[p] = (partCounts[p] ?? 0) + 1;
		}
		const totalQuestions = data.questions.length;

		// Upsert exam
		const examId = stableUuid(`exam:${data.exam.code}`);
		await db
			.insert(toeicExam)
			.values({
				id: examId,
				code: data.exam.code,
				title: data.exam.title,
				source: data.exam.source,
				year: data.exam.year,
				totalQuestions,
				partCounts,
				hasListening: Object.keys(partCounts).some((p) => parseInt(p, 10) <= 4),
				hasReading: Object.keys(partCounts).some((p) => parseInt(p, 10) >= 5),
			})
			.onConflictDoUpdate({
				target: toeicExam.code,
				set: {
					title: data.exam.title,
					totalQuestions,
					partCounts,
					updatedAt: new Date(),
				},
			});

		// Upsert questions
		let inserted = 0;
		for (const q of data.questions) {
			const qid = stableUuid(`q:${data.exam.code}:${q.number}`);
			const parentId = q.parentId
				? stableUuid(`q:${data.exam.code}:${q.parentId}`)
				: null;

			await db
				.insert(toeicQuestion)
				.values({
					id: qid,
					examId,
					number: q.number,
					part: typeof q.part === "string" ? parseInt(q.part, 10) : q.part,
					parentId,
					questionText: q.content ?? q.stem ?? null,
					options: q.options,
					correctIndex: q.correctIndex,
					audioUrl: q.audio ?? null,
					imageUrls: q.images?.map((i) => i.image_path) ?? null,
					topic: q.topic ?? null,
					explanationEn: q.explanationEn ?? null,
					explanationVi: q.explanationVi ?? null,
					skillIds: [],
					difficulty: "intermediate",
				})
				.onConflictDoNothing();
			inserted++;
		}
		console.log(`  ${file}: exam=${data.exam.code}, questions=${inserted}, parts=${JSON.stringify(partCounts)}`);
	}

	const total = await db.select({ c: sql<number>`count(*)` }).from(toeicQuestion);
	console.log(`Total questions in DB: ${total[0]?.c}`);
}

seed()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
```

Notes for engineer:
- The current JSON files may not have an `exam` block — the script derives it from the filename pattern. If your JSON files have a different shape, adjust `loadFiles`.
- `parentId` in source JSON may use the question's own `number` as a string; the stable UUID hash makes it deterministic.
- `db` import path is `@/lib/db`; verify by `ls apps/web/lib/db/`.

- [ ] **Step 3.3: Add npm script**

Edit `apps/web/package.json`. In `"scripts"`, add:

```json
"seed:toeic": "tsx scripts/seed-toeic.ts"
```

Confirm `tsx` is in devDependencies. If not:

```bash
cd apps/web && pnpm add -D tsx
```

- [ ] **Step 3.4: Run seed**

```bash
cd apps/web && pnpm seed:toeic
```

Expected output: lists each exam file with question count. Final total matches the sum (~1320 for current 8 ETS tests).

- [ ] **Step 3.5: Verify**

```bash
psql "$DATABASE_URL" -c "SELECT code, total_questions, part_counts FROM toeic_exam ORDER BY year, code;"
psql "$DATABASE_URL" -c "SELECT part, count(*) FROM toeic_question GROUP BY part ORDER BY part;"
```

Expected: 8 rows in `toeic_exam`; question count distributed across parts 3–7 (Parts 1–2 will be empty until #1).

- [ ] **Step 3.6: Run script again to confirm idempotency**

```bash
cd apps/web && pnpm seed:toeic
```

Expected: completes without errors and same totals.

- [ ] **Step 3.7: Commit**

```bash
git add apps/web/scripts/seed-toeic.ts apps/web/package.json
git commit -m "feat(toeic): seed exams and questions from JSON to DB"
```

---

## Task 4: Auto-label question subskills via Gemini

**Files:**
- Create: `apps/web/scripts/label-toeic-skills.ts`
- Modify: `apps/web/package.json` (add script)
- Required env: `GEMINI_API_KEY` (or whatever name the existing OpenAI client expects — check `apps/web/lib/openai/`)

- [ ] **Step 4.1: Inspect existing OpenAI/Gemini client setup**

```bash
ls apps/web/lib/openai/
cat apps/web/lib/openai/index.ts 2>/dev/null || cat apps/web/lib/openai/client.ts 2>/dev/null
```

Note the client constructor name and the model identifier already in use. Reuse it.

- [ ] **Step 4.2: Create labeling script**

Create `apps/web/scripts/label-toeic-skills.ts`:

```ts
#!/usr/bin/env tsx
/**
 * One-time job: send each unlabeled toeic_question to Gemini and ask for skillIds
 * from the TOEIC taxonomy. Idempotent: skips rows that already have skillIds.
 *
 * Run:  pnpm tsx apps/web/scripts/label-toeic-skills.ts
 */
import { db } from "@/lib/db";
import { toeicQuestion } from "@repo/database";
import { eq, sql } from "drizzle-orm";
import { TOEIC_SKILLS, getSkillsByPart } from "@repo/contracts";
// Adjust this import to whatever client wrapper exists
import { openai } from "@/lib/openai/client";

const MODEL = "gemini-2.5-flash";
const BATCH_SIZE = 50;

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
	const correctOption = q.options[q.correctIndex];
	return `You are labeling a TOEIC question with skill IDs from a fixed taxonomy.

Question (Part ${q.part}):
${q.questionText ?? "(no text — likely Part 1 photo or Part 2 audio-only)"}

Options:
${q.options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join("\n")}

Correct: ${String.fromCharCode(65 + q.correctIndex)}. ${correctOption}

Vietnamese explanation:
${q.explanationVi ?? "(none)"}

Allowed skill IDs for Part ${q.part}: ${skillsForPart}

Return ONLY a JSON array of 1 to 2 skill IDs from the allowed list, ordered most relevant first. No prose.

Example: ["toeic.part5.verb_form"]`;
}

async function labelOne(q: Row): Promise<string[]> {
	const res = await openai.chat.completions.create({
		model: MODEL,
		messages: [{ role: "user", content: buildPrompt(q) }],
		response_format: { type: "json_object" } as never, // Gemini supports json mode via OpenAI compat
		temperature: 0,
	});
	const raw = res.choices[0]?.message.content ?? "[]";
	try {
		// Tolerate either bare array or {"skills":[...]}
		const parsed = JSON.parse(raw);
		const arr: string[] = Array.isArray(parsed) ? parsed : (parsed.skills ?? []);
		return arr.filter((s) => (TOEIC_SKILLS as readonly string[]).includes(s)).slice(0, 2);
	} catch {
		return [];
	}
}

async function main() {
	const rows = await db
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

	console.log(`Found ${rows.length} unlabeled questions`);

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
					console.error(`Failed ${q.id}:`, err);
					return { id: q.id, ok: false };
				}
			}),
		);
		for (const r of results) {
			if (r.ok) ok++;
			else fail++;
		}
		console.log(`Progress: ${i + batch.length}/${rows.length} (ok=${ok}, fail=${fail})`);
	}

	console.log(`Done. ok=${ok}, fail=${fail}`);
}

main()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
```

- [ ] **Step 4.3: Add npm script**

In `apps/web/package.json` `"scripts"`:

```json
"label:toeic": "tsx scripts/label-toeic-skills.ts"
```

- [ ] **Step 4.4: Manual sample review (50 questions)**

Before running on the full set, label 50 random questions, then spot-check:

Add a `--limit=50` CLI flag to the script (simple `process.argv` parsing) and run it. Then:

```bash
psql "$DATABASE_URL" -c "SELECT part, question_text, options, skill_ids FROM toeic_question WHERE jsonb_array_length(skill_ids) > 0 ORDER BY random() LIMIT 50;" > /tmp/toeic-label-sample.txt
```

Open the file, verify ≥40/50 have plausibly correct labels. If quality is below threshold, revise the prompt in `buildPrompt` and re-run on the same 50.

- [ ] **Step 4.5: Run on full set**

```bash
cd apps/web && pnpm label:toeic
```

Expected: ~10-30 minutes, total cost ~$1-2 with `gemini-2.5-flash`.

- [ ] **Step 4.6: Verify coverage**

```bash
psql "$DATABASE_URL" -c "SELECT count(*) FILTER (WHERE jsonb_array_length(skill_ids) > 0) AS labeled, count(*) AS total FROM toeic_question;"
```

Expected: labeled ≥ 95% of total.

- [ ] **Step 4.7: Commit**

```bash
git add apps/web/scripts/label-toeic-skills.ts apps/web/package.json
git commit -m "feat(toeic): auto-label question subskills via Gemini"
```

---

## Task 5: Refactor `useToeicPractice` → generic `useToeicSession`

**Files:**
- Create: `apps/web/hooks/useToeicSession.ts`
- Modify: `apps/web/hooks/useToeicPractice.ts`

The goal: extract the generic question-runner state machine so practice, diagnostic, mock test, and drill all share it. `useToeicPractice` becomes a thin config wrapper.

- [ ] **Step 5.1: Read existing hook fully**

```bash
cat apps/web/hooks/useToeicPractice.ts
```

Identify the state machine: `state: "idle" | "loading" | "active" | "review"`, the question array, the answer log, the timer, the start/answer/next/reset handlers.

- [ ] **Step 5.2: Create `useToeicSession`**

Create `apps/web/hooks/useToeicSession.ts`:

```ts
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { api } from "@/lib/api-client";

export type ToeicSessionMode = "practice" | "mock_test" | "diagnostic" | "drill";

export type ToeicSessionQuestion = {
	id: string;
	part: number;
	questionText: string | null;
	passageText: string | null;
	options: string[];
	correctIndex: number; // present only when reveal allowed (practice/diagnostic-result)
	explanationEn: string | null;
	explanationVi: string | null;
	audioUrl: string | null;
	imageUrls: string[] | null;
	skillIds: string[];
	topic: string | null;
	parentId: string | null;
	groupOrder: number | null;
	number: number;
	examCode: string | null;
};

export type ToeicSessionState = "idle" | "loading" | "active" | "submitting" | "completed";

export type SessionStartParams = {
	mode: ToeicSessionMode;
	examCode?: string;
	part?: number | "listening" | "reading" | "all";
	count?: number;
	timeLimit?: number; // ms — null/undefined = no limit
};

export type SessionAnswer = {
	questionId: string;
	selectedIndex: number | null;
	isCorrect: boolean | null;
	durationMs: number;
};

export function useToeicSession() {
	const [state, setState] = useState<ToeicSessionState>("idle");
	const [attemptId, setAttemptId] = useState<string | null>(null);
	const [questions, setQuestions] = useState<ToeicSessionQuestion[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [answers, setAnswers] = useState<SessionAnswer[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [startedAt, setStartedAt] = useState<number | null>(null);
	const [completedAt, setCompletedAt] = useState<number | null>(null);
	const [score, setScore] = useState<{ correct: number; total: number } | null>(null);
	const questionShownAt = useRef<number>(0);

	const start = useCallback(async (params: SessionStartParams) => {
		setState("loading");
		setError(null);
		try {
			const res = await api.post<{
				attemptId: string;
				questions: ToeicSessionQuestion[];
			}>("/api/toeic-practice/start", params);
			setAttemptId(res.attemptId);
			setQuestions(res.questions);
			setAnswers([]);
			setCurrentIndex(0);
			setStartedAt(Date.now());
			setCompletedAt(null);
			setScore(null);
			setState("active");
			questionShownAt.current = Date.now();
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Failed to start session");
			setState("idle");
		}
	}, []);

	const answer = useCallback(
		async (selectedIndex: number | null) => {
			if (state !== "active" || !attemptId) return;
			const q = questions[currentIndex];
			if (!q) return;
			const durationMs = Date.now() - questionShownAt.current;
			const isCorrect = selectedIndex === null ? null : selectedIndex === q.correctIndex;

			const localAnswer: SessionAnswer = { questionId: q.id, selectedIndex, isCorrect, durationMs };
			setAnswers((prev) => [...prev, localAnswer]);

			// Fire-and-forget; UI doesn't block on server.
			void api.post("/api/toeic-practice/answer", {
				attemptId,
				questionId: q.id,
				selectedIndex,
				durationMs,
			});
		},
		[state, attemptId, questions, currentIndex],
	);

	const next = useCallback(() => {
		setCurrentIndex((idx) => Math.min(idx + 1, questions.length - 1));
		questionShownAt.current = Date.now();
	}, [questions.length]);

	const complete = useCallback(async () => {
		if (!attemptId) return;
		setState("submitting");
		try {
			const res = await api.post<{
				correct: number;
				total: number;
				baselineSnapshot?: Record<string, number>;
			}>("/api/toeic-practice/complete", { attemptId });
			setScore({ correct: res.correct, total: res.total });
			setCompletedAt(Date.now());
			setState("completed");
			return res;
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Failed to submit");
			setState("active");
			return null;
		}
	}, [attemptId]);

	const reset = useCallback(() => {
		setState("idle");
		setAttemptId(null);
		setQuestions([]);
		setAnswers([]);
		setCurrentIndex(0);
		setStartedAt(null);
		setCompletedAt(null);
		setScore(null);
		setError(null);
	}, []);

	return {
		state,
		attemptId,
		questions,
		currentQuestion: questions[currentIndex] ?? null,
		currentIndex,
		answers,
		score,
		error,
		startedAt,
		completedAt,
		start,
		answer,
		next,
		complete,
		reset,
	};
}
```

- [ ] **Step 5.3: Refactor `useToeicPractice` to wrap `useToeicSession`**

Replace `apps/web/hooks/useToeicPractice.ts` with:

```ts
"use client";

import { useState } from "react";
import { useToeicSession } from "./useToeicSession";

export type ToeicPartFilter = "3" | "4" | "5" | "6" | "7" | "listening" | "reading" | "all";

export function useToeicPractice() {
	const session = useToeicSession();
	const [selectedExam, setSelectedExam] = useState<string>("random");
	const [selectedPart, setSelectedPart] = useState<ToeicPartFilter>("all");
	const [questionCount, setQuestionCount] = useState(10);

	const startPractice = () =>
		session.start({
			mode: "practice",
			examCode: selectedExam === "random" ? undefined : selectedExam,
			part: selectedPart === "all" ? "all" : selectedPart,
			count: questionCount,
		});

	const retryWrong = () => {
		const wrongIds = session.answers.filter((a) => a.isCorrect === false).map((a) => a.questionId);
		// Future enhancement: backend endpoint to start a session from explicit IDs.
		// For now, simply re-run a practice with the same filter.
		session.reset();
		startPractice();
		// TODO: when /api/toeic-practice/start supports `questionIds: string[]`, pass wrongIds.
	};

	return {
		...session,
		selectedExam,
		setSelectedExam,
		selectedPart,
		setSelectedPart,
		questionCount,
		setQuestionCount,
		startPractice,
		retryWrong,
		// Backwards-compat aliases
		isRevealed: false, // existing UI flag — wire up if reveal mode used
		selectedAnswer: null,
		answerQuestion: session.answer,
		nextQuestion: session.next,
		resetPractice: session.reset,
		startTime: session.startedAt,
		endTime: session.completedAt,
		history: [],
	};
}
```

Note: the existing `toeic-practice/page.tsx` consumed several specific names (`isRevealed`, `selectedAnswer`, etc.). The aliases above keep the file compiling until Task 9 rewrites the page. The old localStorage history reading is dropped (will be migrated server-side in Task 13).

- [ ] **Step 5.4: Verify build**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: any errors come from the old page consuming things we haven't kept; if so, leave as-is and Task 9 will fix when the page is rewritten. If errors block the build entirely, comment out the consumer page temporarily with a `// FIXME: rewritten in Task 9` until then.

- [ ] **Step 5.5: Commit**

```bash
git add apps/web/hooks/useToeicSession.ts apps/web/hooks/useToeicPractice.ts
git commit -m "refactor(toeic): extract useToeicSession from useToeicPractice"
```

---

## Task 6: API endpoints — start, questions, exams, attempt[id]

**Files:**
- Create: `apps/web/app/api/toeic-practice/start/route.ts`
- Create: `apps/web/app/api/toeic-practice/questions/route.ts`
- Create: `apps/web/app/api/toeic-practice/exams/route.ts`
- Create: `apps/web/app/api/toeic-practice/attempt/[id]/route.ts`
- Create: `apps/web/lib/toeic/event-emitter.ts` (used in Task 7 too)

This task ships the routes that don't touch the event pipeline. Task 7 adds `/answer` and `/complete` which do.

- [ ] **Step 6.1: Inspect auth pattern**

```bash
grep -l "auth.api.getSession" apps/web/app/api -r | head -3
cat $(grep -l "auth.api.getSession" apps/web/app/api -r | head -1)
```

Note the exact pattern for getting `session.user.id`.

- [ ] **Step 6.2: Create `start` route**

Create `apps/web/app/api/toeic-practice/start/route.ts`:

```ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { toeicAttempt, toeicExam, toeicQuestion } from "@repo/database";
import { and, eq, inArray, sql } from "drizzle-orm";

const BodySchema = z.object({
	mode: z.enum(["practice", "mock_test", "diagnostic", "drill"]),
	examCode: z.string().optional(),
	part: z.union([z.number().int().min(1).max(7), z.enum(["listening", "reading", "all"])]).optional(),
	count: z.number().int().min(1).max(200).default(10),
});

export async function POST(req: Request) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

	const body = BodySchema.parse(await req.json());
	const userId = session.user.id;

	// Resolve exam (or pick randomly across all if examCode missing)
	let examIdFilter: string | undefined;
	if (body.examCode && body.mode !== "drill") {
		const [exam] = await db.select().from(toeicExam).where(eq(toeicExam.code, body.examCode)).limit(1);
		if (!exam) return NextResponse.json({ error: "exam not found" }, { status: 404 });
		examIdFilter = exam.id;
	}

	// Determine part filter
	let partInClause: number[] | null = null;
	if (typeof body.part === "number") partInClause = [body.part];
	else if (body.part === "listening") partInClause = [1, 2, 3, 4];
	else if (body.part === "reading") partInClause = [5, 6, 7];
	// "all" or undefined → no filter

	// Special: diagnostic always uses diagnostic_v1
	if (body.mode === "diagnostic") {
		const [diag] = await db.select().from(toeicExam).where(eq(toeicExam.code, "diagnostic_v1")).limit(1);
		if (!diag) return NextResponse.json({ error: "diagnostic not seeded" }, { status: 500 });
		examIdFilter = diag.id;
	}

	// Mock test: 200 questions, no part filter, requires exam
	const targetCount = body.mode === "mock_test" ? 200 : body.mode === "diagnostic" ? 30 : body.count;

	// Fetch questions
	const conditions = [];
	if (examIdFilter) conditions.push(eq(toeicQuestion.examId, examIdFilter));
	if (partInClause) conditions.push(inArray(toeicQuestion.part, partInClause));

	const rows = await db
		.select()
		.from(toeicQuestion)
		.where(conditions.length ? and(...conditions) : undefined)
		.orderBy(body.mode === "mock_test" || body.mode === "diagnostic" ? toeicQuestion.number : sql`random()`)
		.limit(targetCount);

	if (rows.length === 0) return NextResponse.json({ error: "no questions found" }, { status: 404 });

	// Create attempt
	const [attempt] = await db
		.insert(toeicAttempt)
		.values({
			userId,
			mode: body.mode,
			examId: examIdFilter ?? null,
			partFilter: typeof body.part === "number" ? body.part : null,
			questionCount: rows.length,
		})
		.returning();

	// Strip correctIndex from response for mock/diagnostic; reveal allowed for practice/drill
	const reveal = body.mode === "practice" || body.mode === "drill";
	const questionsForClient = rows.map((q) => ({
		id: q.id,
		part: q.part,
		questionText: q.questionText,
		passageText: q.passageText,
		options: q.options,
		correctIndex: reveal ? q.correctIndex : -1,
		explanationEn: reveal ? q.explanationEn : null,
		explanationVi: reveal ? q.explanationVi : null,
		audioUrl: q.audioUrl,
		imageUrls: q.imageUrls,
		skillIds: q.skillIds,
		topic: q.topic,
		parentId: q.parentId,
		groupOrder: q.groupOrder,
		number: q.number,
		examCode: body.examCode ?? null,
	}));

	return NextResponse.json({ attemptId: attempt.id, questions: questionsForClient });
}
```

- [ ] **Step 6.3: Create `questions` route (GET, filter)**

Create `apps/web/app/api/toeic-practice/questions/route.ts`:

```ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { toeicQuestion, toeicExam } from "@repo/database";
import { and, eq, inArray, sql } from "drizzle-orm";

const QuerySchema = z.object({
	exam: z.string().optional(),
	part: z.string().optional(),
	count: z.coerce.number().int().min(1).max(100).default(10),
	shuffle: z.coerce.boolean().default(true),
	skill: z.string().optional(), // single skillId filter
});

export async function GET(req: Request) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

	const url = new URL(req.url);
	const params = QuerySchema.parse(Object.fromEntries(url.searchParams));

	const conditions = [];
	if (params.exam) {
		const [exam] = await db.select().from(toeicExam).where(eq(toeicExam.code, params.exam)).limit(1);
		if (!exam) return NextResponse.json({ questions: [] });
		conditions.push(eq(toeicQuestion.examId, exam.id));
	}
	if (params.part) {
		const p = parseInt(params.part, 10);
		if (!Number.isNaN(p)) conditions.push(eq(toeicQuestion.part, p));
	}
	if (params.skill) {
		conditions.push(sql`${toeicQuestion.skillIds} ?? ${params.skill}`);
	}

	const rows = await db
		.select()
		.from(toeicQuestion)
		.where(conditions.length ? and(...conditions) : undefined)
		.orderBy(params.shuffle ? sql`random()` : toeicQuestion.number)
		.limit(params.count);

	return NextResponse.json({ questions: rows });
}
```

- [ ] **Step 6.4: Create `exams` route**

Create `apps/web/app/api/toeic-practice/exams/route.ts`:

```ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toeicExam } from "@repo/database";
import { asc } from "drizzle-orm";

export async function GET() {
	const exams = await db.select().from(toeicExam).orderBy(asc(toeicExam.year), asc(toeicExam.code));
	return NextResponse.json({ exams });
}
```

- [ ] **Step 6.5: Create `attempt/[id]` route**

Create `apps/web/app/api/toeic-practice/attempt/[id]/route.ts`:

```ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { toeicAttempt, toeicAnswer, toeicQuestion } from "@repo/database";
import { eq, and } from "drizzle-orm";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

	const { id } = await params;
	const [attempt] = await db
		.select()
		.from(toeicAttempt)
		.where(and(eq(toeicAttempt.id, id), eq(toeicAttempt.userId, session.user.id)))
		.limit(1);

	if (!attempt) return NextResponse.json({ error: "not found" }, { status: 404 });

	const answers = await db.select().from(toeicAnswer).where(eq(toeicAnswer.attemptId, id));

	// Re-fetch questions in case the user wants to review with explanations
	const questionIds = answers.map((a) => a.questionId);
	const questions = questionIds.length
		? await db.select().from(toeicQuestion).where(eq(toeicQuestion.id, questionIds[0])) // placeholder; replace with inArray
		: [];

	return NextResponse.json({ attempt, answers, questions });
}
```

Replace the placeholder line with:

```ts
import { inArray } from "drizzle-orm";
// ...
const questions = questionIds.length
	? await db.select().from(toeicQuestion).where(inArray(toeicQuestion.id, questionIds))
	: [];
```

- [ ] **Step 6.6: Smoke test routes**

Start dev server in another terminal: `cd apps/web && pnpm dev`. Then:

```bash
curl -s http://localhost:3000/api/toeic-practice/exams | jq
curl -s -X POST http://localhost:3000/api/toeic-practice/start \
  -H "content-type: application/json" \
  -H "cookie: $(cat ~/.your-session-cookie 2>/dev/null)" \
  -d '{"mode":"practice","count":3,"part":5}' | jq
```

(Auth cookie required; run from a logged-in browser session and copy the cookie if needed, or temporarily comment out the auth check.)

Expected: `exams` returns the seeded exams; `start` returns `{attemptId, questions: [...]}` with 3 Part 5 questions.

- [ ] **Step 6.7: Commit**

```bash
git add apps/web/app/api/toeic-practice/start \
        apps/web/app/api/toeic-practice/questions \
        apps/web/app/api/toeic-practice/exams \
        apps/web/app/api/toeic-practice/attempt
git commit -m "feat(api): add TOEIC start/questions/exams/attempt endpoints"
```

---

## Task 7: Event pipeline — `answer` and `complete` endpoints

This is the keystone task. After this, every TOEIC answer flows into `learningEvent`, which the existing learning engine reads.

**Files:**
- Create: `apps/web/lib/toeic/event-emitter.ts`
- Create: `apps/web/app/api/toeic-practice/answer/route.ts`
- Create: `apps/web/app/api/toeic-practice/complete/route.ts`

- [ ] **Step 7.1: Locate the existing `learning-event-query-service`**

```bash
cat packages/database/src/queries/learning-event-query-service.ts | head -80
cat packages/modules/src/learning/record-learning-event.ts | head -80
```

Identify the function used elsewhere to record events (`recordLearningEvent` is most likely). Note its signature.

- [ ] **Step 7.2: Locate the existing `review-scheduler` enqueue function**

```bash
cat packages/modules/src/learning/review-scheduler.ts | head -80
```

Identify the enqueue function (likely `scheduleReviewTask` or similar) and its expected input.

- [ ] **Step 7.3: Locate `mastery-engine` update**

```bash
cat packages/modules/src/learning/mastery-engine.ts | head -80
```

Identify the function that processes a single signal (likely `updateMastery(userId, skillId, correctness, ...)`).

- [ ] **Step 7.4: Create event-emitter helper**

Create `apps/web/lib/toeic/event-emitter.ts`:

```ts
import { recordLearningEvent } from "@repo/modules";
import { scheduleReviewTask } from "@repo/modules";
import { updateMasteryFromEvent } from "@repo/modules";
import { logger } from "@/lib/logger";
import crypto from "node:crypto";

// Adjust the imports above to match the actual exported names found in step 7.1-7.3.

export type EmitToeicEventInput = {
	userId: string;
	moduleType: "toeic_practice" | "toeic_mock_test" | "toeic_diagnostic";
	attemptId: string;
	questionId: string;
	skillIds: string[];
	isCorrect: boolean | null; // null = skipped
	durationMs: number;
	difficulty: string;
	sessionId: string;
};

export async function emitToeicLearningEvent(input: EmitToeicEventInput): Promise<void> {
	const idempotencyKey = `toeic:${input.attemptId}:${input.questionId}`;

	const result =
		input.isCorrect === null
			? "neutral"
			: input.isCorrect
				? "correct"
				: "incorrect";
	const score = input.isCorrect === null ? null : input.isCorrect ? 1 : 0;

	try {
		await recordLearningEvent({
			userId: input.userId,
			sessionId: input.sessionId,
			moduleType: input.moduleType,
			contentId: input.questionId,
			skillIds: input.skillIds,
			attemptId: input.attemptId,
			eventType: "answer_graded",
			result,
			score,
			durationMs: input.durationMs,
			difficulty: input.difficulty,
			errorTags: [],
			timestamp: new Date().toISOString(),
			idempotencyKey,
		});
	} catch (err) {
		logger.error({ err, input }, "toeic.event.record_failed");
	}

	// Fan-out: review task on incorrect, mastery update always (when skill known)
	if (input.skillIds.length > 0 && input.isCorrect !== null) {
		try {
			await updateMasteryFromEvent({
				userId: input.userId,
				skillIds: input.skillIds,
				correct: input.isCorrect,
				difficulty: input.difficulty,
				durationMs: input.durationMs,
			});
		} catch (err) {
			logger.error({ err }, "toeic.event.mastery_failed");
		}

		if (input.isCorrect === false) {
			try {
				await scheduleReviewTask({
					userId: input.userId,
					sourceType: "error_retry",
					sourceId: input.questionId,
					skillIds: input.skillIds,
					reviewMode: "recognition",
					initialDueInHours: 24,
				});
			} catch (err) {
				logger.error({ err }, "toeic.event.review_task_failed");
			}
		}
	}
}
```

If any of the imported functions don't exist with those exact names, replace with the actual names found in steps 7.1–7.3. Where signatures don't quite match, adapt the call site rather than changing the engine.

- [ ] **Step 7.5: Create `answer` route**

Create `apps/web/app/api/toeic-practice/answer/route.ts`:

```ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { toeicAnswer, toeicAttempt, toeicQuestion } from "@repo/database";
import { and, eq } from "drizzle-orm";
import { emitToeicLearningEvent } from "@/lib/toeic/event-emitter";

const BodySchema = z.object({
	attemptId: z.string().uuid(),
	questionId: z.string().uuid(),
	selectedIndex: z.number().int().min(0).max(3).nullable(),
	durationMs: z.number().int().min(0),
});

const MODE_TO_MODULE: Record<string, "toeic_practice" | "toeic_mock_test" | "toeic_diagnostic"> = {
	practice: "toeic_practice",
	mock_test: "toeic_mock_test",
	diagnostic: "toeic_diagnostic",
	drill: "toeic_practice",
};

export async function POST(req: Request) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

	const body = BodySchema.parse(await req.json());
	const userId = session.user.id;

	// Verify attempt ownership
	const [attempt] = await db
		.select()
		.from(toeicAttempt)
		.where(and(eq(toeicAttempt.id, body.attemptId), eq(toeicAttempt.userId, userId)))
		.limit(1);
	if (!attempt) return NextResponse.json({ error: "attempt not found" }, { status: 404 });
	if (attempt.completedAt) return NextResponse.json({ error: "attempt already completed" }, { status: 409 });

	const [question] = await db
		.select()
		.from(toeicQuestion)
		.where(eq(toeicQuestion.id, body.questionId))
		.limit(1);
	if (!question) return NextResponse.json({ error: "question not found" }, { status: 404 });

	const isCorrect = body.selectedIndex === null ? null : body.selectedIndex === question.correctIndex;

	// Idempotent insert: re-submitting same (attempt, question) updates instead.
	await db
		.insert(toeicAnswer)
		.values({
			attemptId: body.attemptId,
			questionId: body.questionId,
			selectedIndex: body.selectedIndex,
			isCorrect,
			durationMs: body.durationMs,
		})
		.onConflictDoUpdate({
			target: [toeicAnswer.attemptId, toeicAnswer.questionId],
			set: {
				selectedIndex: body.selectedIndex,
				isCorrect,
				durationMs: body.durationMs,
				changedCount: sql`${toeicAnswer.changedCount} + 1` as never,
			},
		});

	// Fire event pipeline (do not await fan-out failures blocking response)
	void emitToeicLearningEvent({
		userId,
		moduleType: MODE_TO_MODULE[attempt.mode] ?? "toeic_practice",
		attemptId: body.attemptId,
		questionId: body.questionId,
		skillIds: question.skillIds,
		isCorrect,
		durationMs: body.durationMs,
		difficulty: question.difficulty,
		sessionId: body.attemptId, // use attempt as session
	});

	return NextResponse.json({ ok: true, isCorrect });
}
```

Add the `sql` import: `import { and, eq, sql } from "drizzle-orm";`.

- [ ] **Step 7.6: Create `complete` route**

Create `apps/web/app/api/toeic-practice/complete/route.ts`:

```ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { toeicAttempt, toeicAnswer, toeicQuestion, onboardingBaseline, userSkillState } from "@repo/database";
import { and, eq, inArray, sql } from "drizzle-orm";
import { TOEIC_SKILLS } from "@repo/contracts";

const BodySchema = z.object({
	attemptId: z.string().uuid(),
});

export async function POST(req: Request) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

	const { attemptId } = BodySchema.parse(await req.json());
	const userId = session.user.id;

	const [attempt] = await db
		.select()
		.from(toeicAttempt)
		.where(and(eq(toeicAttempt.id, attemptId), eq(toeicAttempt.userId, userId)))
		.limit(1);
	if (!attempt) return NextResponse.json({ error: "not found" }, { status: 404 });
	if (attempt.completedAt) return NextResponse.json({ ok: true, alreadyCompleted: true });

	const answers = await db.select().from(toeicAnswer).where(eq(toeicAnswer.attemptId, attemptId));
	const correct = answers.filter((a) => a.isCorrect === true).length;
	const total = attempt.questionCount;

	// Compute per-skill baseline if diagnostic
	let baselineSnapshot: Record<string, number> | null = null;
	if (attempt.mode === "diagnostic") {
		const questions = answers.length
			? await db
					.select()
					.from(toeicQuestion)
					.where(inArray(toeicQuestion.id, answers.map((a) => a.questionId)))
			: [];
		const byQuestion = new Map(questions.map((q) => [q.id, q]));

		const skillStats = new Map<string, { correct: number; total: number }>();
		for (const a of answers) {
			const q = byQuestion.get(a.questionId);
			if (!q) continue;
			for (const s of q.skillIds) {
				const cur = skillStats.get(s) ?? { correct: 0, total: 0 };
				cur.total++;
				if (a.isCorrect === true) cur.correct++;
				skillStats.set(s, cur);
			}
		}

		baselineSnapshot = {};
		for (const skill of TOEIC_SKILLS) {
			const stats = skillStats.get(skill);
			// Score 0-100; default 50 if no signal
			baselineSnapshot[skill] = stats && stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 50;
		}

		// Persist baseline (extends existing onboardingBaseline row, or creates one)
		const existing = await db.select().from(onboardingBaseline).where(eq(onboardingBaseline.userId, userId)).limit(1);
		const baselineScores = Object.entries(baselineSnapshot).map(([skillId, score]) => ({
			skillId,
			score,
			confidence: skillStats.get(skillId)?.total ? 0.7 : 0.2,
		}));

		if (existing[0]) {
			// Merge — keep non-toeic.* entries, replace toeic.* ones
			const kept = (existing[0].baselineScores ?? []).filter((b) => !b.skillId.startsWith("toeic."));
			await db
				.update(onboardingBaseline)
				.set({ baselineScores: [...kept, ...baselineScores], updatedAt: new Date() })
				.where(eq(onboardingBaseline.userId, userId));
		} else {
			await db.insert(onboardingBaseline).values({
				userId,
				primaryGoal: "exam_prep",
				dailyTimeBudgetMinutes: "30",
				preferredLearningStyle: "mixed",
				baselineScores,
				placementSkipped: false,
			});
		}

		// Seed userSkillState for TOEIC skills
		for (const [skillId, score] of Object.entries(baselineSnapshot)) {
			const proficiency = score / 100;
			await db
				.insert(userSkillState)
				.values({
					userId,
					skillId,
					proficiency,
					confidence: skillStats.get(skillId)?.total ? 0.7 : 0.2,
					signalCount: skillStats.get(skillId)?.total ?? 0,
				})
				.onConflictDoUpdate({
					target: [userSkillState.userId, userSkillState.skillId],
					set: { proficiency, lastUpdatedAt: new Date() },
				});
		}
	}

	const startedAtMs = attempt.startedAt.getTime();
	const completedAtDate = new Date();
	await db
		.update(toeicAttempt)
		.set({
			completedAt: completedAtDate,
			durationMs: completedAtDate.getTime() - startedAtMs,
			rawListening: attempt.mode === "mock_test" ? null : null, // computed in #2
			rawReading: attempt.mode === "mock_test" ? null : null,
			baselineSnapshot,
		})
		.where(eq(toeicAttempt.id, attemptId));

	return NextResponse.json({ correct, total, baselineSnapshot });
}
```

- [ ] **Step 7.7: Smoke test the pipeline**

In a logged-in browser session (or via curl with cookie), start a practice session, answer a couple of questions, then complete:

```bash
# Start a 2-question practice
ATT=$(curl -s -X POST http://localhost:3000/api/toeic-practice/start \
  -H "content-type: application/json" -H "cookie: $COOKIE" \
  -d '{"mode":"practice","count":2,"part":5}' | jq -r .attemptId)

# Pick the first question — read attemptId & question.id from the response above
# Submit an answer (use real question id)
curl -X POST http://localhost:3000/api/toeic-practice/answer \
  -H "content-type: application/json" -H "cookie: $COOKIE" \
  -d "{\"attemptId\":\"$ATT\",\"questionId\":\"$QID\",\"selectedIndex\":0,\"durationMs\":5000}"

# Complete
curl -X POST http://localhost:3000/api/toeic-practice/complete \
  -H "content-type: application/json" -H "cookie: $COOKIE" \
  -d "{\"attemptId\":\"$ATT\"}"
```

Then verify the event landed:

```bash
psql "$DATABASE_URL" -c "SELECT module_type, content_id, result, skill_ids FROM learning_event WHERE attempt_id = '$ATT';"
```

Expected: 1+ rows with `module_type = 'toeic_practice'`.

```bash
psql "$DATABASE_URL" -c "SELECT source_type, source_id FROM review_task WHERE user_id = '$USER_ID' AND source_type = 'error_retry' ORDER BY created_at DESC LIMIT 3;"
```

Expected: review_task row(s) for any incorrect answers.

- [ ] **Step 7.8: Commit**

```bash
git add apps/web/lib/toeic/ apps/web/app/api/toeic-practice/answer apps/web/app/api/toeic-practice/complete
git commit -m "feat(toeic): wire answer/complete endpoints into learning event pipeline"
```

---

## Task 8: Diagnostic question set + builder script

**Files:**
- Create: `apps/web/scripts/build-diagnostic-set.ts`
- Modify: `apps/web/package.json`

- [ ] **Step 8.1: Create builder**

Create `apps/web/scripts/build-diagnostic-set.ts`:

```ts
#!/usr/bin/env tsx
/**
 * Builds the diagnostic_v1 exam by selecting 30 medium-difficulty questions
 * from the existing pool, covering all TOEIC subskills present (Parts 3-7).
 *
 * Re-runnable: replaces the diagnostic_v1 exam questions on each run.
 */
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { toeicExam, toeicQuestion } from "@repo/database";
import { eq, and, inArray, sql } from "drizzle-orm";

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

	// Upsert exam
	await db
		.insert(toeicExam)
		.values({
			id: examId,
			code: "diagnostic_v1",
			title: "TOEIC Diagnostic v1 (30Q · 20m)",
			source: "synthetic",
			year: null,
			totalQuestions: 30,
			partCounts: PART_QUOTAS as unknown as Record<string, number>,
			hasListening: true,
			hasReading: true,
		})
		.onConflictDoUpdate({
			target: toeicExam.code,
			set: { totalQuestions: 30, updatedAt: new Date() },
		});

	// Remove any existing diagnostic_v1 questions
	await db.delete(toeicQuestion).where(eq(toeicQuestion.examId, examId));

	// For each part, pick `quota` questions from the existing pool, prefer those with skillIds set
	let number = 1;
	for (const [partStr, quota] of Object.entries(PART_QUOTAS)) {
		const part = parseInt(partStr, 10);
		const candidates = await db
			.select()
			.from(toeicQuestion)
			.where(and(eq(toeicQuestion.part, part), sql`jsonb_array_length(${toeicQuestion.skillIds}) > 0`))
			.orderBy(sql`random()`)
			.limit(quota * 3);

		// Distribute by subskill to maximize coverage
		const seenSkills = new Set<string>();
		const picked: typeof candidates = [];
		for (const c of candidates) {
			if (picked.length >= quota) break;
			const newSkill = c.skillIds.find((s) => !seenSkills.has(s));
			if (newSkill || picked.length < quota - (candidates.length - picked.length)) {
				picked.push(c);
				c.skillIds.forEach((s) => seenSkills.add(s));
			}
		}
		// Top-up if we didn't fill quota
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
```

- [ ] **Step 8.2: Add npm script + run**

```json
"build:diagnostic": "tsx scripts/build-diagnostic-set.ts"
```

```bash
cd apps/web && pnpm build:diagnostic
psql "$DATABASE_URL" -c "SELECT count(*) FROM toeic_question WHERE exam_id = (SELECT id FROM toeic_exam WHERE code='diagnostic_v1');"
```

Expected: 30 rows.

- [ ] **Step 8.3: Commit**

```bash
git add apps/web/scripts/build-diagnostic-set.ts apps/web/package.json
git commit -m "feat(toeic): build diagnostic_v1 question set (30Q from pool)"
```

---

## Task 9: Hub layout, sub-routes, and gate

**Files:**
- Create: `apps/web/app/(app)/toeic/layout.tsx`
- Create: `apps/web/app/(app)/toeic/page.tsx`
- Create: `apps/web/app/(app)/toeic/_components/SubNav.tsx`
- Create: `apps/web/app/(app)/toeic/_components/HubWidgets.tsx`
- Create: `apps/web/app/(app)/toeic/_components/QuickActions.tsx`
- Create: `apps/web/app/(app)/toeic/diagnostic/page.tsx`
- Create: `apps/web/app/(app)/toeic/diagnostic/_components/DiagnosticIntro.tsx`
- Create: `apps/web/app/(app)/toeic/diagnostic/_components/DiagnosticResult.tsx`
- Create: `apps/web/app/(app)/toeic/practice/page.tsx`
- Create: `apps/web/app/(app)/toeic/practice/_components/PracticeSetup.tsx`
- Create: `apps/web/app/(app)/toeic/practice/_components/QuestionRunner.tsx`
- Create: `apps/web/app/(app)/toeic/practice/_components/ResultSummary.tsx`
- Create: `apps/web/app/(app)/toeic/skills/page.tsx`

This task is large; split into per-file commits.

- [ ] **Step 9.1: Layout shell with first-visit gate**

Create `apps/web/app/(app)/toeic/layout.tsx`:

```tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { onboardingBaseline } from "@repo/database";
import { eq } from "drizzle-orm";
import { SubNav } from "./_components/SubNav";

export default async function ToeicLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) redirect("/sign-in");

	const path = (await headers()).get("x-pathname") ?? ""; // if available; else compute via segment

	// First-visit gate: any toeic.* baseline score present?
	const [baseline] = await db
		.select()
		.from(onboardingBaseline)
		.where(eq(onboardingBaseline.userId, session.user.id))
		.limit(1);

	const hasToeicBaseline = baseline?.baselineScores?.some((s) => s.skillId.startsWith("toeic.")) ?? false;

	// If we can't determine the path from headers, this gate runs only when the user
	// is not already on /toeic/diagnostic. The route group ensures /toeic/diagnostic
	// renders without itself triggering an infinite redirect — child page will check.

	return (
		<div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, flex: 1 }}>
			<SubNav hasBaseline={hasToeicBaseline} />
			{children}
		</div>
	);
}
```

Note: server-component redirect from layout to a sibling segment can loop. The cleaner pattern is a shared utility called from each page (or use Next.js middleware). To avoid the loop, do this:

- Layout exposes `hasBaseline` to children via context or by passing a flag.
- Each page (`/toeic/page.tsx`, `/toeic/practice/page.tsx`, `/toeic/skills/page.tsx`) calls a `requireBaselineOrRedirect()` helper that checks and redirects to `/toeic/diagnostic` if missing.
- `/toeic/diagnostic/page.tsx` does NOT call the helper.

Refactor: instead of redirect-in-layout, create:

```ts
// apps/web/lib/toeic/require-baseline.ts
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { onboardingBaseline } from "@repo/database";
import { eq } from "drizzle-orm";

export async function requireToeicBaseline(): Promise<void> {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) redirect("/sign-in");

	const [baseline] = await db
		.select()
		.from(onboardingBaseline)
		.where(eq(onboardingBaseline.userId, session.user.id))
		.limit(1);

	const hasToeic = baseline?.baselineScores?.some((s) => s.skillId.startsWith("toeic.")) ?? false;
	if (!hasToeic) redirect("/toeic/diagnostic");
}
```

And drop the gate from the layout. Update `layout.tsx` to just render the SubNav + children, no gate logic.

- [ ] **Step 9.2: SubNav component**

Create `apps/web/app/(app)/toeic/_components/SubNav.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
	{ href: "/toeic", label: "Tổng quan" },
	{ href: "/toeic/practice", label: "Luyện đề" },
	{ href: "/toeic/mock-test", label: "Mock test" },
	{ href: "/toeic/skills", label: "Skills" },
	{ href: "/toeic/progress", label: "Tiến độ" },
];

export function SubNav({ hasBaseline = true }: { hasBaseline?: boolean }) {
	const pathname = usePathname();
	if (!hasBaseline) return null; // diagnostic-only mode

	return (
		<nav style={{ display: "flex", gap: 4, padding: "8px 12px", borderBottom: "1px solid #1f2937", overflowX: "auto" }}>
			{TABS.map((t) => {
				const active = pathname === t.href || (t.href !== "/toeic" && pathname?.startsWith(t.href));
				return (
					<Link
						key={t.href}
						href={t.href}
						style={{
							padding: "6px 12px",
							borderRadius: 8,
							color: active ? "#fff" : "#94a3b8",
							background: active ? "#1f2937" : "transparent",
							fontWeight: active ? 600 : 400,
							textDecoration: "none",
							whiteSpace: "nowrap",
						}}
					>
						{t.label}
					</Link>
				);
			})}
		</nav>
	);
}
```

- [ ] **Step 9.3: Hub homepage**

Create `apps/web/app/(app)/toeic/page.tsx`:

```tsx
import { TrophyOutlined } from "@ant-design/icons";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { requireToeicBaseline } from "@/lib/toeic/require-baseline";
import { HubWidgets } from "./_components/HubWidgets";
import { QuickActions } from "./_components/QuickActions";

export default async function ToeicHubPage() {
	await requireToeicBaseline();

	return (
		<div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, flex: 1, overflow: "auto" }}>
			<ModuleHeader
				icon={<TrophyOutlined />}
				gradient="linear-gradient(135deg, #1a2332 0%, #2d3748 40%, #4a5568 100%)"
				title="TOEIC"
				subtitle="Target 800–900 · Lộ trình 16 tuần"
			/>
			<div style={{ padding: 16, display: "grid", gap: 16 }}>
				<HubWidgets />
				<QuickActions />
			</div>
		</div>
	);
}
```

- [ ] **Step 9.4: HubWidgets (placeholder data)**

Create `apps/web/app/(app)/toeic/_components/HubWidgets.tsx`:

```tsx
"use client";

import { Card } from "antd";

export function HubWidgets() {
	return (
		<div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
			<Card title="📊 Điểm dự đoán">
				<div style={{ color: "#94a3b8" }}>Hoàn thành 1 mock test để xem điểm dự đoán.</div>
			</Card>
			<Card title="🎯 Daily plan">
				<div style={{ color: "#94a3b8" }}>Daily plan sẽ xuất hiện sau khi bạn làm vài bài.</div>
			</Card>
			<Card title="🔥 Streak">
				<div style={{ fontSize: 28, fontWeight: 700 }}>—</div>
				<div style={{ color: "#94a3b8" }}>Bắt đầu để giữ streak.</div>
			</Card>
			<Card title="📚 Cần ôn lại">
				<div style={{ fontSize: 28, fontWeight: 700 }}>0</div>
				<div style={{ color: "#94a3b8" }}>Câu sai sẽ vào hàng đợi ôn.</div>
			</Card>
		</div>
	);
}
```

(Future tasks #8/#9 will replace placeholder data with live queries.)

- [ ] **Step 9.5: QuickActions**

Create `apps/web/app/(app)/toeic/_components/QuickActions.tsx`:

```tsx
"use client";

import Link from "next/link";
import { Card } from "antd";

const ACTIONS = [
	{ href: "/toeic/practice", label: "Luyện đề", emoji: "📝", available: true },
	{ href: "/toeic/mock-test", label: "Mock test 200 câu", emoji: "⏱️", available: false },
	{ href: "/toeic/skills", label: "4 kỹ năng", emoji: "🎯", available: true },
	{ href: "/toeic/listening", label: "Part 1 & 2", emoji: "🎧", available: false },
	{ href: "/toeic/dictation", label: "Dictation", emoji: "✍️", available: false },
	{ href: "/toeic/grammar", label: "Grammar drill", emoji: "📚", available: false },
	{ href: "/toeic/vocab", label: "Vocab", emoji: "🔤", available: false },
	{ href: "/toeic/speaking", label: "Speaking 11", emoji: "🗣️", available: false },
	{ href: "/toeic/writing", label: "Writing 8", emoji: "✏️", available: false },
];

export function QuickActions() {
	return (
		<Card title="Quick actions">
			<div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
				{ACTIONS.map((a) =>
					a.available ? (
						<Link
							key={a.href}
							href={a.href}
							style={{
								padding: 16,
								borderRadius: 10,
								background: "#1f2937",
								color: "#fff",
								textDecoration: "none",
								textAlign: "center",
							}}
						>
							<div style={{ fontSize: 22 }}>{a.emoji}</div>
							<div>{a.label}</div>
						</Link>
					) : (
						<div
							key={a.href}
							style={{
								padding: 16,
								borderRadius: 10,
								background: "#0f172a",
								color: "#475569",
								textAlign: "center",
								cursor: "not-allowed",
							}}
							title="Sắp ra mắt"
						>
							<div style={{ fontSize: 22 }}>{a.emoji}</div>
							<div>{a.label}</div>
							<div style={{ fontSize: 11, opacity: 0.6 }}>Sắp ra mắt</div>
						</div>
					),
				)}
			</div>
		</Card>
	);
}
```

- [ ] **Step 9.6: Diagnostic page**

Create `apps/web/app/(app)/toeic/diagnostic/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { TrophyOutlined } from "@ant-design/icons";
import { useToeicSession } from "@/hooks/useToeicSession";
import { DiagnosticIntro } from "./_components/DiagnosticIntro";
import { DiagnosticResult } from "./_components/DiagnosticResult";
import { QuestionRunner } from "../../toeic/practice/_components/QuestionRunner";

export default function DiagnosticPage() {
	const session = useToeicSession();
	const [baselineSnapshot, setBaselineSnapshot] = useState<Record<string, number> | null>(null);

	const handleStart = () => {
		void session.start({ mode: "diagnostic", count: 30, timeLimit: 20 * 60 * 1000 });
	};

	const handleComplete = async () => {
		const result = await session.complete();
		if (result?.baselineSnapshot) setBaselineSnapshot(result.baselineSnapshot);
	};

	return (
		<div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, flex: 1, overflow: "auto" }}>
			<ModuleHeader
				icon={<TrophyOutlined />}
				gradient="linear-gradient(135deg, #1a2332 0%, #2d3748 40%, #4a5568 100%)"
				title="Diagnostic Test"
				subtitle="30 câu · 20 phút · Phủ Part 3-7"
			/>
			<div style={{ padding: 16, flex: 1 }}>
				{session.state === "idle" && <DiagnosticIntro onStart={handleStart} />}
				{(session.state === "active" || session.state === "submitting") && (
					<QuestionRunner
						question={session.currentQuestion}
						currentIndex={session.currentIndex}
						total={session.questions.length}
						hideExplanation
						timeLimit={20 * 60 * 1000}
						onAnswer={(idx) => session.answer(idx)}
						onNext={session.next}
						onComplete={handleComplete}
					/>
				)}
				{session.state === "completed" && baselineSnapshot && (
					<DiagnosticResult snapshot={baselineSnapshot} score={session.score} />
				)}
			</div>
		</div>
	);
}
```

- [ ] **Step 9.7: DiagnosticIntro**

Create `apps/web/app/(app)/toeic/diagnostic/_components/DiagnosticIntro.tsx`:

```tsx
"use client";

import { Button, Card } from "antd";

export function DiagnosticIntro({ onStart }: { onStart: () => void }) {
	return (
		<Card title="Bài kiểm tra đầu vào TOEIC">
			<p>Bạn sẽ làm 30 câu trong 20 phút để xác định điểm khởi đầu của từng kỹ năng nhỏ.</p>
			<ul>
				<li>Phủ tất cả Part 3-7 (Part 1 & 2 sẽ thêm vào diagnostic_v2 ở sub-project sau)</li>
				<li>Không xem giải thích cho đến khi nộp</li>
				<li>Kết quả định hình lộ trình & gợi ý hằng ngày</li>
			</ul>
			<Button type="primary" size="large" onClick={onStart}>
				Bắt đầu
			</Button>
		</Card>
	);
}
```

- [ ] **Step 9.8: DiagnosticResult**

Create `apps/web/app/(app)/toeic/diagnostic/_components/DiagnosticResult.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { Button, Card, Tag } from "antd";
import { getSkillLabel, type ToeicSkill } from "@repo/contracts";

export function DiagnosticResult({
	snapshot,
	score,
}: {
	snapshot: Record<string, number>;
	score: { correct: number; total: number } | null;
}) {
	const router = useRouter();
	const entries = Object.entries(snapshot).sort((a, b) => a[1] - b[1]);
	const weakest = entries.slice(0, 3);
	const strongest = entries.slice(-3).reverse();

	return (
		<div style={{ display: "grid", gap: 12 }}>
			<Card title={`Kết quả: ${score?.correct ?? 0}/${score?.total ?? 30}`}>
				<p>Lộ trình của bạn sẽ tập trung vào các kỹ năng yếu nhất ở bên trái.</p>
			</Card>
			<Card title="3 kỹ năng yếu nhất (ưu tiên ôn)">
				<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
					{weakest.map(([skill, score]) => (
						<Tag key={skill} color="red">
							{getSkillLabel(skill as ToeicSkill)} · {score}/100
						</Tag>
					))}
				</div>
			</Card>
			<Card title="3 kỹ năng mạnh nhất">
				<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
					{strongest.map(([skill, score]) => (
						<Tag key={skill} color="green">
							{getSkillLabel(skill as ToeicSkill)} · {score}/100
						</Tag>
					))}
				</div>
			</Card>
			<Button type="primary" size="large" onClick={() => router.push("/toeic")}>
				Bắt đầu lộ trình
			</Button>
		</div>
	);
}
```

- [ ] **Step 9.9: Practice page (server) + setup component**

Create `apps/web/app/(app)/toeic/practice/page.tsx`:

```tsx
import { TrophyOutlined } from "@ant-design/icons";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { requireToeicBaseline } from "@/lib/toeic/require-baseline";
import { PracticeRunner } from "./_components/PracticeRunner";

export default async function PracticePage() {
	await requireToeicBaseline();

	return (
		<div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, flex: 1, overflow: "auto" }}>
			<ModuleHeader
				icon={<TrophyOutlined />}
				gradient="linear-gradient(135deg, #1a2332 0%, #2d3748 40%, #4a5568 100%)"
				title="TOEIC Practice"
				subtitle="Luyện đề ETS · Part 3-7"
			/>
			<div style={{ padding: 16, flex: 1 }}>
				<PracticeRunner />
			</div>
		</div>
	);
}
```

Create `apps/web/app/(app)/toeic/practice/_components/PracticeRunner.tsx`:

```tsx
"use client";

import { useToeicPractice } from "@/hooks/useToeicPractice";
import { PracticeSetup } from "./PracticeSetup";
import { QuestionRunner } from "./QuestionRunner";
import { ResultSummary } from "./ResultSummary";

export function PracticeRunner() {
	const tp = useToeicPractice();

	if (tp.state === "idle") {
		return (
			<PracticeSetup
				selectedExam={tp.selectedExam}
				setSelectedExam={tp.setSelectedExam}
				selectedPart={tp.selectedPart}
				setSelectedPart={tp.setSelectedPart}
				questionCount={tp.questionCount}
				setQuestionCount={tp.setQuestionCount}
				onStart={tp.startPractice}
			/>
		);
	}

	if (tp.state === "completed") {
		return <ResultSummary score={tp.score} answers={tp.answers} onRetryWrong={tp.retryWrong} onReset={tp.resetPractice} />;
	}

	return (
		<QuestionRunner
			question={tp.currentQuestion}
			currentIndex={tp.currentIndex}
			total={tp.questions.length}
			onAnswer={tp.answer}
			onNext={tp.next}
			onComplete={tp.complete}
		/>
	);
}
```

- [ ] **Step 9.10: PracticeSetup, QuestionRunner, ResultSummary stubs**

These components mirror the structure of the existing 576-line `apps/web/app/(app)/toeic-practice/page.tsx` but split. Read that file fully and port the relevant JSX into these three components.

`PracticeSetup.tsx` — exam picker + part picker + count picker + Start button.
`QuestionRunner.tsx` — renders the current question (text/image/audio/options), tracks selection, exposes optional `timeLimit`, `hideExplanation` props for diagnostic/mock reuse.
`ResultSummary.tsx` — score, list of wrong answers with explanations, "Retry wrong" / "Reset" buttons.

Each component should be under 200 lines. Commit them individually as you complete them (so a partial run is salvageable).

- [ ] **Step 9.11: Skills page (port)**

Create `apps/web/app/(app)/toeic/skills/page.tsx` by copying the existing `apps/web/app/(app)/toeic-skills/page.tsx` and updating any internal links to point to `/toeic/skills/...`. Also surface a banner pointing to features still being built.

- [ ] **Step 9.12: Verify dev render**

```bash
cd apps/web && pnpm dev
```

Visit:
- `/toeic` — should redirect to `/toeic/diagnostic` if no baseline.
- `/toeic/diagnostic` — should render intro.
- After completing diagnostic → `/toeic` should render hub homepage.
- `/toeic/practice` — should render setup page.

Iterate on console errors until all three render cleanly.

- [ ] **Step 9.13: Commit**

Commits per file as you go (`feat(toeic): hub layout`, `feat(toeic): diagnostic flow`, `feat(toeic): practice runner`, etc.). Final commit at end of task:

```bash
git add apps/web/app/(app)/toeic apps/web/lib/toeic/require-baseline.ts
git commit -m "feat(toeic): unified /toeic hub with diagnostic gate"
```

---

## Task 10: 308 redirects from old routes

**Files:**
- Modify: `apps/web/next.config.ts` (or `.js`)
- Delete: `apps/web/app/(app)/toeic-practice/`
- Delete: `apps/web/app/(app)/toeic-skills/`

- [ ] **Step 10.1: Add redirects**

Open `apps/web/next.config.ts` (or whatever extension exists). Add a `redirects` async function:

```ts
async redirects() {
	return [
		{ source: "/toeic-practice", destination: "/toeic/practice", permanent: true },
		{ source: "/toeic-practice/:path*", destination: "/toeic/practice/:path*", permanent: true },
		{ source: "/toeic-skills", destination: "/toeic/skills", permanent: true },
		{ source: "/toeic-skills/:path*", destination: "/toeic/skills/:path*", permanent: true },
	];
}
```

If `redirects` already exists, merge the entries.

- [ ] **Step 10.2: Delete the old route directories**

```bash
rm -rf apps/web/app/\(app\)/toeic-practice
rm -rf apps/web/app/\(app\)/toeic-skills
```

- [ ] **Step 10.3: Verify**

Restart dev server, then:

```bash
curl -sI http://localhost:3000/toeic-practice | head -3
```

Expected: `HTTP/1.1 308 Permanent Redirect` with `Location: /toeic/practice`.

- [ ] **Step 10.4: Commit**

```bash
git add apps/web/next.config.ts apps/web/app/\(app\)/toeic-practice apps/web/app/\(app\)/toeic-skills
git commit -m "chore(toeic): redirect old routes to /toeic/* and remove dead pages"
```

---

## Task 11: Sidebar consolidation

**Files:**
- Modify: wherever the app sidebar is defined — likely `apps/web/components/shared/` or `apps/web/app/(app)/layout.tsx`.

- [ ] **Step 11.1: Locate sidebar**

```bash
grep -rn "toeic-practice" apps/web/components apps/web/app | grep -v node_modules
grep -rn "toeic-skills" apps/web/components apps/web/app | grep -v node_modules
```

Identify the menu definition file.

- [ ] **Step 11.2: Replace two entries with one**

In the menu items array, remove the entries pointing at `/toeic-practice` and `/toeic-skills`. Add a single entry:

```ts
{
	key: "toeic",
	label: "TOEIC",
	href: "/toeic",
	icon: <TrophyOutlined />,
}
```

If a badge slot exists, add `badge: 0` (will be wired to `reviewTask` count in #8).

- [ ] **Step 11.3: Verify**

Reload the app. Sidebar shows a single TOEIC entry that points to `/toeic`. Click it; the layout gate sends you through the diagnostic if needed.

- [ ] **Step 11.4: Commit**

```bash
git add <sidebar files>
git commit -m "chore(sidebar): consolidate TOEIC entries into single /toeic link"
```

---

## Task 12: localStorage history migration (best-effort, optional)

**Files:**
- Create: `apps/web/app/api/toeic-practice/import-history/route.ts`
- Modify: `apps/web/hooks/useToeicSession.ts` (one-shot import on mount)

This task is **optional** — defer or drop if running short on time. The new system will accumulate fresh attempt data quickly.

- [ ] **Step 12.1: Create endpoint**

Create `apps/web/app/api/toeic-practice/import-history/route.ts`:

```ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { toeicAttempt } from "@repo/database";

const HistoryEntrySchema = z.object({
	date: z.string(),
	examName: z.string(),
	part: z.string(),
	score: z.number(),
	total: z.number(),
	timeMs: z.number(),
});

const BodySchema = z.object({ entries: z.array(HistoryEntrySchema).max(50) });

export async function POST(req: Request) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

	const { entries } = BodySchema.parse(await req.json());
	const userId = session.user.id;

	let imported = 0;
	for (const e of entries) {
		const startedAt = new Date(e.date);
		const completedAt = new Date(startedAt.getTime() + e.timeMs);
		await db.insert(toeicAttempt).values({
			userId,
			mode: "practice",
			examId: null,
			partFilter: null,
			questionCount: e.total,
			startedAt,
			completedAt,
			durationMs: e.timeMs,
		});
		imported++;
	}

	return NextResponse.json({ imported });
}
```

- [ ] **Step 12.2: Trigger one-shot import**

In `useToeicSession.ts` (or a new top-level effect in the hub page), add:

```ts
useEffect(() => {
	const KEY = "toeic-practice-history";
	const IMPORTED_FLAG = "toeic-practice-history-imported";
	if (typeof window === "undefined") return;
	if (localStorage.getItem(IMPORTED_FLAG)) return;
	const raw = localStorage.getItem(KEY);
	if (!raw) {
		localStorage.setItem(IMPORTED_FLAG, "1");
		return;
	}
	try {
		const entries = JSON.parse(raw);
		if (Array.isArray(entries) && entries.length > 0) {
			void api.post("/api/toeic-practice/import-history", { entries: entries.slice(0, 50) });
		}
		localStorage.setItem(IMPORTED_FLAG, "1");
	} catch {
		localStorage.setItem(IMPORTED_FLAG, "1");
	}
}, []);
```

- [ ] **Step 12.3: Commit**

```bash
git add apps/web/app/api/toeic-practice/import-history apps/web/hooks/useToeicSession.ts
git commit -m "feat(toeic): best-effort import of localStorage practice history"
```

---

## Task 13: End-to-end smoke test + sprint close

- [ ] **Step 13.1: Fresh user E2E**

In a clean browser session (or a fresh test user):

1. Sign in.
2. Click TOEIC in sidebar → land on `/toeic/diagnostic` (gated).
3. Complete the 30-question diagnostic.
4. After submit → land on `/toeic` hub with widgets rendered.
5. Click "Luyện đề" → `/toeic/practice`. Pick Part 5, count 5, Start.
6. Answer 5 questions.
7. Submit.

Then verify in DB:

```bash
psql "$DATABASE_URL" <<SQL
SELECT mode, completed_at, question_count FROM toeic_attempt WHERE user_id = '<USER>' ORDER BY started_at DESC LIMIT 5;
SELECT module_type, count(*) FROM learning_event WHERE user_id = '<USER>' GROUP BY module_type;
SELECT skill_id, proficiency, signal_count FROM user_skill_state WHERE user_id = '<USER>' AND skill_id LIKE 'toeic.%' LIMIT 10;
SELECT count(*) FROM review_task WHERE user_id = '<USER>' AND source_type = 'error_retry';
SQL
```

Expected:
- 2 attempt rows (1 diagnostic + 1 practice).
- `learning_event` has `toeic_diagnostic` and `toeic_practice` rows.
- `user_skill_state` has 25 toeic.* rows.
- `review_task` has rows for any incorrect answers from the practice attempt.

- [ ] **Step 13.2: Verify dashboard pickup (no extra code)**

Visit `/dashboard`. Confirm the existing widgets show TOEIC activity (e.g. recent activity feed). No code change needed — this proves the event pipeline works.

- [ ] **Step 13.3: Final spec compliance check**

Open `docs/superpowers/specs/2026-05-08-toeic-backbone-design.md` "Definition of done" section. Verify each line:

- [x] First-visit forces diagnostic; baseline written; `userSkillState` seeded.
- [x] Practice answer writes `toeic_answer`, emits `learningEvent`, enqueues `reviewTask` on incorrect.
- [x] Existing `/dashboard` reflects TOEIC activity automatically.
- [x] Old routes 308-redirect.
- [x] Sidebar shows single TOEIC entry.
- [ ] Spot-check ≥80% of 50 auto-labeled questions OK (ran in Task 4).

- [ ] **Step 13.4: Final commit + tag**

```bash
git status
git log --oneline -20
```

Confirm clean tree. Tag the sprint:

```bash
git tag -a toeic-s1-backbone -m "TOEIC sprint S1 — backbone complete"
```

---

## Done

After Task 13, sub-project #0 is complete. Next sub-projects (#1–#9) plug into the established pipeline:
- New TOEIC modules emit `LearningEvent` via the same helper.
- New question content uses the existing `toeic_question` schema.
- New routes live under `/toeic/<sub-route>` and call `requireToeicBaseline()`.
- New AI features use Groq (STT/TTS) or OpenAI SDK pointed at Gemini (LLM).
