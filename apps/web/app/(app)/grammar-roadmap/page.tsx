import { redirect } from "next/navigation";

/**
 * Redirect stub: the grammar roadmap has been merged into the unified
 * grammar lessons page, which now organizes topics by priority tier.
 * Kept for backward-compatible links/bookmarks.
 */
export default function GrammarRoadmapRedirect() {
  redirect("/grammar-lessons");
}
