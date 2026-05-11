import { redirect } from "next/navigation";

/**
 * Dictionary page consolidated — FloatingDictionaryWidget covers lookup.
 * Redirect to vocabulary management page.
 */
export default function RedirectPage() {
  redirect("/my-vocabulary");
}
