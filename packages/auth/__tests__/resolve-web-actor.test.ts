import { describe, it, expect, vi, beforeEach } from "vitest";
import { UnauthorizedError } from "@repo/shared";
import type { AuthSessionResolver } from "../src/types";
import { createWebActorResolver } from "../src/web/resolve-web-actor";

// Mock next/headers — return a plain Headers object
vi.mock("next/headers", () => ({
	headers: vi.fn(() => Promise.resolve(new Headers())),
}));

describe("createWebActorResolver", () => {
	let mockAuth: AuthSessionResolver;

	beforeEach(() => {
		mockAuth = {
			api: {
				getSession: vi.fn(),
			},
		};
	});

	it("returns ActorContext with correct userId on valid session", async () => {
		vi.mocked(mockAuth.api.getSession).mockResolvedValueOnce({
			user: { id: "user-123" },
		});

		const resolveWebActor = createWebActorResolver(mockAuth);
		const actor = await resolveWebActor();

		expect(actor).toEqual({
			userId: "user-123",
			roles: [],
			clientType: "web",
		});
	});

	it("throws UnauthorizedError when session is null", async () => {
		vi.mocked(mockAuth.api.getSession).mockResolvedValueOnce(null);

		const resolveWebActor = createWebActorResolver(mockAuth);

		await expect(resolveWebActor()).rejects.toThrow(UnauthorizedError);
		await expect(
			createWebActorResolver(mockAuth)(),
		).rejects.toThrow("Session required");
	});

	it("sets clientType to 'web' and roles to empty array", async () => {
		vi.mocked(mockAuth.api.getSession).mockResolvedValueOnce({
			user: { id: "user-456" },
		});

		const resolveWebActor = createWebActorResolver(mockAuth);
		const actor = await resolveWebActor();

		expect(actor.clientType).toBe("web");
		expect(actor.roles).toEqual([]);
	});

	it("passes headers from next/headers to auth.api.getSession", async () => {
		vi.mocked(mockAuth.api.getSession).mockResolvedValueOnce({
			user: { id: "user-789" },
		});

		const resolveWebActor = createWebActorResolver(mockAuth);
		await resolveWebActor();

		expect(mockAuth.api.getSession).toHaveBeenCalledWith({
			headers: expect.any(Headers),
		});
	});
});
