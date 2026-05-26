import { db, onboardingBaseline } from "@repo/database";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Server-component guard for /toeic/* routes that require a TOEIC baseline.
 * Redirects to /toeic/diagnostic if the user has not completed it yet.
 *
 * Do NOT call from /toeic/diagnostic itself — would cause a redirect loop.
 */
export async function requireToeicBaseline(): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/sign-in");

  try {
    const [baseline] = await db
      .select()
      .from(onboardingBaseline)
      .where(eq(onboardingBaseline.userId, session.user.id))
      .limit(1);

    const hasToeic = baseline?.baselineScores?.some((s) => s.skillId.startsWith("toeic.")) ?? false;
    if (!hasToeic) redirect("/toeic/diagnostic");
  } catch (err: unknown) {
    // Re-throw Next.js redirect errors (they use throw internally)
    if (err && typeof err === "object" && "digest" in err) throw err;
    // Swallow transient DB errors — let the page render
    console.error("[requireToeicBaseline] DB error, skipping guard:", err);
  }
}
