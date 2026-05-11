import { redirect } from "next/navigation";

/**
 * Redirect stub: sidebar links to /toeic-practice but the actual
 * practice engine lives at /toeic/practice (with PracticeRunner + baseline guard).
 */
export default function ToeicPracticeRedirect() {
	redirect("/toeic/practice");
}
