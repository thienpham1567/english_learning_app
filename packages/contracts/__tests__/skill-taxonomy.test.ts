import { describe, expect, it } from "vitest";
import {
	SkillSchema,
	SubskillSchema,
	SkillTaxonomyVersionSchema,
	ModuleSkillMappingSchema,
	type Skill,
	type Subskill,
} from "../src/learning";

// ── Valid payloads ──────────────────────────────────────────────────────────

const VALID_SKILL: Skill = {
	id: "listening",
	label: "Listening",
	cefrRelevance: ["A2", "B1", "B2", "C1", "C2"],
};

const VALID_SUBSKILL: Subskill = {
	id: "listening-comprehension",
	label: "Listening Comprehension",
	parentSkillId: "listening",
	cefrRelevance: ["A2", "B1", "B2"],
};

// ── Skill Schema Tests ──────────────────────────────────────────────────────

describe("SkillSchema", () => {
	it("parses a valid skill", () => {
		const result = SkillSchema.safeParse(VALID_SKILL);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.id).toBe("listening");
			expect(result.data.cefrRelevance).toHaveLength(5);
		}
	});

	it("rejects missing id", () => {
		const { id, ...rest } = VALID_SKILL;
		expect(SkillSchema.safeParse(rest).success).toBe(false);
	});

	it("rejects empty id", () => {
		expect(SkillSchema.safeParse({ ...VALID_SKILL, id: "" }).success).toBe(false);
	});

	it("rejects missing label", () => {
		const { label, ...rest } = VALID_SKILL;
		expect(SkillSchema.safeParse(rest).success).toBe(false);
	});

	it("rejects missing cefrRelevance", () => {
		const { cefrRelevance, ...rest } = VALID_SKILL;
		expect(SkillSchema.safeParse(rest).success).toBe(false);
	});
});

// ── Subskill Schema Tests ───────────────────────────────────────────────────

describe("SubskillSchema", () => {
	it("parses a valid subskill", () => {
		const result = SubskillSchema.safeParse(VALID_SUBSKILL);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.parentSkillId).toBe("listening");
		}
	});

	it("rejects missing parentSkillId", () => {
		const { parentSkillId, ...rest } = VALID_SUBSKILL;
		expect(SubskillSchema.safeParse(rest).success).toBe(false);
	});
});

// ── Version Schema Tests ────────────────────────────────────────────────────

describe("SkillTaxonomyVersionSchema", () => {
	it("parses a valid version", () => {
		const result = SkillTaxonomyVersionSchema.safeParse({
			version: "1.0.0",
			effectiveDate: "2026-04-22",
		});
		expect(result.success).toBe(true);
	});

	it("rejects missing version", () => {
		expect(SkillTaxonomyVersionSchema.safeParse({ effectiveDate: "2026-04-22" }).success).toBe(false);
	});
});

// ── Module Mapping Schema Tests ─────────────────────────────────────────────

describe("ModuleSkillMappingSchema", () => {
	it("parses a valid mapping entry", () => {
		const result = ModuleSkillMappingSchema.safeParse({
			moduleType: "listening",
			skillIds: ["listening", "vocabulary"],
		});
		expect(result.success).toBe(true);
	});

	it("rejects empty skillIds array", () => {
		const result = ModuleSkillMappingSchema.safeParse({
			moduleType: "listening",
			skillIds: [],
		});
		expect(result.success).toBe(false);
	});

	it("rejects invalid moduleType", () => {
		const result = ModuleSkillMappingSchema.safeParse({
			moduleType: "nonexistent",
			skillIds: ["listening"],
		});
		expect(result.success).toBe(false);
	});
});
