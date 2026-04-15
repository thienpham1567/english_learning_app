/**
 * Re-export barrel — schema exports now live in @repo/database.
 * Only re-exports schema (tables, enums, types) — NOT the db client.
 * This avoids eagerly loading the DB connection when only schema types are needed.
 */
export * from "@repo/database/src/schema";
