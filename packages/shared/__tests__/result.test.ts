import { describe, expect, it } from "vitest";
import { ok, err, type Result } from "../src/result";
import { NotFoundError } from "../src/errors";

describe("ok()", () => {
	it("creates a success result", () => {
		const result = ok(42);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value).toBe(42);
		}
	});

	it("works with complex types", () => {
		const result = ok({ id: "1", name: "test" });
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value).toEqual({ id: "1", name: "test" });
		}
	});
});

describe("err()", () => {
	it("creates a failure result", () => {
		const error = new NotFoundError("User");
		const result = err(error);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error).toBe(error);
			expect(result.error.statusCode).toBe(404);
		}
	});
});

describe("Result type narrowing", () => {
	it("narrows correctly in if/else", () => {
		function findUser(id: string): Result<{ name: string }> {
			if (id === "1") return ok({ name: "Alice" });
			return err(new NotFoundError("User", id));
		}

		const success = findUser("1");
		if (success.ok) {
			expect(success.value.name).toBe("Alice");
		} else {
			throw new Error("Should be ok");
		}

		const failure = findUser("999");
		if (!failure.ok) {
			expect(failure.error.code).toBe("NOT_FOUND");
			expect(failure.error.message).toBe("User not found: 999");
		} else {
			throw new Error("Should be err");
		}
	});
});
