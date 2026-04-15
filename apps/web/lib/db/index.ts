/**
 * Re-export barrel — db client now lives in @repo/database.
 * This file exists for backward compatibility with existing tests.
 */
export { db, pool } from "@repo/database";
