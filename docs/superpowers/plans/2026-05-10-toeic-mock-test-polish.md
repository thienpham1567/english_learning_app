# TOEIC Mock Test Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-question review (3 tabs), keyboard shortcuts, flag/bookmark, and soft anti-cheat tracking to the TOEIC Mock Test runner + result page.

**Architecture:** All four features build on existing schema + components. One small migration adds `cheatViolations` jsonb to `toeicAttempt`. The existing `toeicAnswer.flagged` (unused since S1) gets wired up. The existing `/api/toeic-practice/answer` endpoint gets two optional fields (`flagged`, `cheatEvent`) — keeps API surface small. A new `/full-review` endpoint feeds the result page tabs. UI changes touch QuestionRunner (keyboard + flag), mock-test runner (visibility tracker), writing runner (paste blocker), and result page (3 tabs + cheat banner).

**Tech Stack:** TypeScript, Next.js 16 App Router (`apps/web`), Drizzle ORM (`@repo/database`), Zod, Antd 6 (`<Tabs>`), `@repo/contracts` for SourceType enum.

**Spec:** `docs/superpowers/specs/2026-05-10-toeic-mock-test-polish-design.md`

**Note:** No `.test.ts` files added (per repo convention). Each task ends with a typecheck + commit.

---

## File Structure

### New files

```
apps/web/app/api/toeic-practice/attempt/[id]/full-review/route.ts   # GET — full attempt data for review tabs
apps/web/app/(app)/toeic/mock-test/[id]/result/_components/
  ReviewTabs.tsx                                                    # Client component with Antd Tabs + question cards
```

### Modified files

```
packages/contracts/src/learning/review-task.ts                          # Add "bookmark_review" to ReviewSourceType
packages/database/src/schema/index.ts                                   # Add cheatViolations jsonb to toeic_attempt
apps/web/app/api/toeic-practice/answer/route.ts                         # Accept flagged + cheatEvent fields
apps/web/app/api/toeic-mock/complete/route.ts                           # Enqueue bookmark_review for flagged-correct
apps/web/app/(app)/toeic/practice/_components/QuestionRunner.tsx        # Keyboard handler + flag button
apps/web/app/(app)/toeic/mock-test/runner/page.tsx                      # visibilitychange tracker
apps/web/app/(app)/toeic/writing/runner/page.tsx                        # onPaste blocker on textarea
apps/web/app/(app)/toeic/mock-test/[id]/result/page.tsx                 # Replace breakdown with ReviewTabs + cheat banner
```

No new dependencies. No env vars.

---

## Task 1: Schema migration + ReviewSourceType extension

**Files:**
- Modify: `packages/database/src/schema/index.ts`
- Modify: `packages/contracts/src/learning/review-task.ts`
- Migration auto-generated under `apps/web/lib/db/migrations/`

- [ ] **Step 1.1: Add `bookmark_review` to ReviewSourceType enum**

Open `packages/contracts/src/learning/review-task.ts`. Find:

```ts
export const ReviewSourceType = z.enum([
	"flashcard_review",
	"error_retry",
	"grammar_remediation",
	"writing_rewrite",
	"pronunciation_drill",
	"listening_replay",
	"cloze_retry",
]);
```

Add `"bookmark_review"` at the end:

```ts
export const ReviewSourceType = z.enum([
	"flashcard_review",
	"error_retry",
	"grammar_remediation",
	"writing_rewrite",
	"pronunciation_drill",
	"listening_replay",
	"cloze_retry",
	"bookmark_review",
]);
```

- [ ] **Step 1.2: Add `cheatViolations` column to `toeicAttempt`**

Open `packages/database/src/schema/index.ts`. Find the `toeicAttempt` table (search for `pgTable("toeic_attempt"`). Find the existing fields block, near the end before the `(table) => [...]` callback:

```ts
    questionIds: jsonb("question_ids").$type<string[]>(),
    /** When user transitioned into Reading section (mock test). Null if still in Listening. */
    readingStartedAt: timestamp("reading_started_at", { withTimezone: true }),
  },
```

Add a new field right above `},`:

```ts
    questionIds: jsonb("question_ids").$type<string[]>(),
    /** When user transitioned into Reading section (mock test). Null if still in Listening. */
    readingStartedAt: timestamp("reading_started_at", { withTimezone: true }),
    /** Soft anti-cheat counters. Null when never tracked. */
    cheatViolations: jsonb("cheat_violations").$type<{
      tabSwitches: number;
      pasteAttempts: number;
      longBlurMs: number;
    }>(),
  },
```

- [ ] **Step 1.3: Generate + apply migration**

Run from repo root:

```bash
cd /Users/thienuser/Documents/english_learning_app/.claude/worktrees/loving-raman-751a9f/apps/web
pnpm db:generate
```

Expected: `[✓] Your SQL migration file ➜ lib/db/migrations/<NNNN>_<name>.sql 🚀`

Inspect the generated SQL — it should have only:

```sql
ALTER TABLE "toeic_attempt" ADD COLUMN "cheat_violations" jsonb;
```

If extra ALTERs appear (e.g. youtube_video_history again), remove them — those tables exist in DB already.

- [ ] **Step 1.4: Apply migration**

```bash
cd /Users/thienuser/Documents/english_learning_app/.claude/worktrees/loving-raman-751a9f/apps/web
set -a && source .env.local && set +a
pnpm db:migrate
```

Expected: `[✓] migrations applied successfully!`

- [ ] **Step 1.5: Typecheck**

```bash
cd /Users/thienuser/Documents/english_learning_app/.claude/worktrees/loving-raman-751a9f/apps/web
pnpm exec tsc --noEmit
```

Expected: clean.

- [ ] **Step 1.6: Commit**

```bash
cd /Users/thienuser/Documents/english_learning_app/.claude/worktrees/loving-raman-751a9f
git add packages/contracts/src/learning/review-task.ts packages/database/src/schema/index.ts apps/web/lib/db/migrations
git commit -m "feat(toeic): add cheatViolations column + bookmark_review source type"
```

---

## Task 2: Extend `/api/toeic-practice/answer` route

**Files:**
- Modify: `apps/web/app/api/toeic-practice/answer/route.ts`

The route currently expects `attemptId + questionId + selectedIndex + durationMs`. Add three optional fields (`flagged`, `cheatEvent`, `durationMsOff`). When only `cheatEvent` is provided (no real answer), the route increments `toeicAttempt.cheatViolations` and returns; it does NOT insert/update `toeicAnswer`.

- [ ] **Step 2.1: Read current file**

Read `apps/web/app/api/toeic-practice/answer/route.ts` to confirm current schema + insert logic. Snapshot lines for the next steps.

- [ ] **Step 2.2: Update `BodySchema`**

Find:

```ts
const BodySchema = z.object({
	attemptId: z.string().uuid(),
	questionId: z.string().uuid(),
	selectedIndex: z.number().int().min(0).max(3).nullable(),
	durationMs: z.number().int().min(0),
});
```

Replace with:

```ts
const BodySchema = z.object({
	attemptId: z.string().uuid(),
	questionId: z.string().uuid(),
	selectedIndex: z.number().int().min(0).max(3).nullable(),
	durationMs: z.number().int().min(0),
	/** Optional: persist flagged state on toeic_answer (no answer change required). */
	flagged: z.boolean().optional(),
	/** Optional: report soft-cheat event during mock test. */
	cheatEvent: z.enum(["tabSwitch", "paste"]).optional(),
	/** Time spent off-tab in ms (only meaningful for cheatEvent="tabSwitch"). */
	durationMsOff: z.number().int().min(0).optional(),
});
```

- [ ] **Step 2.3: Add cheat-event handling early in POST handler**

Find the spot inside `POST(req)` after the attempt is loaded but before `toeicAnswer` insert. The relevant snippet:

```ts
	const [attempt] = await db
		.select()
		.from(toeicAttempt)
		.where(and(eq(toeicAttempt.id, body.attemptId), eq(toeicAttempt.userId, userId)))
		.limit(1);
	if (!attempt) {
		return Response.json({ error: "Attempt not found" }, { status: 404 });
	}
	if (attempt.completedAt) {
		return Response.json({ error: "Attempt already completed" }, { status: 409 });
	}
```

Right after that block (and before the `toeicQuestion` lookup), add:

```ts
	// Cheat event short-circuit — increment counters and return without recording an answer.
	if (body.cheatEvent) {
		const prev = attempt.cheatViolations ?? {
			tabSwitches: 0,
			pasteAttempts: 0,
			longBlurMs: 0,
		};
		const next = {
			tabSwitches: prev.tabSwitches + (body.cheatEvent === "tabSwitch" ? 1 : 0),
			pasteAttempts: prev.pasteAttempts + (body.cheatEvent === "paste" ? 1 : 0),
			longBlurMs:
				prev.longBlurMs +
				(body.cheatEvent === "tabSwitch" ? body.durationMsOff ?? 0 : 0),
		};
		await db
			.update(toeicAttempt)
			.set({ cheatViolations: next })
			.where(eq(toeicAttempt.id, body.attemptId));
		return Response.json({ ok: true, cheatViolations: next });
	}
```

- [ ] **Step 2.4: Persist `flagged` on the upsert**

Find the existing answer-upsert block (search for `db.insert(toeicAnswer)`):

```ts
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
				changedCount: sql`${toeicAnswer.changedCount} + 1`,
			},
		});
```

Replace with:

```ts
	await db
		.insert(toeicAnswer)
		.values({
			attemptId: body.attemptId,
			questionId: body.questionId,
			selectedIndex: body.selectedIndex,
			isCorrect,
			durationMs: body.durationMs,
			flagged: body.flagged ?? false,
		})
		.onConflictDoUpdate({
			target: [toeicAnswer.attemptId, toeicAnswer.questionId],
			set: {
				selectedIndex: body.selectedIndex,
				isCorrect,
				durationMs: body.durationMs,
				changedCount: sql`${toeicAnswer.changedCount} + 1`,
				...(body.flagged !== undefined ? { flagged: body.flagged } : {}),
			},
		});
```

The conditional spread on conflict ensures setting `flagged: false` doesn't accidentally clear it for callers who don't pass `flagged` (e.g. cheat events go through the early return — but defensive code).

- [ ] **Step 2.5: Typecheck**

```bash
cd apps/web && pnpm exec tsc --noEmit
```

Expected: clean.

- [ ] **Step 2.6: Commit**

```bash
cd /Users/thienuser/Documents/english_learning_app/.claude/worktrees/loving-raman-751a9f
git add apps/web/app/api/toeic-practice/answer/route.ts
git commit -m "feat(toeic): answer route accepts flagged + cheatEvent fields"
```

---

## Task 3: Mock complete enqueues `bookmark_review` for flagged-correct

**Files:**
- Modify: `apps/web/app/api/toeic-mock/complete/route.ts`

Currently the `complete` route computes the score and updates the attempt. The error-retry enqueue happens upstream in the answer event-emitter (`emitToeicLearningEvent`) at submission time. We add a separate post-submit pass for flagged-but-correct answers (since they don't go through the error path).

- [ ] **Step 3.1: Read current file**

Read `apps/web/app/api/toeic-mock/complete/route.ts` to locate the spot after `db.update(toeicAttempt).set({ completedAt, ... })` where we'll add the bookmark loop.

- [ ] **Step 3.2: Add imports**

At the top of the file, add (the file already imports from `@repo/database`):

```ts
import { reviewTask } from "@repo/database";
import { computeInitialSchedule } from "@repo/modules";
```

If `computeInitialSchedule` is already imported, skip that line.

- [ ] **Step 3.3: Add the bookmark loop**

Find the end of the route function — after the `db.update(toeicAttempt).set({...completedAt...})` call but before `return Response.json(...)`. Insert this block:

```ts
	// Enqueue bookmark_review SRS for flagged questions that were ANSWERED CORRECTLY.
	// (Wrong answers already enqueue error_retry via the answer event-emitter.)
	const flaggedAnswers = answers.filter((a) => a.flagged && a.isCorrect === true);
	if (flaggedAnswers.length > 0) {
		const now = new Date();
		const init = computeInitialSchedule("bookmark_review", now.getTime());
		await Promise.all(
			flaggedAnswers.map(async (a) => {
				const q = byId.get(a.questionId);
				if (!q) return;
				await db
					.insert(reviewTask)
					.values({
						userId,
						sourceType: "bookmark_review",
						sourceId: a.questionId,
						skillIds: q.skillIds.length > 0 ? q.skillIds : ["toeic.general"],
						priority: 30, // lower than error_retry (50)
						dueAt: new Date(init.dueAt),
						estimatedMinutes: init.estimatedMinutes,
						reviewMode: init.reviewMode,
						status: "pending",
						lastOutcome: null,
						attemptCount: 0,
						nextIntervalDays: init.intervalDays,
						easeFactor: 2.5,
					})
					.onConflictDoNothing();
			}),
		);
	}
```

The `byId` map and `answers` array are already populated earlier in the function (verify when reading). If the existing function doesn't compute a `byId` map, add this near the top of the route handler after fetching `answers`:

```ts
	const byId = new Map(questions.map((q) => [q.id, q]));
```

(`questions` is already loaded earlier — re-use the same variable.)

- [ ] **Step 3.4: Typecheck**

```bash
cd apps/web && pnpm exec tsc --noEmit
```

Expected: clean. If a default for `bookmark_review` interval isn't found in the scheduler's DEFAULT_INTERVAL map, the function returns `intervalDays: 1` — fine, document.

If the scheduler errors because `"bookmark_review"` isn't recognized: open `packages/modules/src/learning/review-scheduler.ts` and add an entry to `DEFAULT_INTERVAL` and `DEFAULT_ESTIMATED_MINUTES`:

```ts
const DEFAULT_INTERVAL: Record<ReviewSourceTypeValue, number> = {
	// ...existing...
	bookmark_review: 3, // 3 days default
};
const DEFAULT_ESTIMATED_MINUTES: Record<ReviewSourceTypeValue, number> = {
	// ...existing...
	bookmark_review: 5,
};
const DEFAULT_REVIEW_MODE: Record<ReviewSourceTypeValue, string> = {
	// ...existing...
	bookmark_review: "recognition",
};
```

(The exact name of these maps may differ — read the scheduler file first to confirm.)

- [ ] **Step 3.5: Commit**

```bash
cd /Users/thienuser/Documents/english_learning_app/.claude/worktrees/loving-raman-751a9f
git add apps/web/app/api/toeic-mock/complete/route.ts packages/modules/src/learning/review-scheduler.ts
git commit -m "feat(toeic): enqueue bookmark_review for flagged-correct mock answers"
```

---

## Task 4: New `/api/toeic-practice/attempt/[id]/full-review` endpoint

**Files:**
- Create: `apps/web/app/api/toeic-practice/attempt/[id]/full-review/route.ts`

Returns everything the result page tabs need in one round-trip: attempt + questions + answers (each marked correct/wrong/flagged).

- [ ] **Step 4.1: Create the file**

Create `apps/web/app/api/toeic-practice/attempt/[id]/full-review/route.ts`:

```ts
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { toeicAttempt, toeicAnswer, toeicQuestion } from "@repo/database";
import { and, eq, inArray } from "drizzle-orm";

export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}
	const { id } = await params;

	const [attempt] = await db
		.select()
		.from(toeicAttempt)
		.where(and(eq(toeicAttempt.id, id), eq(toeicAttempt.userId, session.user.id)))
		.limit(1);
	if (!attempt) return Response.json({ error: "Not found" }, { status: 404 });

	const answers = await db
		.select()
		.from(toeicAnswer)
		.where(eq(toeicAnswer.attemptId, id));
	const questionIds = answers.map((a) => a.questionId);
	const questions = questionIds.length
		? await db.select().from(toeicQuestion).where(inArray(toeicQuestion.id, questionIds))
		: [];

	return Response.json({
		attempt: {
			id: attempt.id,
			mode: attempt.mode,
			completedAt: attempt.completedAt,
			scaledListening: attempt.scaledListening,
			scaledReading: attempt.scaledReading,
			totalScaled: attempt.totalScaled,
			cheatViolations: attempt.cheatViolations,
		},
		questions: questions.map((q) => ({
			id: q.id,
			number: q.number,
			part: q.part,
			questionText: q.questionText,
			passageText: q.passageText,
			options: q.options,
			correctIndex: q.correctIndex,
			explanationVi: q.explanationVi,
			explanationEn: q.explanationEn,
			audioUrl: q.audioUrl,
			audioSegments: q.audioSegments,
			imageUrls: q.imageUrls,
			skillIds: q.skillIds,
		})),
		answers: answers.map((a) => ({
			questionId: a.questionId,
			selectedIndex: a.selectedIndex,
			isCorrect: a.isCorrect,
			flagged: a.flagged,
			durationMs: a.durationMs,
		})),
	});
}
```

- [ ] **Step 4.2: Typecheck**

```bash
cd apps/web && pnpm exec tsc --noEmit
```

Expected: clean.

- [ ] **Step 4.3: Commit**

```bash
cd /Users/thienuser/Documents/english_learning_app/.claude/worktrees/loving-raman-751a9f
git add apps/web/app/api/toeic-practice/attempt/\[id\]/full-review/route.ts
git commit -m "feat(toeic): add /attempt/[id]/full-review endpoint"
```

---

## Task 5: QuestionRunner — keyboard handler + flag button

**Files:**
- Modify: `apps/web/app/(app)/toeic/practice/_components/QuestionRunner.tsx`

The runner already exposes `onAnswer` and `onNext`. Add: keyboard listener mounted while the question is non-null; flag local state + button; fire-and-forget POST when flag toggles.

- [ ] **Step 5.1: Read current QuestionRunner imports + props**

Confirm current imports include `useEffect`, `useState`, `useRef`. Confirm prop types `onAnswer`, `onNext`, `onComplete`. Locate where the action button row renders (the "Câu tiếp / Nộp bài" button).

- [ ] **Step 5.2: Add `attemptId` prop and `flagged` state**

Find the `QuestionRunnerProps` type and add:

```ts
	attemptId?: string;
	initialFlagged?: boolean;
```

(Most callers won't pass them; they're optional. Only mock + practice runners should — wired in their respective pages.)

Inside the component body, near `const [selected, setSelected] = useState<number | null>(null);`, add:

```ts
	const [isFlagged, setIsFlagged] = useState<boolean>(initialFlagged ?? false);
```

Add this to the existing reset `useEffect` watching `question?.id`:

```ts
	useEffect(() => {
		setSelected(null);
		setRevealed(false);
		setPart2PlayingIdx(-1);
		setIsFlagged(false); // ADD THIS LINE
	}, [question?.id]);
```

- [ ] **Step 5.3: Add `toggleFlag` callback**

Right above the `handlePick` callback:

```ts
	const toggleFlag = async () => {
		if (!question || !attemptId) return;
		const next = !isFlagged;
		setIsFlagged(next);
		// Fire-and-forget — don't block UI on persist
		void fetch("/api/toeic-practice/answer", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				attemptId,
				questionId: question.id,
				selectedIndex: null,
				durationMs: 0,
				flagged: next,
			}),
		});
	};
```

(Use raw `fetch` not `api.post` — we want fire-and-forget without throwing on retry mismatch.)

- [ ] **Step 5.4: Add keyboard handler effect**

Near the existing audio effect (after `useEffect(() => { if (timeLimit && startedAt && elapsed >= timeLimit) ...`), add a NEW effect:

```ts
	useEffect(() => {
		if (!question) return;
		const onKey = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement | null;
			if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
			const k = e.key.toLowerCase();
			// 1-4 / a-d → pick option
			const optIdx = (() => {
				if (k === "1" || k === "a") return 0;
				if (k === "2" || k === "b") return 1;
				if (k === "3" || k === "c") return 2;
				if (k === "4" || k === "d") return 3;
				return -1;
			})();
			if (optIdx >= 0 && optIdx < question.options.length && !revealed) {
				e.preventDefault();
				handlePick(optIdx);
				return;
			}
			if (k === " ") {
				if (audioRef.current && !audioRef.current.paused) {
					audioRef.current.pause();
				} else if (audioRef.current?.src) {
					void audioRef.current.play();
				}
				e.preventDefault();
				return;
			}
			if (k === "f") {
				e.preventDefault();
				void toggleFlag();
				return;
			}
			if (k === "enter") {
				if ((revealed || hideExplanation) && (selected !== null || hideExplanation)) {
					e.preventDefault();
					handleNext();
				}
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [question?.id, revealed, selected, hideExplanation, isFlagged]);
```

- [ ] **Step 5.5: Add flag button + keyboard hint to UI**

Find the action row near the bottom (the `<div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>` with "Bỏ qua" and "Câu tiếp" buttons). Replace it with:

```tsx
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					gap: 8,
				}}
			>
				<Button
					type={isFlagged ? "primary" : "default"}
					danger={isFlagged}
					size="small"
					onClick={() => void toggleFlag()}
					disabled={!attemptId}
					title="Phím tắt: F"
				>
					{isFlagged ? "🚩 Đã flag" : "🚩 Flag"}
				</Button>
				<div style={{ display: "flex", gap: 8 }}>
					{hideExplanation && selected === null && (
						<Button onClick={() => void onAnswer(null)}>Bỏ qua</Button>
					)}
					<Button type="primary" onClick={handleNext} disabled={!canSubmit && !hideExplanation}>
						{isLast ? "Nộp bài" : "Câu tiếp"}
					</Button>
				</div>
			</div>
			<div
				style={{
					marginTop: 8,
					fontSize: 11,
					color: "var(--text-muted, #94a3b8)",
					textAlign: "center",
				}}
			>
				⌨️ Phím tắt: 1-4 hoặc A-D · Space play/pause audio · F flag · Enter tiếp
			</div>
```

- [ ] **Step 5.6: Pass `attemptId` from callers**

In `apps/web/app/(app)/toeic/practice/_components/PracticeRunner.tsx`, find the QuestionRunner render. Add `attemptId={tp.attemptId ?? undefined}`:

```tsx
		<QuestionRunner
			question={tp.currentQuestion}
			currentIndex={tp.currentIndex}
			total={tp.questions.length}
			startedAt={tp.startedAt}
			attemptId={tp.attemptId ?? undefined}
			onAnswer={tp.answer}
			onNext={tp.next}
			onComplete={tp.complete}
		/>
```

(`tp.attemptId` should be `string | null` — adapt to undefined.)

In `apps/web/app/(app)/toeic/diagnostic/page.tsx`, do the same:

```tsx
				<QuestionRunner
					question={session.currentQuestion}
					currentIndex={session.currentIndex}
					total={session.questions.length}
					hideExplanation
					timeLimit={TIME_LIMIT_MS}
					startedAt={session.startedAt}
					attemptId={session.attemptId ?? undefined}
					onAnswer={session.answer}
					onNext={session.next}
					onComplete={session.complete}
				/>
```

In `apps/web/app/(app)/toeic/grammar/drill/page.tsx`, similar:

```tsx
		<QuestionRunner
			question={session.currentQuestion}
			currentIndex={session.currentIndex}
			total={session.questions.length}
			startedAt={session.startedAt}
			attemptId={session.attemptId ?? undefined}
			onAnswer={session.answer}
			onNext={session.next}
			onComplete={session.complete}
		/>
```

- [ ] **Step 5.7: Typecheck**

```bash
cd apps/web && pnpm exec tsc --noEmit
```

Expected: clean.

- [ ] **Step 5.8: Commit**

```bash
cd /Users/thienuser/Documents/english_learning_app/.claude/worktrees/loving-raman-751a9f
git add apps/web/app/\(app\)/toeic/practice/_components/QuestionRunner.tsx \
        apps/web/app/\(app\)/toeic/practice/_components/PracticeRunner.tsx \
        apps/web/app/\(app\)/toeic/diagnostic/page.tsx \
        apps/web/app/\(app\)/toeic/grammar/drill/page.tsx
git commit -m "feat(toeic): keyboard shortcuts + flag button in QuestionRunner"
```

---

## Task 6: Mock runner — visibility tracker

**Files:**
- Modify: `apps/web/app/(app)/toeic/mock-test/runner/page.tsx`

Track tab-switches >2s during mock and ping the answer endpoint with `cheatEvent: "tabSwitch"`. Also pass `attemptId` to QuestionRunner so flag works.

- [ ] **Step 6.1: Add visibility tracker effect**

Inside the `MockRunner` function (the inner client component), find the existing `useEffect` block that initializes the attempt. After the existing `useEffect(...)` for init, add a new one:

```ts
	useEffect(() => {
		if (!attemptId) return;
		let blurStart = 0;
		const onVisChange = () => {
			if (document.hidden) {
				blurStart = Date.now();
			} else if (blurStart > 0) {
				const blurMs = Date.now() - blurStart;
				if (blurMs > 2000 && current) {
					void fetch("/api/toeic-practice/answer", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							attemptId,
							questionId: current.id,
							selectedIndex: null,
							durationMs: 0,
							cheatEvent: "tabSwitch",
							durationMsOff: blurMs,
						}),
					});
				}
				blurStart = 0;
			}
		};
		document.addEventListener("visibilitychange", onVisChange);
		return () => document.removeEventListener("visibilitychange", onVisChange);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [attemptId, current?.id]);
```

- [ ] **Step 6.2: Pass `attemptId` to QuestionRunner**

Find the existing `<QuestionRunner ... />` render at the bottom of the file. Add `attemptId={attemptId ?? undefined}`:

```tsx
			<QuestionRunner
				question={current}
				currentIndex={idx}
				total={questions.length}
				hideExplanation
				timeLimit={sectionTimeLimit}
				startedAt={sectionStartedAt}
				attemptId={attemptId ?? undefined}
				onAnswer={handleAnswer}
				onNext={handleNext}
				onComplete={submitFinal}
			/>
```

- [ ] **Step 6.3: Typecheck**

```bash
cd apps/web && pnpm exec tsc --noEmit
```

Expected: clean.

- [ ] **Step 6.4: Commit**

```bash
cd /Users/thienuser/Documents/english_learning_app/.claude/worktrees/loving-raman-751a9f
git add apps/web/app/\(app\)/toeic/mock-test/runner/page.tsx
git commit -m "feat(toeic): track tab-switches during mock test"
```

---

## Task 7: Writing runner — paste blocker

**Files:**
- Modify: `apps/web/app/(app)/toeic/writing/runner/page.tsx`

Block paste into the writing textarea + show a brief toast.

- [ ] **Step 7.1: Add `message` import + handler**

At the top of the file, add Antd `message`:

```ts
import { Button, Card, Tag, Input, Modal, Progress, message } from "antd";
```

(The file currently imports `Button, Card, Tag, Input, Modal, Progress` — add `message` to the same import.)

Find the `<Input.TextArea ...>` element (search for `Input.TextArea`). Add `onPaste`:

```tsx
				<Input.TextArea
					value={text}
					onChange={(e) => setText(e.target.value)}
					onPaste={(e) => {
						e.preventDefault();
						message.warning("Không paste khi làm Writing — gõ tay luyện kỹ năng");
					}}
					rows={current.type === "q8_opinion" ? 14 : current.type === "q6_7_email" ? 8 : 3}
					placeholder="Type your answer here..."
					autoFocus
				/>
```

- [ ] **Step 7.2: Typecheck**

```bash
cd apps/web && pnpm exec tsc --noEmit
```

Expected: clean.

- [ ] **Step 7.3: Commit**

```bash
cd /Users/thienuser/Documents/english_learning_app/.claude/worktrees/loving-raman-751a9f
git add apps/web/app/\(app\)/toeic/writing/runner/page.tsx
git commit -m "feat(toeic): block paste in writing textarea"
```

---

## Task 8: Result page — 3-tab review + cheat banner

**Files:**
- Create: `apps/web/app/(app)/toeic/mock-test/[id]/result/_components/ReviewTabs.tsx`
- Modify: `apps/web/app/(app)/toeic/mock-test/[id]/result/page.tsx`

The result page is currently a server component that fetches data inline. Keep it server-side for the data fetch, render scores as before, then mount a client `<ReviewTabs />` for the interactive tabs.

- [ ] **Step 8.1: Create `ReviewTabs.tsx`**

Create `apps/web/app/(app)/toeic/mock-test/[id]/result/_components/ReviewTabs.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Tabs, Card, Tag, Empty } from "antd";
import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";

type Question = {
	id: string;
	number: number;
	part: number;
	questionText: string | null;
	options: string[];
	correctIndex: number;
	explanationVi: string | null;
	imageUrls: string[] | null;
};
type Answer = {
	questionId: string;
	selectedIndex: number | null;
	isCorrect: boolean | null;
	flagged: boolean;
};

export function ReviewTabs({
	questions,
	answers,
}: {
	questions: Question[];
	answers: Answer[];
}) {
	const [activeKey, setActiveKey] = useState("wrong");
	const byQid = new Map(answers.map((a) => [a.questionId, a]));

	const wrong = questions.filter((q) => byQid.get(q.id)?.isCorrect === false);
	const flagged = questions.filter((q) => byQid.get(q.id)?.flagged);

	const renderList = (list: Question[]) => {
		if (list.length === 0) {
			return <Empty description="Không có câu nào" />;
		}
		return (
			<div style={{ display: "grid", gap: 10 }}>
				{list.map((q) => {
					const a = byQid.get(q.id);
					const userIdx = a?.selectedIndex;
					return (
						<Card key={q.id} size="small" style={{ borderColor: a?.isCorrect === false ? "#ef4444" : undefined }}>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									marginBottom: 6,
								}}
							>
								<span style={{ fontWeight: 600 }}>
									Q{q.number} · Part {q.part}
								</span>
								<span style={{ display: "flex", gap: 4 }}>
									{a?.flagged && <Tag color="orange">🚩</Tag>}
									{a?.isCorrect === true ? (
										<Tag color="green" icon={<CheckCircleFilled />}>Đúng</Tag>
									) : a?.isCorrect === false ? (
										<Tag color="red" icon={<CloseCircleFilled />}>Sai</Tag>
									) : (
										<Tag>Bỏ qua</Tag>
									)}
								</span>
							</div>
							{q.imageUrls && q.imageUrls.length > 0 && (
								<img
									src={q.imageUrls[0]}
									alt=""
									loading="lazy"
									decoding="async"
									style={{ maxWidth: 200, borderRadius: 4, marginBottom: 8 }}
								/>
							)}
							{q.questionText && (
								<div style={{ marginBottom: 8 }}>{q.questionText}</div>
							)}
							<div style={{ display: "grid", gap: 4, marginBottom: 8 }}>
								{q.options.map((opt, idx) => {
									const isUser = userIdx === idx;
									const isCorrect = q.correctIndex === idx;
									let bg = "transparent";
									if (isCorrect) bg = "rgba(16,185,129,.12)";
									else if (isUser) bg = "rgba(239,68,68,.12)";
									return (
										<div
											key={idx}
											style={{
												padding: "4px 8px",
												borderRadius: 4,
												background: bg,
												fontSize: 13,
												display: "flex",
												gap: 6,
											}}
										>
											<strong style={{ minWidth: 18 }}>
												{String.fromCharCode(65 + idx)}.
											</strong>
											<span>{opt}</span>
											{isCorrect && <span style={{ color: "#10b981" }}>✓</span>}
											{isUser && !isCorrect && <span style={{ color: "#ef4444" }}>✗ bạn chọn</span>}
										</div>
									);
								})}
							</div>
							{q.explanationVi && (
								<div
									style={{
										fontSize: 12,
										color: "var(--text-muted, #cbd5e1)",
										borderLeft: "3px solid #3b82f6",
										paddingLeft: 8,
									}}
								>
									{q.explanationVi}
								</div>
							)}
						</Card>
					);
				})}
			</div>
		);
	};

	return (
		<Tabs
			activeKey={activeKey}
			onChange={setActiveKey}
			items={[
				{
					key: "wrong",
					label: `❌ Sai (${wrong.length})`,
					children: renderList(wrong),
				},
				{
					key: "all",
					label: `📋 Tất cả (${questions.length})`,
					children: renderList(questions),
				},
				{
					key: "flagged",
					label: `🚩 Bookmarked (${flagged.length})`,
					children: renderList(flagged),
				},
			]}
		/>
	);
}
```

- [ ] **Step 8.2: Modify `result/page.tsx` to fetch full data + render tabs + cheat banner**

Open `apps/web/app/(app)/toeic/mock-test/[id]/result/page.tsx`. The current file fetches `attempt + answers + questions` inline already. Find the existing JSX section that renders the per-Part breakdown card. Right BEFORE it, add the cheat banner. Right AFTER it, add the ReviewTabs.

First, add imports at the top:

```ts
import { ReviewTabs } from "./_components/ReviewTabs";
```

Find the `return ( <div> ... </div> )` block. Before the closing `</div>` (the last one of the outer wrapper), add:

```tsx
				{attempt.cheatViolations &&
					(attempt.cheatViolations.tabSwitches > 0 ||
						attempt.cheatViolations.pasteAttempts > 0) && (
						<Card
							size="small"
							style={{ borderColor: "#f59e0b", background: "rgba(245,158,11,.08)" }}
						>
							<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
								<span style={{ fontSize: 18 }}>⚠️</span>
								<div style={{ fontSize: 13 }}>
									<strong>Score chưa thể coi là exam-realistic.</strong>
									{" "}Tab switch {attempt.cheatViolations.tabSwitches} lần · ngoài tab{" "}
									{Math.round((attempt.cheatViolations.longBlurMs ?? 0) / 1000)}s
									{(attempt.cheatViolations.pasteAttempts ?? 0) > 0
										? ` · paste ${attempt.cheatViolations.pasteAttempts}`
										: ""}
									. Mock test thật cần làm 1 mạch không tra cứu.
								</div>
							</div>
						</Card>
					)}

				<ReviewTabs questions={questions} answers={answers} />
```

The variable names `attempt`, `questions`, `answers` should already match what the existing server fetch produces. If the existing page projects different shapes (e.g. doesn't include `flagged`), update the projection — the route already returns `flagged` so the `answers` array should carry it through.

- [ ] **Step 8.3: Verify the page projects all needed fields**

Read the full `result/page.tsx`. Confirm the `answers` mapping includes `flagged`. If it doesn't, update:

```ts
const answers = await db.select().from(toeicAnswer).where(eq(toeicAnswer.attemptId, id));
// Then either pass `answers` directly to ReviewTabs (already typed as Drizzle row),
// or project to plain shape:
const answersForClient = answers.map((a) => ({
	questionId: a.questionId,
	selectedIndex: a.selectedIndex,
	isCorrect: a.isCorrect,
	flagged: a.flagged,
}));
```

Then pass `answersForClient` (or whatever name the existing variable uses) to `<ReviewTabs answers={answersForClient} questions={questions} />`.

- [ ] **Step 8.4: Typecheck**

```bash
cd apps/web && pnpm exec tsc --noEmit
```

Expected: clean.

- [ ] **Step 8.5: Commit**

```bash
cd /Users/thienuser/Documents/english_learning_app/.claude/worktrees/loving-raman-751a9f
git add apps/web/app/\(app\)/toeic/mock-test/\[id\]/result/_components/ReviewTabs.tsx \
        apps/web/app/\(app\)/toeic/mock-test/\[id\]/result/page.tsx
git commit -m "feat(toeic): mock result review tabs (Sai/All/Bookmarked) + cheat banner"
```

---

## Final verification

- [ ] **All commits in order**

```bash
git log --oneline -9
```

Expected last 8 commits (most recent first):

1. `feat(toeic): mock result review tabs (Sai/All/Bookmarked) + cheat banner`
2. `feat(toeic): block paste in writing textarea`
3. `feat(toeic): track tab-switches during mock test`
4. `feat(toeic): keyboard shortcuts + flag button in QuestionRunner`
5. `feat(toeic): add /attempt/[id]/full-review endpoint`
6. `feat(toeic): enqueue bookmark_review for flagged-correct mock answers`
7. `feat(toeic): answer route accepts flagged + cheatEvent fields`
8. `feat(toeic): add cheatViolations column + bookmark_review source type`
9. (Plan/spec commits before that)

- [ ] **Final typecheck**

```bash
cd apps/web && pnpm exec tsc --noEmit
```

Expected: clean.

- [ ] **Definition-of-done check (from spec)**

- [x] Mock result page shows 3 tabs (Sai/Tất cả/Bookmarked) with question detail. — Task 8
- [x] Pressing 1/A picks option 0; Space toggles audio; F toggles flag. — Task 5
- [x] Flagged-correct → reviewTask sourceType=bookmark_review. — Task 3
- [x] Tab-switch >2s → cheatViolations.tabSwitches++; banner appears. — Task 6 + Task 8
- [x] Paste in Writing textarea blocked + toast. — Task 7
- [x] Existing flow unchanged for users not using new features. — All tasks additive

All boxes covered.
