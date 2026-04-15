import { headers } from "next/headers";
import { UnauthorizedError } from "@repo/shared";
import type { ActorContext, AuthSessionResolver } from "../types";

/**
 * Creates a zero-arg resolveWebActor function bound to the given auth instance.
 *
 * Usage in apps/web:
 * ```ts
 * import { auth } from "@/lib/auth";
 * import { createWebActorResolver } from "@repo/auth";
 * export const resolveWebActor = createWebActorResolver(auth);
 * ```
 *
 * Then in route handlers:
 * ```ts
 * const actor = await resolveWebActor();
 * const userId = actor.userId;
 * ```
 */
export function createWebActorResolver(auth: AuthSessionResolver) {
	return async function resolveWebActor(): Promise<ActorContext> {
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
	};
}
