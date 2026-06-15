import { redirect } from "next/navigation";

/**
 * Redirect stub: grammar-quiz now lives at /toeic/grammar.
 * This page exists for backward compatibility.
 */
export default function GrammarQuizRedirect() {
  redirect("/toeic/grammar");
}
