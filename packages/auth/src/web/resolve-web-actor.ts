import { cache } from "react";
import { headers } from "next/headers";
import { UnauthorizedError } from "@repo/shared";
import type { ActorContext, AuthSessionResolver } from "../types";

/**
 * Creates a zero-arg resolveWebActor function bound to the given auth instance.
 *
 * The resolver is wrapped in React's `cache()`, which deduplicates calls
 * within a single server request. Multiple handlers or helpers invoking
 * `resolveWebActor()` in the same request will share one session lookup.
 *
 * Usage in apps/web:
 * ```ts
 * import { auth } from "@/lib/auth";
 * import { createWebActorResolver } from "@repo/auth";
 * export const resolveWebActor = createWebActorResolver(auth);
 * ```
 */
export function createWebActorResolver(auth: AuthSessionResolver) {
	return cache(async function resolveWebActor(): Promise<ActorContext> {
		const session = await auth.api.getSession({
			headers: await headers(),
		});
		if (!session) {
			throw new UnauthorizedError("Session required");
		}
		return {
			userId: session.user.id,
			roles: [],
			clientType: "web",
		};
	});
}
