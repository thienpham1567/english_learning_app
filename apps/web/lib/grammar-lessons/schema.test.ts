import { describe, expect, it } from "vitest";

import {
  GrammarLessonSchema,
  buildGrammarLessonSummary,
  getRecommendedGrammarTopic,
  isGrammarAnswerCorrect,
  type GrammarLessonProgressItem,
} from "./schema";
import { GRAMMAR_TOPIC_CATEGORIES } from "./topics";

const validLesson = {
  title: "Present Perfect",
  titleVi: "Thì hiện tại hoàn thành",
  formula: "S + have/has + V3/ed",
  explanation: "Dùng để nói về trải nghiệm hoặc hành động có liên quan đến hiện tại.",
  examples: [
    { en: "I have finished the report.", vi: "Tôi đã hoàn thành báo cáo.", highlight: "have finished" },
    { en: "She has visited London.", vi: "Cô ấy đã từng đến London.", highlight: "has visited" },
    { en: "They have worked here for years.", vi: "Họ đã làm ở đây nhiều năm.", highlight: "have worked" },
  ],
  commonMistakes: [
    {
      wrong: "I have saw the email.",
      correct: "I have seen the email.",
      note: "Sau have/has phải dùng quá khứ phân từ.",
    },
    {
      wrong: "She has went home.",
      correct: "She has gone home.",
      note: "Go có dạng V3 là gone.",
    },
  ],
  exercises: [
    {
      id: "1",
      type: "multiple_choice",
      sentence: "She ___ already submitted the form.",
      answer: "has",
      options: ["have", "has", "had", "having"],
      explanation: "Chủ ngữ she đi với has.",
    },
    {
      id: "2",
      type: "error_correction",
      sentence: "I have ate lunch.",
      answer: "I have eaten lunch.",
      explanation: "Eat có dạng V3 là eaten.",
    },
    {
      id: "3",
      type: "transformation",
      sentence: "I started working here in 2020.",
      answer: "I have worked here since 2020.",
      explanation: "Dùng present perfect với since.",
    },
  ],
};

describe("GrammarLessonSchema", () => {
  it("accepts multiple-choice, correction, and transformation exercises", () => {
    const result = GrammarLessonSchema.safeParse(validLesson);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.exercises.map((exercise) => exercise.type)).toEqual([
        "multiple_choice",
        "error_correction",
        "transformation",
      ]);
    }
  });

  it("requires exactly four options for multiple-choice exercises", () => {
    const lesson = structuredClone(validLesson);
    lesson.exercises[0]!.options = ["have", "has", "had"];

    const result = GrammarLessonSchema.safeParse(lesson);

    expect(result.success).toBe(false);
  });
});

describe("grammar lesson helpers", () => {
  it("normalizes punctuation and casing when checking free-form answers", () => {
    expect(isGrammarAnswerCorrect(" I have eaten lunch ", "I have eaten lunch.")).toBe(true);
  });

  it("summarizes progress and recommends the first incomplete topic at the learner level", () => {
    const progress: GrammarLessonProgressItem[] = [
      { topicId: "present-simple", status: "completed", correctCount: 3, totalCount: 3, scorePct: 100 },
      { topicId: "present-continuous", status: "completed", correctCount: 2, totalCount: 3, scorePct: 67 },
    ];

    const summary = buildGrammarLessonSummary(GRAMMAR_TOPIC_CATEGORIES, progress);
    const recommended = getRecommendedGrammarTopic(GRAMMAR_TOPIC_CATEGORIES, progress, "A2");

    expect(summary.completedTopicIds).toEqual(["present-simple", "present-continuous"]);
    expect(summary.totalCompleted).toBe(2);
    expect(recommended?.id).toBe("past-simple");
  });
});
