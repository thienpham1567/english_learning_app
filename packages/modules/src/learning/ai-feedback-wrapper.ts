import { createHash } from "node:crypto";
import type { FeedbackRequest, FeedbackRun, FeedbackModuleTypeValue } from "@repo/contracts";

// ── Prompt Hash (AC: 4) ─────────────────────────────────────────────────────

/**
 * Generate a SHA-256 hash of the prompt text.
 * Enables change detection — any prompt modification changes the hash.
 */
export function hashPrompt(promptText: string): string {
	return createHash("sha256").update(promptText).digest("hex").slice(0, 16);
}

// ── Template Registry (AC: 4) ───────────────────────────────────────────────

export interface FeedbackTemplateEntry {
	templateId: string;
	moduleType: FeedbackModuleTypeValue;
	templateVersion: string;
	rubricVersion: string;
	promptTemplate: string;
	modelName: string;
}

const TEMPLATE_REGISTRY: Map<string, FeedbackTemplateEntry> = new Map();

/**
 * Register a feedback template. Must be called at module load time.
 * Version bumps require updating the entry explicitly (AC: 4).
 */
export function registerFeedbackTemplate(entry: FeedbackTemplateEntry): void {
	TEMPLATE_REGISTRY.set(entry.templateId, entry);
}

/**
 * Get a registered template by ID. Throws if not registered.
 */
export function getFeedbackTemplate(templateId: string): FeedbackTemplateEntry {
	const entry = TEMPLATE_REGISTRY.get(templateId);
	if (!entry) {
		throw new Error(`Feedback template "${templateId}" not registered. Did you forget to register it?`);
	}
	return entry;
}

// ── Input Redaction (dev note: no raw secrets/PII) ──────────────────────────

const REDACT_KEYS = new Set(["password", "token", "secret", "apikey", "authorization"]);

function redactInput(input: Record<string, unknown>): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(input)) {
		if (REDACT_KEYS.has(key.toLowerCase())) {
			result[key] = "[REDACTED]";
		} else if (typeof value === "string" && value.length > 2000) {
			result[key] = value.slice(0, 2000) + "...[truncated]";
		} else {
			result[key] = value;
		}
	}
	return result;
}

// ── Feedback Wrapper (AC: 1, 2, 4) ─────────────────────────────────────────

/**
 * Wrap an AI feedback call with versioned metadata.
 *
 * - Enforces explicit template/rubric version (AC: 4)
 * - Captures latency, cost, safety flags (AC: 1)
 * - Redacts sensitive input fields
 * - Returns a FeedbackRun record ready for persistence
 *
 * @param templateId  Registered template ID
 * @param inputData   Module-specific input (user text, prompt, etc.)
 * @param aiFn        The actual AI call function
 */
export async function wrapFeedbackCall<T extends Record<string, unknown>>(
	templateId: string,
	userId: string,
	inputData: Record<string, unknown>,
	aiFn: (request: FeedbackRequest) => Promise<{ output: T; safetyFlags?: string[]; costEstimate?: number }>,
): Promise<{ run: FeedbackRun; output: T }> {
	const template = getFeedbackTemplate(templateId);
	const promptHash = hashPrompt(template.promptTemplate);

	const request: FeedbackRequest = {
		templateId: template.templateId,
		templateVersion: template.templateVersion,
		rubricVersion: template.rubricVersion,
		moduleType: template.moduleType,
		modelName: template.modelName,
		promptHash,
		inputData,
	};

	const startMs = Date.now();
	const result = await aiFn(request);
	const latencyMs = Date.now() - startMs;

	const run: FeedbackRun = {
		id: crypto.randomUUID(),
		userId,
		templateId: template.templateId,
		templateVersion: template.templateVersion,
		rubricVersion: template.rubricVersion,
		modelName: template.modelName,
		promptHash,
		inputSnapshot: redactInput(inputData),
		structuredOutput: result.output as Record<string, unknown>,
		latencyMs,
		costEstimate: result.costEstimate ?? null,
		safetyFlags: result.safetyFlags ?? [],
		createdAt: new Date().toISOString(),
	};

	return { run, output: result.output };
}
