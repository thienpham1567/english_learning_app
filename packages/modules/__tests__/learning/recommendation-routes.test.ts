import { describe, expect, it } from "vitest";
import {
	SKILL_TO_URL,
	candidatesFromDueReviews,
	candidatesFromWeakSkills,
	candidatesFromDefaultActions,
} from "../../src/learning/recommendation-adapters";
import type { UserSkillState } from "@repo/contracts";

// ── Route Allowlist ─────────────────────────────────────────────────────────
// These are the real Next.js routes under apps/web/app/(app)/.
// If a new module is added to the app, add its route here — otherwise the
// route-coverage test below will correctly fail (AC: 3).

const KNOWN_APP_ROUTES = new Set([
	"/",
	"/home",
	"/english-chatbot",
	"/dictionary",
	"/my-vocabulary",
	"/flashcards",
	"/grammar-quiz",
	"/grammar-lessons",
	"/study-sets",
	"/writing-practice",
	"/daily-challenge",
	"/listening",
	"/progress",
	"/pronunciation",
	"/reading",
	"/mock-test",
	"/review-quiz",
	"/error-notebook",
	"/diagnostic",
	"/scenarios",
	"/speaking-practice",
]);

// ── Helpers ─────────────────────────────────────────────────────────────────

const NOW = Date.now();

function makeSkillState(skillId: string): UserSkillState {
	return {
		id: `state-${skillId}`,
		userId: "u1",
		skillId,
		proficiency: 30,
		confidence: 0.3,
		lastPracticedAt: new Date(NOW - 48 * 60 * 60 * 1000).toISOString(),
		nextReviewAt: new Date(NOW - 1000).toISOString(), // overdue
		reviewCount: 3,
		createdAt: new Date(NOW).toISOString(),
		updatedAt: new Date(NOW).toISOString(),
	};
}

// ── SKILL_TO_URL static check (AC: 3) ───────────────────────────────────────

describe("SKILL_TO_URL — route allowlist coverage", () => {
	it("every URL in SKILL_TO_URL maps to a known app route (AC: 3)", () => {
		for (const [skill, url] of Object.entries(SKILL_TO_URL)) {
			expect(
				KNOWN_APP_ROUTES.has(url),
				`SKILL_TO_URL["${skill}"] = "${url}" does not match any known app route`,
			).toBe(true);
		}
	});

	it("speaking skill does NOT point to /chatbot (AC: 2)", () => {
		expect(SKILL_TO_URL["speaking"]).not.toBe("/chatbot");
	});

	it("speaking skill points to /english-chatbot (AC: 2)", () => {
		expect(SKILL_TO_URL["speaking"]).toBe("/english-chatbot");
	});
});

// ── candidatesFromDueReviews route validation (AC: 1, 4) ────────────────────

describe("candidatesFromDueReviews — route correctness", () => {
	const ALL_SKILLS = ["vocabulary", "grammar", "listening", "speaking", "pronunciation", "reading", "writing", "exam_strategy"];

	it.each(ALL_SKILLS)("due review for '%s' generates a known app route (AC: 1, 4)", (skillId) => {
		const candidates = candidatesFromDueReviews([makeSkillState(skillId)], NOW);
		expect(candidates.length).toBeGreaterThanOrEqual(1);
		const url = candidates[0]!.actionUrl;
		expect(
			KNOWN_APP_ROUTES.has(url),
			`Due review for "${skillId}" generated actionUrl="${url}" which is not a known route`,
		).toBe(true);
	});

	it("speaking due review does NOT generate /chatbot URL (AC: 2)", () => {
		const candidates = candidatesFromDueReviews([makeSkillState("speaking")], NOW);
		expect(candidates.length).toBe(1);
		expect(candidates[0]!.actionUrl).not.toBe("/chatbot");
		expect(candidates[0]!.actionUrl).toBe("/english-chatbot");
	});
});

// ── candidatesFromWeakSkills route validation (AC: 1, 4) ────────────────────

describe("candidatesFromWeakSkills — route correctness", () => {
	const ALL_SKILLS = ["vocabulary", "grammar", "listening", "speaking", "pronunciation", "reading", "writing", "exam_strategy"];

	it.each(ALL_SKILLS)("weak skill '%s' generates a known app route (AC: 1, 4)", (skillId) => {
		const state = makeSkillState(skillId);
		state.proficiency = 10; // ensure it qualifies as weak
		state.confidence = 0.2;
		const candidates = candidatesFromWeakSkills([state], NOW);
		expect(candidates.length).toBeGreaterThanOrEqual(1);
		const url = candidates[0]!.actionUrl;
		expect(
			KNOWN_APP_ROUTES.has(url),
			`Weak skill "${skillId}" generated actionUrl="${url}" which is not a known route`,
		).toBe(true);
	});
});

// ── candidatesFromDefaultActions route validation (AC: 1, 4) ────────────────

describe("candidatesFromDefaultActions — route correctness", () => {
	it("all default study actions generate known app routes (AC: 1, 4)", () => {
		const candidates = candidatesFromDefaultActions(new Set());
		expect(candidates.length).toBeGreaterThan(0);
		for (const c of candidates) {
			expect(
				KNOWN_APP_ROUTES.has(c.actionUrl),
				`Default action "${c.label}" has actionUrl="${c.actionUrl}" which is not a known route`,
			).toBe(true);
		}
	});

	it("speaking default action does NOT point to /chatbot (AC: 2)", () => {
		const candidates = candidatesFromDefaultActions(new Set());
		const speakingCandidate = candidates.find((c) => c.id === "default-speaking");
		expect(speakingCandidate).toBeDefined();
		expect(speakingCandidate!.actionUrl).not.toBe("/chatbot");
		expect(speakingCandidate!.actionUrl).toBe("/english-chatbot");
	});
});
