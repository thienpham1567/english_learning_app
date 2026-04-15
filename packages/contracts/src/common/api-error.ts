import { z } from "zod/v4";

export const ApiErrorResponseSchema = z.object({
	code: z.string(),
	message: z.string(),
	statusCode: z.number().int().optional(),
});

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
