import { describe, expect, it } from "vitest";
import {
	computeNextVersion,
	createFeedbackRunRecord,
	getLatestRun,
	getSuccessfulRuns,
	computeRunMetrics,
} from "../../src/learning/feedback-run-persistence";
import type { FeedbackRunRecord } from "../../src/learning/feedback-run-persistence";

function makeRun(overrides?: Partial<FeedbackRunRecord>): FeedbackRunRecord {
	return {
		id: "fbr-1",
		userId: "u-1",
		moduleType: "grammar-quiz",
		sessionId: "s-1",
		version: 1,
		input: {},
		output: {},
		modelId: "gpt-4o",
		promptVersion: "v1.0",
		latencyMs: 500,
		success: true,
		createdAt: "2026-04-24T12:00:00Z",
		...overrides,
	};
}

describe("computeNextVersion", () => {
	it("returns 1 for empty runs", () => {
		expect(computeNextVersion([])).toBe(1);
	});
	it("increments from max version", () => {
		expect(computeNextVersion([makeRun({ version: 3 })])).toBe(4);
	});
});

describe("createFeedbackRunRecord", () => {
	it("creates a record with auto-incremented version", () => {
		const record = createFeedbackRunRecord({
			userId: "u-1", moduleType: "grammar-quiz", sessionId: "s-1",
			input: {}, output: {}, modelId: "gpt-4o", promptVersion: "v1",
			latencyMs: 300, success: true, existingRuns: [makeRun({ version: 2 })],
		});
		expect(record.version).toBe(3);
		expect(record.id).toContain("v3");
	});
});

describe("getLatestRun", () => {
	it("returns null for empty", () => {
		expect(getLatestRun([])).toBeNull();
	});
	it("returns highest version", () => {
		const latest = getLatestRun([makeRun({ version: 1 }), makeRun({ version: 3 }), makeRun({ version: 2 })]);
		expect(latest!.version).toBe(3);
	});
});

describe("getSuccessfulRuns", () => {
	it("filters to successful runs", () => {
		const runs = [makeRun({ success: true }), makeRun({ success: false }), makeRun({ success: true })];
		expect(getSuccessfulRuns(runs)).toHaveLength(2);
	});
});

describe("computeRunMetrics", () => {
	it("returns zero metrics for empty", () => {
		const m = computeRunMetrics([]);
		expect(m.totalRuns).toBe(0);
		expect(m.successRate).toBe(0);
	});
	it("computes correct metrics", () => {
		const runs = [
			makeRun({ version: 1, latencyMs: 200, success: true }),
			makeRun({ version: 2, latencyMs: 400, success: false }),
		];
		const m = computeRunMetrics(runs);
		expect(m.totalRuns).toBe(2);
		expect(m.successRate).toBe(0.5);
		expect(m.avgLatencyMs).toBe(300);
		expect(m.latestVersion).toBe(2);
	});
});
