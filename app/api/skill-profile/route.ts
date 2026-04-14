import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { getSkillProfile, levelToCefr, type SkillModule } from "@/lib/adaptive/difficulty";

const QuerySchema = z.object({
  module: z.enum(["grammar", "listening", "reading", "writing", "speaking"]),
});

/**
 * GET /api/skill-profile?module=listening
 *
 * Returns the user's skill profile for a specific module.
 */
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({ module: url.searchParams.get("module") });
  if (!parsed.success) {
    return Response.json({ error: "Invalid module", details: parsed.error.flatten() }, { status: 400 });
  }

  const profile = await getSkillProfile(session.user.id, parsed.data.module as SkillModule);

  return Response.json({
    module: parsed.data.module,
    currentLevel: profile.currentLevel,
    accuracyLast10: profile.accuracyLast10,
    cefr: levelToCefr(profile.currentLevel),
  });
}
