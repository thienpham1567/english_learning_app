/**
 * Learner-Friendly Improvement Statements (Story 26.2, AC: 1-4)
 *
 * Generates human-readable progress statements in Vietnamese
 * based on measurable learning evidence.
 */

// ── Types ───────────────────────────────────────────────────────────────────

export interface EvidenceData {
	/** Total unique words remembered (flashcard mastery) */
	rememberedWords?: number;
	/** Previous period's remembered words */
	previousRememberedWords?: number;
	/** Total resolved error count */
	resolvedErrors?: number;
	/** Previous period's resolved error count */
	previousResolvedErrors?: number;
	/** Current reading level estimate */
	readingLevel?: string;
	/** Previous reading level */
	previousReadingLevel?: string;
	/** Average speaking duration in seconds (recent) */
	speakingDuration?: number;
	/** Previous average speaking duration */
	previousSpeakingDuration?: number;
	/** Listening comprehension speed (words per minute) */
	listeningSpeed?: number;
	/** Previous listening speed */
	previousListeningSpeed?: number;
	/** Total practice sessions this period */
	totalSessions?: number;
}

export interface ImprovementStatement {
	/** The statement text (Vietnamese) */
	text: string;
	/** Evidence category it links to (AC: 2) */
	category: "vocabulary" | "errors" | "reading" | "speaking" | "listening" | "consistency";
	/** Confidence in the statement (AC: 3) */
	confidence: "high" | "moderate" | "low";
	/** Emoji for the statement */
	emoji: string;
}

// ── Statement Generators (AC: 1, 2) ────────────────────────────────────────

function vocabularyStatement(data: EvidenceData): ImprovementStatement | null {
	if (!data.rememberedWords || data.rememberedWords < 5) return null;
	const gained = data.previousRememberedWords != null
		? data.rememberedWords - data.previousRememberedWords
		: 0;

	if (gained > 0) {
		return {
			text: `Bạn đã nhớ thêm ${gained} từ mới! Tổng: ${data.rememberedWords} từ.`,
			category: "vocabulary",
			confidence: gained >= 10 ? "high" : "moderate",
			emoji: "📚",
		};
	}

	return {
		text: `Bạn đang duy trì ${data.rememberedWords} từ vựng đã học.`,
		category: "vocabulary",
		confidence: "moderate",
		emoji: "📚",
	};
}

function errorReductionStatement(data: EvidenceData): ImprovementStatement | null {
	if (data.resolvedErrors == null || data.resolvedErrors < 1) return null;
	const reduced = data.previousResolvedErrors != null
		? data.resolvedErrors - data.previousResolvedErrors
		: data.resolvedErrors;

	if (reduced > 0) {
		return {
			text: `Bạn đã sửa thêm ${reduced} lỗi lặp lại! Tổng: ${data.resolvedErrors} lỗi đã xử lý.`,
			category: "errors",
			confidence: reduced >= 3 ? "high" : "moderate",
			emoji: "✅",
		};
	}
	return null;
}

function readingStatement(data: EvidenceData): ImprovementStatement | null {
	if (!data.readingLevel) return null;
	if (data.previousReadingLevel && data.readingLevel !== data.previousReadingLevel) {
		return {
			text: `Trình độ đọc tăng từ ${data.previousReadingLevel} lên ${data.readingLevel}!`,
			category: "reading",
			confidence: "high",
			emoji: "📰",
		};
	}
	return {
		text: `Trình độ đọc hiện tại: ${data.readingLevel}.`,
		category: "reading",
		confidence: "low",
		emoji: "📰",
	};
}

function speakingStatement(data: EvidenceData): ImprovementStatement | null {
	if (!data.speakingDuration) return null;
	if (data.previousSpeakingDuration && data.speakingDuration > data.previousSpeakingDuration) {
		const gain = Math.round(data.speakingDuration - data.previousSpeakingDuration);
		return {
			text: `Thời lượng nói tăng thêm ${gain} giây mỗi phiên!`,
			category: "speaking",
			confidence: gain >= 10 ? "high" : "moderate",
			emoji: "🗣️",
		};
	}
	return null;
}

function listeningStatement(data: EvidenceData): ImprovementStatement | null {
	if (!data.listeningSpeed) return null;
	if (data.previousListeningSpeed && data.listeningSpeed > data.previousListeningSpeed) {
		const gain = Math.round(data.listeningSpeed - data.previousListeningSpeed);
		return {
			text: `Tốc độ nghe cải thiện thêm ${gain} từ/phút!`,
			category: "listening",
			confidence: gain >= 5 ? "high" : "moderate",
			emoji: "🎧",
		};
	}
	return null;
}

function consistencyStatement(data: EvidenceData): ImprovementStatement | null {
	if (!data.totalSessions || data.totalSessions < 3) return null;
	return {
		text: `Bạn đã hoàn thành ${data.totalSessions} phiên luyện tập tuần này. Tuyệt vời!`,
		category: "consistency",
		confidence: data.totalSessions >= 5 ? "high" : "moderate",
		emoji: "🔥",
	};
}

// ── Main Generator (AC: 1, 3) ──────────────────────────────────────────────

/**
 * Generates learner-friendly improvement statements (AC: 1-4).
 *
 * AC: 1 — Statements cover vocab, errors, reading, speaking, listening
 * AC: 2 — Each links to an evidence category
 * AC: 3 — Avoids overstating when data is sparse
 * AC: 4 — Copy in Vietnamese
 */
export function generateImprovementStatements(data: EvidenceData): ImprovementStatement[] {
	const generators = [
		vocabularyStatement,
		errorReductionStatement,
		readingStatement,
		speakingStatement,
		listeningStatement,
		consistencyStatement,
	];

	const statements: ImprovementStatement[] = [];

	for (const gen of generators) {
		const stmt = gen(data);
		if (stmt) statements.push(stmt);
	}

	// AC: 3 — If no improvement found, add a gentle encouragement
	if (statements.length === 0) {
		statements.push({
			text: "Hãy luyện tập thêm để thấy sự tiến bộ rõ rệt!",
			category: "consistency",
			confidence: "low",
			emoji: "💪",
		});
	}

	return statements;
}
