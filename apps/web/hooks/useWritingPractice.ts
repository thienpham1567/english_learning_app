"use client";

import { useState, useCallback, useEffect } from "react";
import { api } from "@/lib/api-client";
import { clearWritingDraft } from "@/app/(app)/writing-practice/_components/WritingEditor";
import type {
  WritingCategory,
  WritingFeedback,
  WritingSubmission,
} from "@/lib/writing-practice/types";

type PracticeState =
  | "prompt-selection"
  | "generating-prompt"
  | "writing"
  | "reviewing"
  | "feedback"
  | "viewing-history";

export function useWritingPractice() {
  const [state, setState] = useState<PracticeState>("prompt-selection");
  const [category, setCategory] = useState<WritingCategory | null>(null);
  const [prompt, setPrompt] = useState("");
  const [hints, setHints] = useState<string[]>([]);
  const [writtenText, setWrittenText] = useState("");
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<WritingSubmission[]>([]);
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);

  // Fetch history on mount
  useEffect(() => {
    api
      .get<{ submissions: WritingSubmission[] }>("/writing-practice/history")
      .then((data) => setHistory(data.submissions))
      .catch(() => {});
  }, []);

  const generatePrompt = useCallback(async (cat: WritingCategory) => {
    setCategory(cat);
    setLoadingCategory(cat);
    setState("generating-prompt");
    setError(null);
    try {
      const data = await api.post<{ prompt: string; hints: string[] }>(
        "/writing-practice/prompt",
        { category: cat },
      );
      setPrompt(data.prompt);
      setHints(data.hints ?? []);
      setState("writing");
    } catch {
      setError("Không thể tạo đề bài. Vui lòng thử lại.");
      setState("prompt-selection");
    } finally {
      setLoadingCategory(null);
    }
  }, []);

  const submitWriting = useCallback(
    async (text: string) => {
      if (!category || !prompt) return;
      setWrittenText(text);
      setState("reviewing");
      setError(null);
      try {
        const data = await api.post<{ feedback: WritingFeedback }>(
          "/writing-practice/review",
          { prompt, category, text },
        );
        setFeedback(data.feedback);
        setState("feedback");
        // Refresh history
        api
          .get<{ submissions: WritingSubmission[] }>("/writing-practice/history")
          .then((h) => setHistory(h.submissions))
          .catch(() => {});
      } catch {
        setError("Không thể chấm bài. Vui lòng thử lại.");
        setState("writing");
      }
    },
    [category, prompt],
  );

  const viewSubmission = useCallback((submission: WritingSubmission) => {
    setCategory(submission.category as WritingCategory);
    setPrompt(submission.prompt);
    setWrittenText(submission.text);
    setFeedback(submission.feedback);
    setState("feedback");
  }, []);

  const startNew = useCallback(() => {
    setCategory(null);
    setPrompt("");
    setHints([]);
    setWrittenText("");
    setFeedback(null);
    setError(null);
    clearWritingDraft();
    setState("prompt-selection");
  }, []);

  return {
    state,
    category,
    prompt,
    hints,
    writtenText,
    feedback,
    error,
    history,
    loadingCategory,
    generatePrompt,
    submitWriting,
    viewSubmission,
    startNew,
  };
}
