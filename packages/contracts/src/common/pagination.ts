import { z } from "zod/v4";

export const PaginationSchema = z.object({
	offset: z.number().int().min(0).default(0),
	limit: z.number().int().min(1).max(100).default(20),
});

export type Pagination = z.infer<typeof PaginationSchema>;
