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

const FILLER_TOKENS = new Set(["uh", "um", "uhh", "umm", "hmm", "ah", "er", "erm"]);
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
				i++;
			}
		}
	}
	const fillerRate = totalMinutes > 0 ? Math.round(fillerCount / totalMinutes) : 0;

	let longPauseCount = 0;
	for (let i = 0; i < cleanWords.length - 1; i++) {
		const gap = cleanWords[i + 1].start - cleanWords[i].end;
		if (gap > LONG_PAUSE_SEC) longPauseCount++;
	}

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
 * Forced alignment via LCS between expected text and spoken Whisper words.
 * Used only for Q1-2 read aloud where the user reads a known passage.
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

	const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
	for (let i = 0; i < m; i++) {
		for (let j = 0; j < n; j++) {
			dp[i + 1][j + 1] =
				expected[i] === spoken[j]
					? dp[i][j] + 1
					: Math.max(dp[i + 1][j], dp[i][j + 1]);
		}
	}

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
