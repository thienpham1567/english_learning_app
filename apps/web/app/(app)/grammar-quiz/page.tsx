import { redirect } from "next/navigation";

/**
 * Redirect stub: grammar-quiz now lives inside the unified TOEIC Skills page
 * at /toeic/skills?tab=part5. This page exists for backward compatibility.
 */
export default function GrammarQuizRedirect() {
  redirect("/toeic/skills?tab=part5");
}
