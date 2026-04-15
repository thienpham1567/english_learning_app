import { AppError } from "./app-error";

export class ValidationError extends AppError {
	constructor(message: string, cause?: unknown) {
		super({ code: "VALIDATION_ERROR", message, statusCode: 400, cause });
		this.name = "ValidationError";
	}
}

export class UnauthorizedError extends AppError {
	constructor(message = "Unauthorized") {
		super({ code: "UNAUTHORIZED", message, statusCode: 401 });
		this.name = "UnauthorizedError";
	}
}

export class ForbiddenError extends AppError {
	constructor(message = "Forbidden") {
		super({ code: "FORBIDDEN", message, statusCode: 403 });
		this.name = "ForbiddenError";
	}
}

export class NotFoundError extends AppError {
	constructor(entity: string, id?: string) {
		super({
			code: "NOT_FOUND",
			message: id ? `${entity} not found: ${id}` : `${entity} not found`,
			statusCode: 404,
		});
		this.name = "NotFoundError";
	}
}

export class ConflictError extends AppError {
	constructor(message: string) {
		super({ code: "CONFLICT", message, statusCode: 409 });
		this.name = "ConflictError";
	}
}

export class IntegrationError extends AppError {
	constructor(service: string, cause?: unknown) {
		super({
			code: "INTEGRATION_ERROR",
			message: `Integration failed: ${service}`,
			statusCode: 502,
			cause,
		});
		this.name = "IntegrationError";
	}
}
