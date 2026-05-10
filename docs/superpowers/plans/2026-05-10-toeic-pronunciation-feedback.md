# TOEIC Pronunciation Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add deterministic fluency metrics + Q1-2 forced alignment to the existing TOEIC Speaking grader so feedback references concrete pronunciation issues (pace, fillers, pauses, low-confidence words, missing read-aloud words).

**Architecture:** New pure-function module `lib/toeic/pronunciation-analysis.ts` derives metrics from Whisper word-level data. Switch `transcribeAudio` to `response_format: "verbose_json"`. Extend `gradeSpeaking` prompt with metrics block. Persist metrics in existing `toeicSpeakingResponse.rubricScores` jsonb. Render new "Phát âm" UI section on the result page.

**Tech Stack:** TypeScript, Next.js 16 App Router (`apps/web`), Drizzle ORM (`@repo/database`), Groq SDK (`whisper-large-v3-turbo`), OpenAI SDK pointed at Gemini, Antd 6 result UI.

**Spec:** `docs/superpowers/specs/2026-05-10-toeic-pronunciation-feedback-design.md`

**Note:** This project skips test files per repo convention. Every step ships real code or a verification command — no `.test.ts` files.

---

## File Structure

### New files

```
apps/web/lib/toeic/pronunciation-analysis.ts   # Pure functions: computeFluency, computeAlignment
```

### Modified files

```
apps/web/lib/toeic/speaking-grader.ts                                    # transcribeAudio → verbose_json; gradeSpeaking accepts metrics
apps/web/app/api/toeic-speaking/submit-response/route.ts                 # compute metrics, pass to grader, persist in rubricScores
apps/web/app/(app)/toeic/speaking/[id]/result/page.tsx                   # render "Phát âm" section
```

No DB migration. No new dependencies. No new env vars.

---

## Task 1: Pronunciation analysis pure functions

**Files:**
- Create: `apps/web/lib/toeic/pronunciation-analysis.ts`

- [ ] **Step 1.1: Create the file with full content**

Write `apps/web/lib/toeic/pronunciation-analysis.ts`:

```ts
/**
 * Deterministic pronunciation analysis from Whisper word-level data.
 * Pure functions — no I/O. Used by /api/toeic-speaking/submit-response.
 */

export type WhisperWord = {
	word: string;
	start: number; // seconds
	end: number; // seconds
	probability: number; // 0..1
};

export type AlignmentResult = {
	expectedWords: number;
	spokenWords: number;
	matchedWords: number;
	missingWords: string[];
	addedWords: string[];
	accuracy: number;
};

export type PronunciationMetrics = {
	wpm: number;
	fillerCount: number;
	fillerRate: number;
	longPauseCount: number;
	avgConfidence: number;
	lowConfidenceWords: string[];
	alignment?: AlignmentResult;
};

const FILLER_TOKENS = new Set([
	"uh",
	"um",
	"uhh",
	"umm",
	"hmm",
	"ah",
	"er",
	"erm",
]);
const TWO_WORD_FILLER = new Set(["you know", "i mean"]);
const LONG_PAUSE_SEC = 2.0;
const LOW_CONFIDENCE_THRESHOLD = 0.5;
const MAX_LOW_CONFIDENCE_WORDS = 10;

function normalizeToken(s: string): string {
	return s
		.toLowerCase()
		.replace(/[^a-z0-9'\s]/g, "")
		.trim();
}

/**
 * Compute fluency metrics from Whisper word-level output.
 *
 * @param words Whisper words array (in order)
 * @param durationMs Total recording duration in ms
 */
export function computeFluency(
	words: WhisperWord[],
	durationMs: number,
): PronunciationMetrics {
	const cleanWords = words
		.map((w) => ({ ...w, word: normalizeToken(w.word) }))
		.filter((w) => w.word.length > 0);

	const totalMinutes = durationMs / 60_000;
	const wpm = totalMinutes > 0 ? Math.round(cleanWords.length / totalMinutes) : 0;

	// Filler detection — single-token + adjacent two-token
	let fillerCount = 0;
	for (let i = 0; i < cleanWords.length; i++) {
		const tok = cleanWords[i].word;
		if (FILLER_TOKENS.has(tok)) {
			fillerCount++;
			continue;
		}
		if (i + 1 < cleanWords.length) {
			const pair = `${tok} ${cleanWords[i + 1].word}`;
			if (TWO_WORD_FILLER.has(pair)) {
				fillerCount++;
				i++; // skip next
			}
		}
	}
	const fillerRate = totalMinutes > 0 ? Math.round(fillerCount / totalMinutes) : 0;

	// Long pauses
	let longPauseCount = 0;
	for (let i = 0; i < cleanWords.length - 1; i++) {
		const gap = cleanWords[i + 1].start - cleanWords[i].end;
		if (gap > LONG_PAUSE_SEC) longPauseCount++;
	}

	// Confidence
	const avgConfidence =
		cleanWords.length > 0
			? cleanWords.reduce((s, w) => s + (w.probability ?? 0), 0) / cleanWords.length
			: 0;

	const lowConfidenceWords = Array.from(
		new Set(
			cleanWords
				.filter((w) => (w.probability ?? 1) < LOW_CONFIDENCE_THRESHOLD)
				.map((w) => w.word),
		),
	).slice(0, MAX_LOW_CONFIDENCE_WORDS);

	return {
		wpm,
		fillerCount,
		fillerRate,
		longPauseCount,
		avgConfidence: Math.round(avgConfidence * 1000) / 1000,
		lowConfidenceWords,
	};
}

/**
 * Forced alignment between expected text and spoken Whisper words via LCS.
 * Used only for Q1-2 (read aloud) where the user reads a known passage.
 *
 * @param expectedText The textToRead from the prompt
 * @param spokenWords Whisper word array
 */
export function computeAlignment(
	expectedText: string,
	spokenWords: WhisperWord[],
): AlignmentResult {
	const expected = expectedText
		.split(/\s+/)
		.map(normalizeToken)
		.filter((t) => t.length > 0);
	const spoken = spokenWords
		.map((w) => normalizeToken(w.word))
		.filter((t) => t.length > 0);

	const m = expected.length;
	const n = spoken.length;

	if (m === 0 || n === 0) {
		return {
			expectedWords: m,
			spokenWords: n,
			matchedWords: 0,
			missingWords: expected,
			addedWords: spoken,
			accuracy: 0,
		};
	}

	// LCS DP table
	const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
	for (let i = 0; i < m; i++) {
		for (let j = 0; j < n; j++) {
			dp[i + 1][j + 1] =
				expected[i] === spoken[j]
					? dp[i][j] + 1
					: Math.max(dp[i + 1][j], dp[i][j + 1]);
		}
	}

	// Backtrack to get matched indices
	const matchedExpected = new Set<number>();
	const matchedSpoken = new Set<number>();
	let i = m;
	let j = n;
	while (i > 0 && j > 0) {
		if (expected[i - 1] === spoken[j - 1]) {
			matchedExpected.add(i - 1);
			matchedSpoken.add(j - 1);
			i--;
			j--;
		} else if (dp[i - 1][j] >= dp[i][j - 1]) {
			i--;
		} else {
			j--;
		}
	}

	const matchedWords = matchedExpected.size;
	const missingWords = expected.filter((_, idx) => !matchedExpected.has(idx));
	const addedWords = spoken.filter((_, idx) => !matchedSpoken.has(idx));
	const accuracy = m > 0 ? Math.round((matchedWords / m) * 100) / 100 : 0;

	return {
		expectedWords: m,
		spokenWords: n,
		matchedWords,
		missingWords,
		addedWords,
		accuracy,
	};
}
```

- [ ] **Step 1.2: Smoke-check via tsc**

Run from repo root:

```bash
cd apps/web && pnpm exec tsc --noEmit
```

Expected: clean (no errors).

- [ ] **Step 1.3: Commit**

```bash
cd /Users/thienuser/Documents/english_learning_app/.claude/worktrees/loving-raman-751a9f
git add apps/web/lib/toeic/pronunciation-analysis.ts
git commit -m "feat(toeic): add pronunciation-analysis pure functions (Whisper word-level)"
```

---

## Task 2: Switch `transcribeAudio` to `verbose_json`

**Files:**
- Modify: `apps/web/lib/toeic/speaking-grader.ts`

The current `transcribeAudio` returns `Promise<string>` (just the text). It must return `{ text, words[] }` so callers can compute pronunciation metrics. This is a breaking change to one internal call site (`submit-response/route.ts`), updated in Task 4.

- [ ] **Step 2.1: Read current file**

Read `apps/web/lib/toeic/speaking-grader.ts` to confirm the current `transcribeAudio` signature and any other consumers of its return value.

- [ ] **Step 2.2: Update `transcribeAudio` signature + import**

In `apps/web/lib/toeic/speaking-grader.ts`, find this block:

```ts
/** Transcribe audio buffer using Groq Whisper. */
export async function transcribeAudio(
	audioPath: string,
	mimeType = "audio/webm",
): Promise<string> {
```

Replace the entire function with:

```ts
/** Transcribe audio buffer using Groq Whisper, returning text + word-level data. */
export async function transcribeAudio(
	audioPath: string,
	mimeType = "audio/webm",
): Promise<{ text: string; words: import("./pronunciation-analysis").WhisperWord[] }> {
	const groq = getGroq();
	const file = await fs.promises.readFile(audioPath);
	const t0 = Date.now();
	const result = await groq.audio.transcriptions.create({
		file: new File([new Uint8Array(file)], "audio.webm", { type: mimeType }),
		model: "whisper-large-v3-turbo",
		language: "en",
		response_format: "verbose_json",
		timestamp_granularities: ["word"],
	} as never);
	const text = (result as { text?: string }).text ?? "";
	const segments =
		(result as { segments?: Array<{ words?: Array<{ word: string; start: number; end: number; probability?: number }> }> })
			.segments ?? [];
	const words: import("./pronunciation-analysis").WhisperWord[] = [];
	for (const seg of segments) {
		for (const w of seg.words ?? []) {
			words.push({
				word: w.word,
				start: w.start,
				end: w.end,
				probability: w.probability ?? 1,
			});
		}
	}
	// Some Groq responses put words at the top level
	const topWords = (result as { words?: Array<{ word: string; start: number; end: number; probability?: number }> })
		.words;
	if (words.length === 0 && topWords) {
		for (const w of topWords) {
			words.push({
				word: w.word,
				start: w.start,
				end: w.end,
				probability: w.probability ?? 1,
			});
		}
	}
	const sizeKB = file.byteLength / 1024;
	const approxSec = sizeKB / 30;
	console.log(
		`[cost] toeic.whisper duration=${Date.now() - t0}ms approxSec=${approxSec.toFixed(1)} bytes=${file.byteLength} words=${words.length}`,
	);
	return { text, words };
}
```

Notes:
- The `as never` cast on the request is because the current Groq SDK typing may not yet expose `timestamp_granularities`. The runtime accepts it.
- Both possible response shapes (segments-with-words and top-level words) are handled defensively — Groq's exact shape varies by model version.
- Cost log line preserved + extended with word count.

- [ ] **Step 2.3: Smoke-check via tsc**

```bash
cd apps/web && pnpm exec tsc --noEmit
```

Expected: errors will appear in `submit-response/route.ts` because the consumer still treats the return as a string. That's fine — fixed in Task 4. As long as the changes inside `speaking-grader.ts` itself typecheck, proceed.

If errors are inside `speaking-grader.ts`, fix them. Common fix: `result.text` typing complaint → keep the `as { text?: string }` cast.

- [ ] **Step 2.4: Commit**

```bash
cd /Users/thienuser/Documents/english_learning_app/.claude/worktrees/loving-raman-751a9f
git add apps/web/lib/toeic/speaking-grader.ts
git commit -m "feat(toeic): transcribeAudio returns word-level data (verbose_json)"
```

---

## Task 3: Extend `gradeSpeaking` prompt with metrics

**Files:**
- Modify: `apps/web/lib/toeic/speaking-grader.ts`

The grader prompt today just shows the transcript. We append a "Pronunciation metrics" block when metrics are available so Gemini can reference concrete numbers in its Vietnamese feedback.

- [ ] **Step 3.1: Update `GradeSpeakingInput` type**

In `apps/web/lib/toeic/speaking-grader.ts`, find:

```ts
export type GradeSpeakingInput = {
	type: SpeakingType;
	maxScore: number;
	transcript: string;
	durationMs: number;
	context: {
		textToRead?: string;
		imageUrl?: string;
		questionText?: string;
		contextText?: string;
		topic?: string;
	};
};
```

Replace with:

```ts
export type GradeSpeakingInput = {
	type: SpeakingType;
	maxScore: number;
	transcript: string;
	durationMs: number;
	context: {
		textToRead?: string;
		imageUrl?: string;
		questionText?: string;
		contextText?: string;
		topic?: string;
	};
	/** Optional pronunciation metrics — when provided, included in the LLM prompt. */
	metrics?: import("./pronunciation-analysis").PronunciationMetrics;
};
```

- [ ] **Step 3.2: Add a `formatMetricsBlock` helper above `buildPrompt`**

In the same file, add this helper just before `function buildPrompt(input: GradeSpeakingInput): string {`:

```ts
function formatMetricsBlock(
	metrics: import("./pronunciation-analysis").PronunciationMetrics | undefined,
): string {
	if (!metrics) return "";
	const lines = [
		`Pronunciation metrics (computed from Whisper word timing):`,
		`- Pace: ${metrics.wpm} WPM (target for native-like fluency: 130–160)`,
		`- Filler words: ${metrics.fillerCount}${metrics.fillerCount > 0 ? ` (≈${metrics.fillerRate}/min)` : ""}`,
		`- Long pauses: ${metrics.longPauseCount} (gaps over 2 seconds between words)`,
		`- Avg confidence: ${metrics.avgConfidence.toFixed(2)}`,
	];
	if (metrics.lowConfidenceWords.length > 0) {
		lines.push(`- Unclear words (low Whisper confidence): ${metrics.lowConfidenceWords.map((w) => `"${w}"`).join(", ")}`);
	}
	if (metrics.alignment) {
		lines.push("");
		lines.push(`Read accuracy: ${metrics.alignment.matchedWords}/${metrics.alignment.expectedWords} words matched (${Math.round(metrics.alignment.accuracy * 100)}%).`);
		if (metrics.alignment.missingWords.length > 0) {
			lines.push(`Words skipped (not spoken): ${metrics.alignment.missingWords.slice(0, 8).map((w) => `"${w}"`).join(", ")}`);
		}
		if (metrics.alignment.addedWords.length > 0) {
			lines.push(`Words added (likely fillers/substitutions): ${metrics.alignment.addedWords.slice(0, 8).map((w) => `"${w}"`).join(", ")}`);
		}
	}
	return lines.join("\n");
}
```

- [ ] **Step 3.3: Inject the metrics block into each prompt branch**

Find `function buildPrompt(input: GradeSpeakingInput): string {`. After the line `const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;`, add:

```ts
const metricsBlock = formatMetricsBlock(input.metrics);
```

Now find each `if (type === "..."` branch's return string and inject `metricsBlock` before the rubric. The pattern: in each branch's template literal, insert `${metricsBlock ? metricsBlock + "\n\n" : ""}` between the user's transcribed answer block and the rubric.

For example, the `q1_2_read_aloud` branch currently is:

```ts
	if (type === "q1_2_read_aloud") {
		return `Grading TOEIC Speaking Q1-2 (read aloud).

Original text:
"""
${context.textToRead}
"""
User's transcribed reading:
"""
${transcript}
"""
Duration: ${seconds}s · ${wordCount} words.

Rubric (0-${maxScore}):
- 3 = highly intelligible, accurate pronunciation, appropriate pace
- 2 = generally intelligible with minor issues
- 1 = limited intelligibility OR many missing words
- 0 = blank or unintelligible

Output strict JSON: {
  "rawScore": <0-${maxScore}>,
  "rubricScores": {"pronunciation": <0-3>, "fluency": <0-3>, "accuracy": <0-3>},
  "feedbackVi": "<2-3 câu góp ý tiếng Việt>"
}`;
	}
```

Change to:

```ts
	if (type === "q1_2_read_aloud") {
		return `Grading TOEIC Speaking Q1-2 (read aloud).

Original text:
"""
${context.textToRead}
"""
User's transcribed reading:
"""
${transcript}
"""
Duration: ${seconds}s · ${wordCount} words.

${metricsBlock ? metricsBlock + "\n\n" : ""}Rubric (0-${maxScore}):
- 3 = highly intelligible, accurate pronunciation, appropriate pace
- 2 = generally intelligible with minor issues
- 1 = limited intelligibility OR many missing words
- 0 = blank or unintelligible

The Vietnamese feedback (feedbackVi) MUST cite at least one concrete number from the metrics (WPM, filler count, accuracy %, or a specific unclear/missing word). 2-3 sentences.

Output strict JSON: {
  "rawScore": <0-${maxScore}>,
  "rubricScores": {"pronunciation": <0-3>, "fluency": <0-3>, "accuracy": <0-3>},
  "feedbackVi": "<2-3 câu góp ý tiếng Việt>"
}`;
	}
```

Apply the same change to the other 4 branches: `q3_4_describe_picture`, `q5_7_respond_question`, `q8_10_respond_info`, `q11_opinion`. In each, insert `${metricsBlock ? metricsBlock + "\n\n" : ""}` directly before `Rubric (0-${maxScore}):` and add the same "feedbackVi MUST cite at least one concrete number" instruction sentence.

- [ ] **Step 3.4: Smoke-check via tsc**

```bash
cd apps/web && pnpm exec tsc --noEmit
```

Expected: any remaining errors are in `submit-response/route.ts` (consumer not updated yet). The changes in `speaking-grader.ts` itself should typecheck.

- [ ] **Step 3.5: Commit**

```bash
cd /Users/thienuser/Documents/english_learning_app/.claude/worktrees/loving-raman-751a9f
git add apps/web/lib/toeic/speaking-grader.ts
git commit -m "feat(toeic): gradeSpeaking prompt now includes pronunciation metrics block"
```

---

## Task 4: Wire metrics through `submit-response` route

**Files:**
- Modify: `apps/web/app/api/toeic-speaking/submit-response/route.ts`

The route owns the lifecycle: transcribe → compute metrics → grade → persist. After this task, `tsc --noEmit` should be clean.

- [ ] **Step 4.1: Update imports**

At the top of `apps/web/app/api/toeic-speaking/submit-response/route.ts`, find:

```ts
import { transcribeAudio, gradeSpeaking, type SpeakingType } from "@/lib/toeic/speaking-grader";
```

Replace with:

```ts
import { transcribeAudio, gradeSpeaking, type SpeakingType } from "@/lib/toeic/speaking-grader";
import { computeFluency, computeAlignment, type PronunciationMetrics } from "@/lib/toeic/pronunciation-analysis";
```

- [ ] **Step 4.2: Update transcribe + grade block**

Find the current block:

```ts
	let transcript = "";
	let grade: { rawScore: number; rubricScores: Record<string, number>; feedbackVi: string };
	try {
		transcript = await transcribeAudio(audioPath, "audio/webm");
		grade = await gradeSpeaking({
			type: prompt.type as SpeakingType,
			maxScore: prompt.maxScore,
			transcript,
			durationMs,
			context: {
				textToRead: prompt.textToRead ?? undefined,
				imageUrl: prompt.imageUrl ?? undefined,
				questionText: prompt.questionText ?? undefined,
				contextText: prompt.contextText ?? undefined,
				topic: prompt.topic ?? undefined,
			},
		});
	} catch (err) {
		grade = {
			rawScore: 0,
			rubricScores: {},
			feedbackVi: `Transcribe/grade failed: ${err instanceof Error ? err.message : "unknown"}`,
		};
	}
```

Replace with:

```ts
	let transcript = "";
	let metrics: PronunciationMetrics | undefined;
	let grade: { rawScore: number; rubricScores: Record<string, number>; feedbackVi: string };
	try {
		const transcribed = await transcribeAudio(audioPath, "audio/webm");
		transcript = transcribed.text;

		// Always compute fluency
		metrics = computeFluency(transcribed.words, durationMs);

		// Q1-2: also compute forced alignment vs the read-aloud text
		if (prompt.type === "q1_2_read_aloud" && prompt.textToRead) {
			metrics.alignment = computeAlignment(prompt.textToRead, transcribed.words);
		}

		grade = await gradeSpeaking({
			type: prompt.type as SpeakingType,
			maxScore: prompt.maxScore,
			transcript,
			durationMs,
			context: {
				textToRead: prompt.textToRead ?? undefined,
				imageUrl: prompt.imageUrl ?? undefined,
				questionText: prompt.questionText ?? undefined,
				contextText: prompt.contextText ?? undefined,
				topic: prompt.topic ?? undefined,
			},
			metrics,
		});
	} catch (err) {
		grade = {
			rawScore: 0,
			rubricScores: {},
			feedbackVi: `Transcribe/grade failed: ${err instanceof Error ? err.message : "unknown"}`,
		};
	}
```

- [ ] **Step 4.3: Persist metrics inside `rubricScores`**

Find the existing insert block (search for `db.insert(toeicSpeakingResponse)`). Two places need `rubricScores` updated — the `.values({...})` and the `.onConflictDoUpdate({ ... set: {...} })`. Locate them.

Current `.values` block (snippet):

```ts
		.values({
			sessionId,
			promptId,
			audioPath: audioPath.replace(join(process.cwd(), ""), "").replace(/^\//, ""),
			transcript,
			durationMs,
			rubricScores: grade.rubricScores,
			rawScore: grade.rawScore,
			feedbackVi: grade.feedbackVi,
		})
```

Change `rubricScores: grade.rubricScores` to:

```ts
			rubricScores: { ...grade.rubricScores, ...(metrics ? { pronunciation: metrics } : {}) },
```

Apply the same change to the `.onConflictDoUpdate({ target: [...], set: { ... rubricScores: grade.rubricScores ... } })` block.

So both occurrences of `rubricScores: grade.rubricScores` become:

```ts
			rubricScores: { ...grade.rubricScores, ...(metrics ? { pronunciation: metrics } : {}) },
```

- [ ] **Step 4.4: Update return payload to include metrics**

Find the route's `return Response.json({ ... })`. It currently returns:

```ts
	return Response.json({
		rawScore: grade.rawScore,
		maxScore: prompt.maxScore,
		rubricScores: grade.rubricScores,
		feedbackVi: grade.feedbackVi,
		transcript,
	});
```

Change to:

```ts
	return Response.json({
		rawScore: grade.rawScore,
		maxScore: prompt.maxScore,
		rubricScores: grade.rubricScores,
		feedbackVi: grade.feedbackVi,
		transcript,
		pronunciation: metrics ?? null,
	});
```

- [ ] **Step 4.5: Smoke-check via tsc**

```bash
cd apps/web && pnpm exec tsc --noEmit
```

Expected: clean (no errors anywhere now that the consumer matches the new shape).

- [ ] **Step 4.6: Commit**

```bash
cd /Users/thienuser/Documents/english_learning_app/.claude/worktrees/loving-raman-751a9f
git add apps/web/app/api/toeic-speaking/submit-response/route.ts
git commit -m "feat(toeic): submit-response computes + persists pronunciation metrics"
```

---

## Task 5: Render "Phát âm" section on the result page

**Files:**
- Modify: `apps/web/app/(app)/toeic/speaking/[id]/result/page.tsx`

Surface the metrics under each response card. Conditional rendering — old responses without `rubricScores.pronunciation` still display fine.

- [ ] **Step 5.1: Read the file to confirm current shape**

Confirm the per-response card structure in `apps/web/app/(app)/toeic/speaking/[id]/result/page.tsx`. The current per-response render is around line 89: `prompts.sort(...).map((p) => { const r = responses.find(...) ... return (<Card ...>...</Card>) })`.

- [ ] **Step 5.2: Add a `PronunciationCard` helper component above the page export**

In the same file (it's a server component but Antd `<Tag>` and `<Card>` work fine in server-rendered output), add this helper right after the existing `TYPE_LABEL` constant block, before the `export default async function SpeakingResultPage`:

```tsx
type PronMetrics = {
	wpm: number;
	fillerCount: number;
	fillerRate: number;
	longPauseCount: number;
	avgConfidence: number;
	lowConfidenceWords: string[];
	alignment?: {
		expectedWords: number;
		spokenWords: number;
		matchedWords: number;
		missingWords: string[];
		addedWords: string[];
		accuracy: number;
	};
};

function PronunciationSection({ metrics }: { metrics: PronMetrics }) {
	const wpmOk = metrics.wpm >= 110 && metrics.wpm <= 175;
	return (
		<div
			style={{
				background: "var(--surface, #0f172a)",
				padding: 12,
				borderRadius: 6,
				marginTop: 8,
			}}
		>
			<div style={{ fontWeight: 600, marginBottom: 6 }}>📊 Phát âm</div>
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
					gap: 8,
					fontSize: 13,
				}}
			>
				<div>
					Pace: <strong>{metrics.wpm} WPM</strong> {wpmOk ? "✓" : "⚠"}
				</div>
				<div>
					Filler: <strong>{metrics.fillerCount}</strong>
					{metrics.fillerRate > 0 ? ` (${metrics.fillerRate}/phút)` : ""}
				</div>
				<div>
					Pause dài: <strong>{metrics.longPauseCount}</strong>
				</div>
				<div>
					Confidence: <strong>{metrics.avgConfidence.toFixed(2)}</strong>
				</div>
			</div>
			{metrics.lowConfidenceWords.length > 0 && (
				<div style={{ marginTop: 8, fontSize: 13 }}>
					<span style={{ color: "var(--text-muted, #94a3b8)" }}>Từ phát âm không rõ: </span>
					{metrics.lowConfidenceWords.map((w) => (
						<Tag key={w} color="orange" style={{ margin: "2px 4px 2px 0" }}>
							{w}
						</Tag>
					))}
				</div>
			)}
			{metrics.alignment && (
				<div style={{ marginTop: 8, fontSize: 13 }}>
					<div>
						Accuracy:{" "}
						<strong>
							{Math.round(metrics.alignment.accuracy * 100)}% (
							{metrics.alignment.matchedWords}/{metrics.alignment.expectedWords} từ)
						</strong>
					</div>
					{metrics.alignment.missingWords.length > 0 && (
						<div style={{ marginTop: 4 }}>
							<span style={{ color: "var(--text-muted, #94a3b8)" }}>Bỏ qua: </span>
							{metrics.alignment.missingWords.slice(0, 8).map((w) => (
								<Tag key={w} color="red" style={{ margin: "2px 4px 2px 0" }}>
									{w}
								</Tag>
							))}
						</div>
					)}
					{metrics.alignment.addedWords.length > 0 && (
						<div style={{ marginTop: 4 }}>
							<span style={{ color: "var(--text-muted, #94a3b8)" }}>Thêm: </span>
							{metrics.alignment.addedWords.slice(0, 8).map((w) => (
								<Tag key={w} color="purple" style={{ margin: "2px 4px 2px 0" }}>
									{w}
								</Tag>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
```

- [ ] **Step 5.3: Render the section in each response card**

In the per-response render (the `prompts.sort(...).map((p) => { ... return (<Card>...</Card>) })` block), find where `r.feedbackVi` is rendered. After the `feedbackVi` block, add the pronunciation section.

Current block (around the feedback render):

```tsx
									{r.feedbackVi && (
										<div
											style={{
												fontSize: 13,
												color: "var(--text-muted, #cbd5e1)",
												borderLeft: "3px solid #3b82f6",
												paddingLeft: 10,
											}}
										>
											<strong>Feedback:</strong> {r.feedbackVi}
										</div>
									)}
```

Add right after the closing `)}` of the feedback conditional:

```tsx
									{(() => {
										const pron = (r.rubricScores as { pronunciation?: PronMetrics } | null)?.pronunciation;
										return pron ? <PronunciationSection metrics={pron} /> : null;
									})()}
```

- [ ] **Step 5.4: Smoke-check via tsc**

```bash
cd apps/web && pnpm exec tsc --noEmit
```

Expected: clean.

- [ ] **Step 5.5: Manual smoke (optional, requires running app)**

If the dev server is running locally with seeded TOEIC speaking content:

```bash
cd apps/web && pnpm dev
```

Visit `/toeic/speaking`, complete a 1-question session (e.g. interrupt after Q1 with "Dừng + Nộp"), then visit the resulting `/toeic/speaking/<id>/result`. Confirm:

- New "📊 Phát âm" block renders under the per-question card.
- WPM number is reasonable (60–200).
- Q1 (read aloud) shows the alignment subsection with accuracy %.
- Vietnamese feedback now mentions a concrete metric (WPM, filler count, or a specific word).

Skip this step if no DB / dev server is available; the typecheck is sufficient gate.

- [ ] **Step 5.6: Commit**

```bash
cd /Users/thienuser/Documents/english_learning_app/.claude/worktrees/loving-raman-751a9f
git add apps/web/app/\(app\)/toeic/speaking/\[id\]/result/page.tsx
git commit -m "feat(toeic): render Phát âm section on speaking result page"
```

---

## Final Verification

- [ ] **All tasks committed**

```bash
git log --oneline -6
```

Expected last 5 commits in order (most recent first):
1. `feat(toeic): render Phát âm section on speaking result page`
2. `feat(toeic): submit-response computes + persists pronunciation metrics`
3. `feat(toeic): gradeSpeaking prompt now includes pronunciation metrics block`
4. `feat(toeic): transcribeAudio returns word-level data (verbose_json)`
5. `feat(toeic): add pronunciation-analysis pure functions (Whisper word-level)`
6. `docs: add TOEIC pronunciation feedback design spec (S7 enhancement)`

- [ ] **Final typecheck**

```bash
cd apps/web && pnpm exec tsc --noEmit
```

Expected: clean.

- [ ] **Spec compliance check**

Re-open `docs/superpowers/specs/2026-05-10-toeic-pronunciation-feedback-design.md` "Definition of done" and verify each:

- [x] 30-second recording produces correct WPM, filler, pause, low-confidence — covered by Task 1 + Task 4 wiring.
- [x] Q1-2 alignment computes accuracy = 1.0 on exact match — Task 1 LCS handles this.
- [x] `rubricScores.pronunciation` persisted — Task 4.3.
- [x] Result page renders "Phát âm" section with metrics + Q1-2 alignment block — Task 5.
- [x] Vietnamese feedback references a concrete metric — Task 3 prompt instruction.

All boxes covered.
