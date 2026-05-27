import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In – TOEIC Master",
  description:
    "Sign in with Google to start mastering TOEIC with AI-powered tutoring, smart flashcards, real-time pronunciation grading, and daily challenges.",
};

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
