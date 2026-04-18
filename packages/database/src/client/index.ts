import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "../schema";

function getDatabaseUrl() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error("Missing DATABASE_URL");
	}

	return databaseUrl;
}

/**
 * Per-instance pg pool size. Each Vercel serverless instance spins up its own
 * pool, so we keep `max` tight in production to stay within the Postgres
 * connection ceiling (Neon free tier ≈ 20, Supabase free ≈ 60). Override via
 * DATABASE_POOL_MAX if you are behind pgbouncer / have a higher tier.
 */
function getPoolMax(): number {
	const explicit = Number.parseInt(process.env.DATABASE_POOL_MAX ?? "", 10);
	if (Number.isFinite(explicit) && explicit > 0) return explicit;
	return process.env.NODE_ENV === "production" ? 5 : 10;
}

let poolInstance: Pool | null = null;

function getPoolInstance() {
	if (!poolInstance) {
		poolInstance = new Pool({
			connectionString: getDatabaseUrl(),
			max: getPoolMax(),
			idleTimeoutMillis: 30_000,
		});
	}

	return poolInstance;
}

function createDb() {
	return drizzle(getPoolInstance(), { schema });
}

type DbInstance = ReturnType<typeof createDb>;

let dbInstance: DbInstance | null = null;

function getDbInstance() {
	if (!dbInstance) {
		dbInstance = createDb();
	}

	return dbInstance;
}

/** Returns the real Pool instance (not proxied) — needed by libraries
 *  like BetterAuth that rely on `instanceof Pool` checks. */
export { getPoolInstance as getRawPool };

export const pool = new Proxy({} as Pool, {
	get(_target, prop) {
		const instance = getPoolInstance();
		const value = instance[prop as keyof Pool];
		return typeof value === "function" ? value.bind(instance) : value;
	},
});

export const db = new Proxy({} as DbInstance, {
	get(_target, prop) {
		const instance = getDbInstance();
		const value = instance[prop as keyof DbInstance];
		return typeof value === "function" ? value.bind(instance) : value;
	},
});
