import { z } from "zod/v4";
import { LearningModuleType } from "./learning-event";

// ── Skill (AC: 1, 2) ───────────────────────────────────────────────────────

export const SkillSchema = z.object({
	id: z.string().min(1),
	label: z.string().min(1),
	cefrRelevance: z.array(z.string()),
});

// ── Subskill (AC: 1, 2) ────────────────────────────────────────────────────

export const SubskillSchema = z.object({
	id: z.string().min(1),
	label: z.string().min(1),
	parentSkillId: z.string().min(1),
	cefrRelevance: z.array(z.string()),
});

// ── Taxonomy Version (AC: 5) ───────────────────────────────────────────────

export const SkillTaxonomyVersionSchema = z.object({
	version: z.string().min(1),
	effectiveDate: z.string().min(1),
});

// ── Module → Skill Mapping (AC: 3) ─────────────────────────────────────────

export const ModuleSkillMappingSchema = z.object({
	moduleType: LearningModuleType,
	skillIds: z.array(z.string()).min(1),
});

// ── Inferred types ──────────────────────────────────────────────────────────

export type Skill = z.infer<typeof SkillSchema>;
export type Subskill = z.infer<typeof SubskillSchema>;
export type SkillTaxonomyVersion = z.infer<typeof SkillTaxonomyVersionSchema>;
export type ModuleSkillMapping = z.infer<typeof ModuleSkillMappingSchema>;
