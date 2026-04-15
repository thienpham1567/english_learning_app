import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { awardXP } from "@/lib/xp";

const AwardSchema = z.object({
  activity: z.enum(["quiz_complete"]),
});

/**
 * POST /api/xp
 * Awards XP for client-side-only activities (e.g. grammar quiz completion).
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = AwardSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }

  const XP_MAP = { quiz_complete: 50 } as const;
  const amount = XP_MAP[parsed.data.activity];
  const xpTotal = await awardXP(session.user.id, amount);

  return Response.json({ xpTotal });
}
