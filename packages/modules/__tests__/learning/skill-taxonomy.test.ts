import { describe, expect, it } from "vitest";
import {
	TAXONOMY_VERSION,
	SKILLS,
	SUBSKILLS,
	MODULE_SKILL_MAP,
	ACTIVITY_SKILL_MAP,
	getSkillById,
	getSubskillsForSkill,
	resolveSkillsForModule,
	resolveSkillsForActivity,
} from "../../src/learning";
import { LearningModuleType } from "@repo/contracts";

// ── Activity type values from database activityTypeEnum ─────────────────────

const ALL_ACTIVITY_TYPES = [
	"flashcard_review",
	"grammar_quiz",
	"grammar_lesson",
	"study_set",
	"writing_practice",
	"daily_challenge",
	"chatbot_session",
	"voice_practice",
	"listening_practice",
	"diagnostic_test",
] as const;

// ── Taxonomy Version (AC: 5) ────────────────────────────────────────────────

describe("TAXONOMY_VERSION", () => {
	it("has a semver-style version string", () => {
		expect(TAXONOMY_VERSION.version).toMatch(/^\d+\.\d+\.\d+$/);
	});

	it("has an effective date", () => {
		expect(TAXONOMY_VERSION.effectiveDate).toBeTruthy();
	});
});

// ── Skills (AC: 1) ──────────────────────────────────────────────────────────

describe("SKILLS", () => {
	it("includes all 8 canonical top-level skills", () => {
		const ids = SKILLS.map((s) => s.id);
		for (const expected of [
			"vocabulary",
			"grammar",
			"listening",
			"speaking",
			"pronunciation",
			"reading",
			"writing",
			"exam_strategy",
		]) {
			expect(ids).toContain(expected);
		}
	});

	it("every skill has a non-empty label and cefrRelevance", () => {
		for (const skill of SKILLS) {
			expect(skill.label.length).toBeGreaterThan(0);
			expect(skill.cefrRelevance.length).toBeGreaterThan(0);
		}
	});
});

// ── Subskills (AC: 2 — parent-child relationships) ─────────────────────────

describe("SUBSKILLS", () => {
	it("every subskill references a valid parent skill", () => {
		const skillIds = new Set(SKILLS.map((s) => s.id));
		for (const sub of SUBSKILLS) {
			expect(skillIds.has(sub.parentSkillId)).toBe(true);
		}
	});

	it("no subskill has the same id as a parent skill", () => {
		const skillIds = new Set(SKILLS.map((s) => s.id));
		for (const sub of SUBSKILLS) {
			expect(skillIds.has(sub.id)).toBe(false);
		}
	});

	it("all subskill IDs are unique", () => {
		const ids = SUBSKILLS.map((s) => s.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("each parent skill has at least one subskill", () => {
		for (const skill of SKILLS) {
			const children = getSubskillsForSkill(skill.id);
			expect(children.length).toBeGreaterThanOrEqual(1);
		}
	});
});

// ── Module Skill Mapping (AC: 3) ────────────────────────────────────────────

describe("MODULE_SKILL_MAP", () => {
	it("covers all LearningModuleType values", () => {
		expect(MODULE_SKILL_MAP.length).toBe(LearningModuleType.options.length);
	});

	it("every mapping references valid skill IDs", () => {
		const skillIds = new Set(SKILLS.map((s) => s.id));
		for (const mapping of MODULE_SKILL_MAP) {
			for (const sid of mapping.skillIds) {
				expect(skillIds.has(sid)).toBe(true);
			}
		}
	});
});

// ── Activity Type Mapping (AC: 3) ───────────────────────────────────────────

describe("ACTIVITY_SKILL_MAP", () => {
	it("covers every activityTypeEnum value", () => {
		for (const activityType of ALL_ACTIVITY_TYPES) {
			expect(ACTIVITY_SKILL_MAP[activityType]).toBeDefined();
			expect(ACTIVITY_SKILL_MAP[activityType]!.length).toBeGreaterThan(0);
		}
	});

	it("every mapped skill ID is a valid canonical skill", () => {
		const skillIds = new Set(SKILLS.map((s) => s.id));
		for (const skills of Object.values(ACTIVITY_SKILL_MAP)) {
			for (const sid of skills) {
				expect(skillIds.has(sid)).toBe(true);
			}
		}
	});
});

// ── Resolver Helpers (AC: 3, 4) ─────────────────────────────────────────────

describe("resolveSkillsForModule", () => {
	it("returns skill IDs for a valid module", () => {
		const skills = resolveSkillsForModule("listening");
		expect(skills).toContain("listening");
	});

	it("throws for an unmapped module type", () => {
		expect(() => resolveSkillsForModule("nonexistent" as any)).toThrow(
			"No skill mapping found for module type: nonexistent",
		);
	});
});

describe("resolveSkillsForActivity", () => {
	it("returns skill IDs for a valid activity", () => {
		const skills = resolveSkillsForActivity("flashcard_review");
		expect(skills).toContain("vocabulary");
	});

	it("throws for an unmapped activity type (AC: 4)", () => {
		expect(() => resolveSkillsForActivity("future_unknown_activity")).toThrow(
			"No skill mapping found for activity type: future_unknown_activity",
		);
	});
});

// ── Lookup Helpers ──────────────────────────────────────────────────────────

describe("getSkillById", () => {
	it("finds an existing skill", () => {
		const skill = getSkillById("grammar");
		expect(skill).toBeDefined();
		expect(skill!.label).toBe("Grammar");
	});

	it("returns undefined for unknown skill", () => {
		expect(getSkillById("nonexistent")).toBeUndefined();
	});
});

describe("getSubskillsForSkill", () => {
	it("returns subskills for a valid parent", () => {
		const subs = getSubskillsForSkill("listening");
		expect(subs.length).toBeGreaterThanOrEqual(2);
		for (const s of subs) {
			expect(s.parentSkillId).toBe("listening");
		}
	});

	it("returns empty array for unknown parent", () => {
		expect(getSubskillsForSkill("nonexistent")).toHaveLength(0);
	});
});
