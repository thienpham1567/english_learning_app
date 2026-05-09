import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { toeicDictationItem } from "@repo/database";
import { asc } from "drizzle-orm";

export async function GET() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const items = await db
		.select({
			id: toeicDictationItem.id,
			level: toeicDictationItem.level,
			topic: toeicDictationItem.topic,
			// Hide text + vocab hints from listing — only revealed after submit
		})
		.from(toeicDictationItem)
		.orderBy(asc(toeicDictationItem.level), asc(toeicDictationItem.topic));

	return Response.json({ items });
}
