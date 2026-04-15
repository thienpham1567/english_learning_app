export interface AppErrorOptions {
	code: string;
	message: string;
	statusCode: number;
	cause?: unknown;
}

export class AppError extends Error {
	readonly code: string;
	readonly statusCode: number;

	constructor(options: AppErrorOptions) {
		super(options.message);
		this.name = "AppError";
		this.code = options.code;
		this.statusCode = options.statusCode;
		if (options.cause) this.cause = options.cause;
	}

	toJSON() {
		return {
			code: this.code,
			message: this.message,
			statusCode: this.statusCode,
		};
	}

	static fromJSON(json: {
		code?: string;
		message?: string;
		statusCode?: number;
	}): AppError {
		return new AppError({
			code: json.code ?? "UNKNOWN",
			message: json.message ?? "An unknown error occurred",
			statusCode: json.statusCode ?? 500,
		});
	}
}
