import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { onboardingBaseline } from "@repo/database";
import { eq } from "drizzle-orm";

/**
 * Server-component guard for /toeic/* routes that require a TOEIC baseline.
 * Redirects to /toeic/diagnostic if the user has not completed it yet.
 *
 * Do NOT call from /toeic/diagnostic itself — would cause a redirect loop.
 */
export async function requireToeicBaseline(): Promise<void> {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) redirect("/sign-in");

	const [baseline] = await db
		.select()
		.from(onboardingBaseline)
		.where(eq(onboardingBaseline.userId, session.user.id))
		.limit(1);

	const hasToeic =
		baseline?.baselineScores?.some((s) => s.skillId.startsWith("toeic.")) ?? false;
	if (!hasToeic) redirect("/toeic/diagnostic");
}
