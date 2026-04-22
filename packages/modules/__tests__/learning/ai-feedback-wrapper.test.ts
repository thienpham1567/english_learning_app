import { describe, expect, it, beforeEach } from "vitest";
import {
	hashPrompt,
	registerFeedbackTemplate,
	getFeedbackTemplate,
	wrapFeedbackCall,
} from "../../src/learning/ai-feedback-wrapper";
import { FeedbackRunSchema, FeedbackRequestSchema } from "@repo/contracts";

// ── hashPrompt (AC: 4) ─────────────────────────────────────────────────────

describe("hashPrompt", () => {
	it("returns a 16-char hex hash", () => {
		const hash = hashPrompt("Score this writing essay");
		expect(hash).toMatch(/^[a-f0-9]{16}$/);
	});

	it("returns same hash for same input", () => {
		const a = hashPrompt("Rate the pronunciation of: {word}");
		const b = hashPrompt("Rate the pronunciation of: {word}");
		expect(a).toBe(b);
	});

	it("returns different hash for different input (AC: 4)", () => {
		const v1 = hashPrompt("Score this writing v1");
		const v2 = hashPrompt("Score this writing v2 — improved");
		expect(v1).not.toBe(v2);
	});
});

// ── Template Registry (AC: 4) ───────────────────────────────────────────────

describe("registerFeedbackTemplate / getFeedbackTemplate", () => {
	beforeEach(() => {
		registerFeedbackTemplate({
			templateId: "test-writing-score",
			moduleType: "writing",
			templateVersion: "1.0.0",
			rubricVersion: "1.0.0",
			promptTemplate: "Score this writing essay: {text}",
			modelName: "gpt-4o-mini",
		});
	});

	it("registers and retrieves a template", () => {
		const t = getFeedbackTemplate("test-writing-score");
		expect(t.templateId).toBe("test-writing-score");
		expect(t.templateVersion).toBe("1.0.0");
		expect(t.moduleType).toBe("writing");
	});

	it("throws on unregistered template (AC: 4)", () => {
		expect(() => getFeedbackTemplate("nonexistent")).toThrow("not registered");
	});

	it("version bump requires explicit re-registration (AC: 4)", () => {
		registerFeedbackTemplate({
			templateId: "test-writing-score",
			moduleType: "writing",
			templateVersion: "2.0.0",
			rubricVersion: "1.1.0",
			promptTemplate: "Score this writing essay v2: {text}",
			modelName: "gpt-4o",
		});
		const t = getFeedbackTemplate("test-writing-score");
		expect(t.templateVersion).toBe("2.0.0");
		expect(t.rubricVersion).toBe("1.1.0");
	});
});

// ── wrapFeedbackCall (AC: 1, 2, 5) ─────────────────────────────────────────

describe("wrapFeedbackCall", () => {
	beforeEach(() => {
		registerFeedbackTemplate({
			templateId: "test-writing-wrap",
			moduleType: "writing",
			templateVersion: "1.0.0",
			rubricVersion: "1.0.0",
			promptTemplate: "Score: {text}",
			modelName: "gpt-4o-mini",
		});
	});

	it("captures metadata in FeedbackRun (AC: 1)", async () => {
		const { run, output } = await wrapFeedbackCall(
			"test-writing-wrap",
			"u1",
			{ text: "My essay about cats" },
			async (req) => {
				// Verify request has required fields
				expect(FeedbackRequestSchema.safeParse(req).success).toBe(true);
				return { output: { score: 7.5, feedback: "Good essay" } };
			},
		);

		expect(run.userId).toBe("u1");
		expect(run.templateId).toBe("test-writing-wrap");
		expect(run.templateVersion).toBe("1.0.0");
		expect(run.rubricVersion).toBe("1.0.0");
		expect(run.modelName).toBe("gpt-4o-mini");
		expect(run.promptHash).toMatch(/^[a-f0-9]{16}$/);
		expect(run.latencyMs).toBeGreaterThanOrEqual(0);
		expect(run.structuredOutput).toEqual({ score: 7.5, feedback: "Good essay" });
		expect(output.score).toBe(7.5);
	});

	it("validates run against FeedbackRunSchema (AC: 1)", async () => {
		const { run } = await wrapFeedbackCall(
			"test-writing-wrap",
			"u1",
			{ text: "Test" },
			async () => ({ output: { score: 8 } }),
		);
		const parsed = FeedbackRunSchema.safeParse(run);
		expect(parsed.success).toBe(true);
	});

	it("captures safety flags and cost estimate (AC: 1)", async () => {
		const { run } = await wrapFeedbackCall(
			"test-writing-wrap",
			"u1",
			{ text: "Test" },
			async () => ({
				output: { score: 5 },
				safetyFlags: ["content_warning"],
				costEstimate: 0.002,
			}),
		);
		expect(run.safetyFlags).toEqual(["content_warning"]);
		expect(run.costEstimate).toBe(0.002);
	});

	it("redacts sensitive input fields", async () => {
		const { run } = await wrapFeedbackCall(
			"test-writing-wrap",
			"u1",
			{ text: "Normal", password: "secret123", apikey: "sk-xxx" },
			async () => ({ output: { score: 6 } }),
		);
		expect(run.inputSnapshot.text).toBe("Normal");
		expect(run.inputSnapshot.password).toBe("[REDACTED]");
		expect(run.inputSnapshot.apikey).toBe("[REDACTED]");
	});

	it("truncates long input values", async () => {
		const longText = "x".repeat(3000);
		const { run } = await wrapFeedbackCall(
			"test-writing-wrap",
			"u1",
			{ text: longText },
			async () => ({ output: { score: 6 } }),
		);
		expect((run.inputSnapshot.text as string).length).toBeLessThan(3000);
		expect((run.inputSnapshot.text as string)).toContain("[truncated]");
	});
});

// ── Version Required (AC: 4) ───────────────────────────────────────────────

describe("version enforcement (AC: 4)", () => {
	it("throws if template is not registered before wrapping", async () => {
		await expect(
			wrapFeedbackCall(
				"unregistered-template",
				"u1",
				{ text: "test" },
				async () => ({ output: {} }),
			),
		).rejects.toThrow("not registered");
	});
});
