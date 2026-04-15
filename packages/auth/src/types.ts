/**
 * Framework-agnostic identity types for business modules.
 * Modules depend on ActorContext instead of auth framework details.
 */

/**
 * Represents the authenticated actor making a request.
 * Business modules receive this instead of raw session objects.
 */
export type ActorContext = {
	userId: string;
	roles: string[];
	clientType: "web" | "mobile" | "internal";
};

/**
 * Minimal interface for session resolution.
 * Decouples packages/auth from better-auth — any auth provider
 * that satisfies this shape can be used.
 */
export interface AuthSessionResolver {
	api: {
		getSession: (opts: {
			headers: Headers;
		}) => Promise<{ user: { id: string } } | null>;
	};
}
