import { db } from "../client";
import { aiFeedbackRun } from "../schema";

/**
 * Create an AI feedback run record.
 */
export async function createFeedbackRun(
  data: {
    userId: string;
    templateId: string;
    templateVersion: string;
    rubricVersion: string;
    modelName: string;
    promptHash: string;
    inputSnapshot: Record<string, unknown>;
    structuredOutput: Record<string, unknown>;
    latencyMs: number;
    costEstimate: number | null;
    safetyFlags: string[];
  },
): Promise<string> {
  const [row] = await db
    .insert(aiFeedbackRun)
    .values({
      ...data,
      createdAt: new Date(),
    })
    .returning({ id: aiFeedbackRun.id });
  return row!.id;
}
