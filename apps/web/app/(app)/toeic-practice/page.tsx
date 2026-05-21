import { redirect } from "next/navigation";

/**
 * Redirect stub: toeic-practice now lives inside the unified TOEIC Skills page
 * at /toeic/skills?tab=practice. This page exists for backward compatibility.
 */
export default function ToeicPracticeRedirect() {
	redirect("/toeic/skills?tab=practice");
}
