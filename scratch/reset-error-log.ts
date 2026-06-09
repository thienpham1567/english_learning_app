/**
 * Reset all data in the error_log table (Error Notebook).
 * Run from apps/web: npx tsx ../../scratch/reset-error-log.ts
 */
import { db } from "@repo/database";
import { errorLog } from "@repo/database";
import { sql } from "drizzle-orm";

async function main() {
  // Count before
  const countResult = await db.select({ count: sql<number>`count(*)::int` }).from(errorLog);
  const count = countResult[0]?.count ?? 0;
  console.log(`📊 Current error_log rows: ${count}`);

  if (count === 0) {
    console.log("✅ error_log is already empty. Nothing to do.");
    process.exit(0);
  }

  // Delete all
  await db.delete(errorLog);
  
  // Verify
  const afterResult = await db.select({ count: sql<number>`count(*)::int` }).from(errorLog);
  const afterCount = afterResult[0]?.count ?? 0;
  console.log(`🗑️  Deleted ${count} rows from error_log.`);
  console.log(`✅ error_log rows after reset: ${afterCount}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
