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

let poolInstance: Pool | null = null;

function getPoolInstance() {
	if (!poolInstance) {
		poolInstance = new Pool({ connectionString: getDatabaseUrl() });
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
