import { describe, expect, it } from "vitest";
import {
	AppError,
	ValidationError,
	UnauthorizedError,
	ForbiddenError,
	NotFoundError,
	ConflictError,
	IntegrationError,
} from "../src/errors";

describe("AppError", () => {
	it("creates with code, message, and statusCode", () => {
		const e = new AppError({
			code: "TEST",
			message: "test error",
			statusCode: 500,
		});
		expect(e).toBeInstanceOf(Error);
		expect(e.code).toBe("TEST");
		expect(e.message).toBe("test error");
		expect(e.statusCode).toBe(500);
		expect(e.name).toBe("AppError");
	});

	it("serializes to JSON", () => {
		const e = new AppError({
			code: "TEST",
			message: "test error",
			statusCode: 500,
		});
		expect(e.toJSON()).toEqual({
			code: "TEST",
			message: "test error",
			statusCode: 500,
		});
	});

	it("deserializes from JSON", () => {
		const e = AppError.fromJSON({
			code: "NOT_FOUND",
			message: "User not found",
			statusCode: 404,
		});
		expect(e).toBeInstanceOf(AppError);
		expect(e.code).toBe("NOT_FOUND");
		expect(e.statusCode).toBe(404);
	});

	it("handles fromJSON with missing fields", () => {
		const e = AppError.fromJSON({});
		expect(e.code).toBe("UNKNOWN");
		expect(e.statusCode).toBe(500);
	});

	it("preserves cause", () => {
		const cause = new Error("original");
		const e = new AppError({
			code: "TEST",
			message: "wrapped",
			statusCode: 500,
			cause,
		});
		expect(e.cause).toBe(cause);
	});
});

describe("ValidationError", () => {
	it("has statusCode 400 and correct code", () => {
		const e = new ValidationError("Invalid email");
		expect(e.statusCode).toBe(400);
		expect(e.code).toBe("VALIDATION_ERROR");
		expect(e.name).toBe("ValidationError");
		expect(e.message).toBe("Invalid email");
		expect(e).toBeInstanceOf(AppError);
	});
});

describe("UnauthorizedError", () => {
	it("has statusCode 401 and default message", () => {
		const e = new UnauthorizedError();
		expect(e.statusCode).toBe(401);
		expect(e.code).toBe("UNAUTHORIZED");
		expect(e.name).toBe("UnauthorizedError");
		expect(e.message).toBe("Unauthorized");
	});

	it("accepts custom message", () => {
		const e = new UnauthorizedError("Session expired");
		expect(e.message).toBe("Session expired");
	});
});

describe("ForbiddenError", () => {
	it("has statusCode 403", () => {
		const e = new ForbiddenError();
		expect(e.statusCode).toBe(403);
		expect(e.code).toBe("FORBIDDEN");
		expect(e.name).toBe("ForbiddenError");
		expect(e.message).toBe("Forbidden");
	});
});

describe("NotFoundError", () => {
	it("has statusCode 404 with entity only", () => {
		const e = new NotFoundError("Article");
		expect(e.statusCode).toBe(404);
		expect(e.code).toBe("NOT_FOUND");
		expect(e.name).toBe("NotFoundError");
		expect(e.message).toBe("Article not found");
	});

	it("includes id in message when provided", () => {
		const e = new NotFoundError("User", "abc-123");
		expect(e.message).toBe("User not found: abc-123");
	});
});

describe("ConflictError", () => {
	it("has statusCode 409", () => {
		const e = new ConflictError("Already completed");
		expect(e.statusCode).toBe(409);
		expect(e.code).toBe("CONFLICT");
		expect(e.name).toBe("ConflictError");
		expect(e.message).toBe("Already completed");
	});
});

describe("IntegrationError", () => {
	it("has statusCode 502 with service name", () => {
		const e = new IntegrationError("OpenAI");
		expect(e.statusCode).toBe(502);
		expect(e.code).toBe("INTEGRATION_ERROR");
		expect(e.name).toBe("IntegrationError");
		expect(e.message).toBe("Integration failed: OpenAI");
	});

	it("preserves cause from external service", () => {
		const cause = new Error("timeout");
		const e = new IntegrationError("OpenAI", cause);
		expect(e.cause).toBe(cause);
	});
});

describe("Error hierarchy", () => {
	it("all domain errors extend AppError and Error", () => {
		const errors = [
			new ValidationError("test"),
			new UnauthorizedError(),
			new ForbiddenError(),
			new NotFoundError("test"),
			new ConflictError("test"),
			new IntegrationError("test"),
		];

		for (const e of errors) {
			expect(e).toBeInstanceOf(AppError);
			expect(e).toBeInstanceOf(Error);
			expect(e.toJSON()).toHaveProperty("code");
			expect(e.toJSON()).toHaveProperty("message");
			expect(e.toJSON()).toHaveProperty("statusCode");
		}
	});
});
