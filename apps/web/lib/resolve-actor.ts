import { auth } from "@/lib/auth";
import { createWebActorResolver } from "@repo/auth";

/**
 * Pre-configured web actor resolver for use in Next.js route handlers.
 *
 * Usage:
 * ```ts
 * import { resolveWebActor } from "@/lib/resolve-actor";
 *
 * export async function GET() {
 *   const actor = await resolveWebActor();
 *   const userId = actor.userId;
 *   // ...
 * }
 * ```
 */
export const resolveWebActor = createWebActorResolver(auth);
