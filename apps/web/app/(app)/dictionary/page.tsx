import { redirect } from "next/navigation";

/**
 * Dictionary page — FloatingDictionaryWidget covers lookup.
 * Redirect to TOEIC practice.
 */
export default function RedirectPage() {
  redirect("/toeic/practice");
}
