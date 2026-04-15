import { describe, expect, it } from "vitest";
import { PaginationSchema, ApiErrorResponseSchema } from "../src/common";

describe("PaginationSchema", () => {
	it("parses valid pagination", () => {
		const result = PaginationSchema.safeParse({ offset: 10, limit: 50 });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.offset).toBe(10);
			expect(result.data.limit).toBe(50);
		}
	});

	it("applies defaults", () => {
		const result = PaginationSchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.offset).toBe(0);
			expect(result.data.limit).toBe(20);
		}
	});

	it("rejects negative offset", () => {
		const result = PaginationSchema.safeParse({ offset: -1 });
		expect(result.success).toBe(false);
	});

	it("rejects limit over 100", () => {
		const result = PaginationSchema.safeParse({ limit: 101 });
		expect(result.success).toBe(false);
	});
});

describe("ApiErrorResponseSchema", () => {
	it("parses valid error response", () => {
		const result = ApiErrorResponseSchema.safeParse({
			code: "NOT_FOUND",
			message: "User not found",
			statusCode: 404,
		});
		expect(result.success).toBe(true);
	});

	it("parses without optional statusCode", () => {
		const result = ApiErrorResponseSchema.safeParse({
			code: "UNKNOWN",
			message: "Something went wrong",
		});
		expect(result.success).toBe(true);
	});

	it("rejects missing code", () => {
		const result = ApiErrorResponseSchema.safeParse({ message: "test" });
		expect(result.success).toBe(false);
	});
});
