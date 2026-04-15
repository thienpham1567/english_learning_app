/**
 * Seed script to create the admin user for local development.
 * Login with: admin / 12345678
 * Run: set -a && source .env.local && set +a && npx tsx scripts/seed-admin.ts
 */
import { auth } from "../lib/auth";

async function seed() {
  const email = "admin@local.app";
  const password = "12345678";
  const name = "Admin";

  try {
    await auth.api.signUpEmail({
      body: { email, password, name },
    });
    console.log(`✅ Admin user created — login: admin / ${password}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("already exists") || message.includes("UNIQUE")) {
      console.log(`ℹ️  Admin user already exists — login: admin / ${password}`);
    } else {
      console.error("❌ Failed to create admin user:", message);
      process.exit(1);
    }
  }

  process.exit(0);
}

seed();
