export type GrammarQuestion = {
  stem: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanationEn: string;
  explanationVi: string;
  examples: [string, string];
  grammarTopic: string;
};

export type QuizSession = {
  level: string;
  questions: GrammarQuestion[];
  answers: (number | null)[];
  currentIndex: number;
};

export type QuizState = "idle" | "loading" | "active" | "reviewing" | "summary";
