import { redirect } from "next/navigation";

/**
 * This route has been consolidated into the TOEIC Skills Hub.
 * Redirect to preserve any external/bookmarked links.
 */
export default function RedirectPage() {
  redirect("/toeic-skills");
}
