/**
 * TOEIC 6-Month Curriculum Data
 * 24 weeks, 3 phases, parallel daily mix
 * Target: 800-900 L&R + 350 S&W
 */

export type Skill =
  | "grammar"
  | "listening"
  | "reading"
  | "speaking"
  | "writing"
  | "vocabulary"
  | "review";

export type ExerciseType = "learn" | "practice" | "quiz" | "drill" | "test";

export type LinkedExercise = {
  targetModule: string;
  routePath: string;
  label: string;
  type: ExerciseType;
};

export type Unit = {
  id: string;
  skill: Skill;
  title: string;
  description: string;
  exercises: LinkedExercise[];
  estimatedMinutes: number;
};

export type DayPlan = {
  day: "mon" | "tue" | "wed" | "thu" | "fri" | "sat";
  label: string;
  units: Unit[];
};

export type Week = {
  weekNumber: number;
  focusTopic: string;
  focusSkill: Skill;
  dailyPlan: DayPlan[];
};

export type Phase = {
  id: string;
  title: string;
  subtitle: string;
  monthRange: string;
  color: string;
  accentColor: string;
  weeks: Week[];
  checkpoint: {
    type: "mock-mini" | "mock-full";
    label: string;
    description: string;
    routePath: string;
  };
};

export type Curriculum = {
  id: string;
  title: string;
  targetScore: { lr: string; sw: string };
  duration: string;
  phases: Phase[];
};

// ─── Helper to create unit IDs ───
const uid = (week: number, day: string, idx: number) => `w${week}-${day}-${idx}`;

// ─── PHASE 1: Foundation (Month 1-2) ───
const phase1Weeks: Week[] = [
  {
    weekNumber: 1,
    focusTopic: "Tenses — Simple Present & Past",
    focusSkill: "grammar",
    dailyPlan: [
      {
        day: "mon",
        label: "Grammar Theory",
        units: [
          {
            id: uid(1, "mon", 0),
            skill: "grammar",
            title: "Simple Present & Simple Past",
            description: "Learn core tense rules: form, usage, signal words, common errors",
            exercises: [
              {
                targetModule: "grammar-lessons",
                routePath: "/grammar-lessons?topic=simple-present-vs-past",
                label: "Theory Lesson",
                type: "learn",
              },
            ],
            estimatedMinutes: 30,
          },
        ],
      },
      {
        day: "tue",
        label: "Grammar Practice",
        units: [
          {
            id: uid(1, "tue", 0),
            skill: "grammar",
            title: "Tenses Practice — Part 5 Drill",
            description: "Practice tense recognition with TOEIC Part 5 style questions",
            exercises: [
              {
                targetModule: "toeic-practice",
                routePath: "/toeic/grammar",
                label: "Part 5 Drill",
                type: "drill",
              },
            ],
            estimatedMinutes: 25,
          },
        ],
      },
      {
        day: "wed",
        label: "Vocabulary",
        units: [
          {
            id: uid(1, "wed", 0),
            skill: "vocabulary",
            title: "TOEIC Vocab — Office (20 words)",
            description: "Learn 20 high-frequency office vocabulary words",
            exercises: [
              {
                targetModule: "toeic-vocab",
                routePath: "/toeic/vocab",
                label: "Office Pack",
                type: "learn",
              },
              {
                targetModule: "toeic-vocab",
                routePath: "/toeic/vocab",
                label: "Vocab Quiz",
                type: "quiz",
              },
            ],
            estimatedMinutes: 25,
          },
        ],
      },
      {
        day: "thu",
        label: "Listening Basics",
        units: [
          {
            id: uid(1, "thu", 0),
            skill: "listening",
            title: "Listening Part 1 — Photographs",
            description: "Learn Part 1 strategy: identify key objects, actions, locations",
            exercises: [
              {
                targetModule: "toeic-practice",
                routePath: "/toeic/grammar",
                label: "Part 1 Practice",
                type: "practice",
              },
            ],
            estimatedMinutes: 25,
          },
        ],
      },
      {
        day: "fri",
        label: "Mixed Practice",
        units: [
          {
            id: uid(1, "fri", 0),
            skill: "grammar",
            title: "Grammar Review + Listening",
            description: "Review tenses + Part 1 listening exercises",
            exercises: [
              {
                targetModule: "toeic-vocab",
                routePath: "/toeic/vocab",
                label: "Vocabulary Review",
                type: "practice",
              },
              {
                targetModule: "toeic-practice",
                routePath: "/toeic/grammar",
                label: "Listening Drill",
                type: "drill",
              },
            ],
            estimatedMinutes: 30,
          },
        ],
      },
      {
        day: "sat",
        label: "Review Day",
        units: [
          {
            id: uid(1, "sat", 0),
            skill: "review",
            title: "Weekly Review",
            description: "Daily challenge + error review",
            exercises: [
              {
                targetModule: "error-notebook",
                routePath: "/error-notebook",
                label: "Daily Challenge",
                type: "practice",
              },
              {
                targetModule: "error-notebook",
                routePath: "/error-notebook",
                label: "Error Review",
                type: "practice",
              },
            ],
            estimatedMinutes: 30,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 2,
    focusTopic: "Tenses — Present/Past Perfect & Continuous",
    focusSkill: "grammar",
    dailyPlan: [
      {
        day: "mon",
        label: "Grammar Theory",
        units: [
          {
            id: uid(2, "mon", 0),
            skill: "grammar",
            title: "Perfect & Continuous Tenses",
            description: "Present Perfect vs Past Simple, Past Perfect, Present Continuous",
            exercises: [
              {
                targetModule: "grammar-lessons",
                routePath: "/grammar-lessons?topic=perfect-tenses",
                label: "Theory Lesson",
                type: "learn",
              },
            ],
            estimatedMinutes: 35,
          },
        ],
      },
      {
        day: "tue",
        label: "Grammar Practice",
        units: [
          {
            id: uid(2, "tue", 0),
            skill: "grammar",
            title: "Advanced Tenses — Part 5 Drill",
            description: "Part 5 questions focused on tense usage and signal words",
            exercises: [
              {
                targetModule: "toeic-practice",
                routePath: "/toeic/grammar",
                label: "Part 5 Drill",
                type: "drill",
              },
            ],
            estimatedMinutes: 25,
          },
        ],
      },
      {
        day: "wed",
        label: "Vocabulary",
        units: [
          {
            id: uid(2, "wed", 0),
            skill: "vocabulary",
            title: "TOEIC Vocab — Business (20 words)",
            description: "20 essential business vocabulary words",
            exercises: [
              {
                targetModule: "toeic-vocab",
                routePath: "/toeic/vocab",
                label: "Business Pack",
                type: "learn",
              },
            ],
            estimatedMinutes: 25,
          },
        ],
      },
      {
        day: "thu",
        label: "Listening",
        units: [
          {
            id: uid(2, "thu", 0),
            skill: "listening",
            title: "Listening Part 2 — Question-Response",
            description: "Learn Part 2 strategy: listen for question word, eliminate distractors",
            exercises: [
              {
                targetModule: "toeic-practice",
                routePath: "/toeic/grammar",
                label: "Part 2 Practice",
                type: "practice",
              },
            ],
            estimatedMinutes: 25,
          },
        ],
      },
      {
        day: "fri",
        label: "Mixed Practice",
        units: [
          {
            id: uid(2, "fri", 0),
            skill: "review",
            title: "Week 1-2 Consolidation",
            description: "Review tenses + vocab + listening basics",
            exercises: [
              {
                targetModule: "toeic-vocab",
                routePath: "/toeic/vocab",
                label: "Vocabulary Review",
                type: "practice",
              },
              {
                targetModule: "toeic-practice",
                routePath: "/toeic/grammar",
                label: "Mixed Quiz",
                type: "quiz",
              },
            ],
            estimatedMinutes: 30,
          },
        ],
      },
      {
        day: "sat",
        label: "Review Day",
        units: [
          {
            id: uid(2, "sat", 0),
            skill: "review",
            title: "Weekly Review",
            description: "Daily challenge + error review",
            exercises: [
              {
                targetModule: "error-notebook",
                routePath: "/error-notebook",
                label: "Daily Challenge",
                type: "practice",
              },
              {
                targetModule: "error-notebook",
                routePath: "/error-notebook",
                label: "Error Review",
                type: "practice",
              },
            ],
            estimatedMinutes: 25,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 3,
    focusTopic: "Parts of Speech & Word Formation",
    focusSkill: "grammar",
    dailyPlan: [
      {
        day: "mon",
        label: "Grammar Theory",
        units: [
          {
            id: uid(3, "mon", 0),
            skill: "grammar",
            title: "Parts of Speech in TOEIC",
            description: "Noun/Verb/Adjective/Adverb recognition — critical for Part 5",
            exercises: [
              {
                targetModule: "grammar-lessons",
                routePath: "/grammar-lessons?topic=parts-of-speech",
                label: "POS Theory",
                type: "learn",
              },
            ],
            estimatedMinutes: 30,
          },
        ],
      },
      {
        day: "tue",
        label: "Grammar Practice",
        units: [
          {
            id: uid(3, "tue", 0),
            skill: "grammar",
            title: "Word Formation Drill",
            description: "Practice identifying correct word forms",
            exercises: [
              {
                targetModule: "toeic-practice",
                routePath: "/toeic/grammar",
                label: "POS Drill",
                type: "drill",
              },
            ],
            estimatedMinutes: 25,
          },
        ],
      },
      {
        day: "wed",
        label: "Vocabulary",
        units: [
          {
            id: uid(3, "wed", 0),
            skill: "vocabulary",
            title: "TOEIC Vocab — Finance (20 words)",
            description: "Finance & accounting vocabulary",
            exercises: [
              {
                targetModule: "toeic-vocab",
                routePath: "/toeic/vocab",
                label: "Finance Pack",
                type: "learn",
              },
            ],
            estimatedMinutes: 25,
          },
        ],
      },
      {
        day: "thu",
        label: "Listening",
        units: [
          {
            id: uid(3, "thu", 0),
            skill: "listening",
            title: "Listening Part 1-2 Review",
            description: "Combined Part 1-2 practice with different accents",
            exercises: [
              {
                targetModule: "toeic-practice",
                routePath: "/toeic/grammar",
                label: "Part 1-2 Review",
                type: "practice",
              },
            ],
            estimatedMinutes: 25,
          },
        ],
      },
      {
        day: "fri",
        label: "Reading",
        units: [
          {
            id: uid(3, "fri", 0),
            skill: "reading",
            title: "Reading Basics — Skimming",
            description: "Practice skimming articles for main ideas",
            exercises: [
              {
                targetModule: "reading",
                routePath: "/reading",
                label: "Reading Practice",
                type: "practice",
              },
            ],
            estimatedMinutes: 25,
          },
        ],
      },
      {
        day: "sat",
        label: "Review Day",
        units: [
          {
            id: uid(3, "sat", 0),
            skill: "review",
            title: "Weekly Review",
            description: "Daily challenge + error review",
            exercises: [
              {
                targetModule: "error-notebook",
                routePath: "/error-notebook",
                label: "Daily Challenge",
                type: "practice",
              },
            ],
            estimatedMinutes: 25,
          },
        ],
      },
    ],
  },
  {
    weekNumber: 4,
    focusTopic: "Determiners, Pronouns & Quantifiers",
    focusSkill: "grammar",
    dailyPlan: [
      {
        day: "mon",
        label: "Grammar Theory",
        units: [
          {
            id: uid(4, "mon", 0),
            skill: "grammar",
            title: "Determiners & Pronouns",
            description: "Articles, demonstratives, possessives, reflexive pronouns",
            exercises: [
              {
                targetModule: "grammar-lessons",
                routePath: "/grammar-lessons?topic=determiners",
                label: "Theory",
                type: "learn",
              },
            ],
            estimatedMinutes: 30,
          },
        ],
      },
      {
        day: "tue",
        label: "Grammar Practice",
        units: [
          {
            id: uid(4, "tue", 0),
            skill: "grammar",
            title: "Determiners Drill",
            description: "Part 5 questions on articles and pronouns",
            exercises: [
              {
                targetModule: "toeic-practice",
                routePath: "/toeic/grammar",
                label: "Drill",
                type: "drill",
              },
            ],
            estimatedMinutes: 25,
          },
        ],
      },
      {
        day: "wed",
        label: "Vocabulary",
        units: [
          {
            id: uid(4, "wed", 0),
            skill: "vocabulary",
            title: "TOEIC Vocab — Marketing (20 words)",
            description: "Marketing & advertising vocabulary",
            exercises: [
              {
                targetModule: "toeic-vocab",
                routePath: "/toeic/vocab",
                label: "Marketing Pack",
                type: "learn",
              },
            ],
            estimatedMinutes: 25,
          },
        ],
      },
      {
        day: "thu",
        label: "Listening",
        units: [
          {
            id: uid(4, "thu", 0),
            skill: "listening",
            title: "Dictation — Beginner",
            description: "Dictation exercises to improve listening accuracy",
            exercises: [
              {
                targetModule: "toeic-dictation",
                routePath: "/toeic/grammar",
                label: "Dictation",
                type: "practice",
              },
            ],
            estimatedMinutes: 25,
          },
        ],
      },
      {
        day: "fri",
        label: "Mixed",
        units: [
          {
            id: uid(4, "fri", 0),
            skill: "review",
            title: "Week 3-4 Review",
            description: "Grammar + vocab + listening consolidated review",
            exercises: [
              {
                targetModule: "toeic-vocab",
                routePath: "/toeic/vocab",
                label: "Vocabulary Review",
                type: "practice",
              },
            ],
            estimatedMinutes: 30,
          },
        ],
      },
      {
        day: "sat",
        label: "Review Day",
        units: [
          {
            id: uid(4, "sat", 0),
            skill: "review",
            title: "Monthly Review",
            description: "Comprehensive review of Month 1 content",
            exercises: [
              {
                targetModule: "error-notebook",
                routePath: "/error-notebook",
                label: "Daily Challenge",
                type: "practice",
              },
            ],
            estimatedMinutes: 30,
          },
        ],
      },
    ],
  },
  // Weeks 5-8: Vocabulary + Reading Part 5 focus
  ...([5, 6, 7, 8] as const).map(
    (wn): Week => ({
      weekNumber: wn,
      focusTopic:
        wn <= 6
          ? `Vocabulary Expansion & Listening Part ${wn === 5 ? "1" : "2"} Mastery`
          : `Reading Part 5 Strategy & ${wn === 7 ? "Prepositions" : "Conjunctions"}`,
      focusSkill: (wn <= 6 ? "vocabulary" : "reading") as Skill,
      dailyPlan: [
        {
          day: "mon" as const,
          label: wn <= 6 ? "Vocabulary" : "Grammar Theory",
          units: [
            {
              id: uid(wn, "mon", 0),
              skill: (wn <= 6 ? "vocabulary" : "grammar") as Skill,
              title:
                wn <= 6
                  ? `Vocab Pack — ${wn === 5 ? "Manufacturing & Travel" : "Restaurants & Health"}`
                  : `${wn === 7 ? "Prepositions" : "Conjunctions"} in TOEIC`,
              description:
                wn <= 6
                  ? "Learn 40 words across 2 topic packs"
                  : `Master ${wn === 7 ? "preposition" : "conjunction"} usage for Part 5`,
              exercises: [
                {
                  targetModule: wn <= 6 ? "toeic-vocab" : "grammar-lessons",
                  routePath:
                    wn <= 6
                      ? "/toeic/vocab"
                      : `/grammar-lessons?topic=${wn === 7 ? "prepositions" : "conjunctions"}`,
                  label: wn <= 6 ? "Vocab Packs" : "Theory",
                  type: "learn" as ExerciseType,
                },
              ],
              estimatedMinutes: 30,
            },
          ],
        },
        {
          day: "tue" as const,
          label: "Practice",
          units: [
            {
              id: uid(wn, "tue", 0),
              skill: (wn <= 6 ? "vocabulary" : "grammar") as Skill,
              title: wn <= 6 ? "Vocab Quiz & Review" : "Part 5 Targeted Drill",
              description: wn <= 6 ? "Quiz + vocabulary review on new words" : "Focused grammar drill",
              exercises: [
                {
                  targetModule: wn <= 6 ? "toeic-vocab" : "toeic-practice",
                  routePath: wn <= 6 ? "/toeic/vocab" : "/toeic/grammar",
                  label: wn <= 6 ? "Vocabulary Review" : "Part 5 Drill",
                  type: "drill" as ExerciseType,
                },
              ],
              estimatedMinutes: 25,
            },
          ],
        },
        {
          day: "wed" as const,
          label: "Listening",
          units: [
            {
              id: uid(wn, "wed", 0),
              skill: "listening" as Skill,
              title: `Listening Part ${wn <= 6 ? "1-2" : "2"} Practice`,
              description: `Focused ${wn <= 6 ? "Part 1-2" : "Part 2"} exercises`,
              exercises: [
                {
                  targetModule: "toeic-practice",
                  routePath: "/toeic/grammar",
                  label: "Listening Drill",
                  type: "practice" as ExerciseType,
                },
              ],
              estimatedMinutes: 25,
            },
          ],
        },
        {
          day: "thu" as const,
          label: "Reading",
          units: [
            {
              id: uid(wn, "thu", 0),
              skill: "reading" as Skill,
              title: wn <= 6 ? "Reading Articles (B1)" : "Part 5 Strategy Application",
              description:
                wn <= 6
                  ? "Read B1 articles + vocabulary in context"
                  : "Apply strategies to full practice sets",
              exercises: [
                {
                  targetModule: wn <= 6 ? "reading" : "toeic-practice",
                  routePath: wn <= 6 ? "/reading" : "/reading",
                  label: wn <= 6 ? "Read Article" : "Reading Drill",
                  type: "practice" as ExerciseType,
                },
              ],
              estimatedMinutes: 25,
            },
          ],
        },
        {
          day: "fri" as const,
          label: "Mixed",
          units: [
            {
              id: uid(wn, "fri", 0),
              skill: "review" as Skill,
              title: "Consolidated Review",
              description: "Review all skills covered this week",
              exercises: [
                {
                  targetModule: "toeic-vocab",
                  routePath: "/toeic/vocab",
                  label: "Vocabulary Review",
                  type: "practice" as ExerciseType,
                },
                {
                  targetModule: "error-notebook",
                  routePath: "/error-notebook",
                  label: "Errors",
                  type: "practice" as ExerciseType,
                },
              ],
              estimatedMinutes: 30,
            },
          ],
        },
        {
          day: "sat" as const,
          label: "Review Day",
          units: [
            {
              id: uid(wn, "sat", 0),
              skill: "review" as Skill,
              title: "Weekly Review",
              description: "Daily challenge + comprehensive review",
              exercises: [
                {
                  targetModule: "error-notebook",
                  routePath: "/error-notebook",
                  label: "Challenge",
                  type: "practice" as ExerciseType,
                },
              ],
              estimatedMinutes: 25,
            },
          ],
        },
      ],
    }),
  ),
];

// ─── PHASE 2: Skill Building (Month 3-4) ───
const phase2Weeks: Week[] = ([9, 10, 11, 12, 13, 14, 15, 16] as const).map((wn) => {
  const topicMap: Record<number, { topic: string; skill: Skill }> = {
    9: { topic: "Advanced Grammar — Conditionals & Passive Voice", skill: "grammar" },
    10: { topic: "Advanced Grammar — Gerunds, Infinitives & Participles", skill: "grammar" },
    11: { topic: "Listening Strategy — Part 3 (Conversations)", skill: "listening" },
    12: { topic: "Listening Strategy — Part 4 (Talks)", skill: "listening" },
    13: { topic: "Reading Strategy — Part 6 (Text Completion)", skill: "reading" },
    14: { topic: "Reading Strategy — Part 7 (Comprehension)", skill: "reading" },
    15: { topic: "Speaking Introduction — Part 1-3", skill: "speaking" },
    16: { topic: "Writing Introduction — Part 1-5", skill: "writing" },
  };
  const { topic, skill } = topicMap[wn]!;

  return {
    weekNumber: wn,
    focusTopic: topic,
    focusSkill: skill,
    dailyPlan: [
      {
        day: "mon" as const,
        label: "Theory",
        units: [
          {
            id: uid(wn, "mon", 0),
            skill,
            title: `${topic} — Theory`,
            description: `Learn strategies and techniques for ${topic.toLowerCase()}`,
            exercises: [
              {
                targetModule: skill === "grammar" ? "grammar-lessons" : "toeic-practice",
                routePath:
                  skill === "grammar"
                    ? `/grammar-lessons?topic=${wn === 9 ? "conditionals" : "gerunds"}`
                    : `/toeic/${skill}`,
                label: "Theory",
                type: "learn" as ExerciseType,
              },
            ],
            estimatedMinutes: 35,
          },
        ],
      },
      {
        day: "tue" as const,
        label: "Practice",
        units: [
          {
            id: uid(wn, "tue", 0),
            skill,
            title: `${topic} — Practice`,
            description: "Apply strategies with targeted exercises",
            exercises: [
              {
                targetModule: "toeic-practice",
                routePath: `/toeic/${skill === "grammar" ? "grammar" : skill}`,
                label: "Practice",
                type: "drill" as ExerciseType,
              },
            ],
            estimatedMinutes: 30,
          },
        ],
      },
      {
        day: "wed" as const,
        label: "Vocabulary",
        units: [
          {
            id: uid(wn, "wed", 0),
            skill: "vocabulary",
            title: `Vocabulary — ${wn <= 12 ? "Technology" : wn <= 14 ? "General" : "Travel"}`,
            description: "Continue vocabulary expansion",
            exercises: [
              {
                targetModule: "toeic-vocab",
                routePath: "/toeic/vocab",
                label: "Vocab",
                type: "learn" as ExerciseType,
              },
            ],
            estimatedMinutes: 20,
          },
        ],
      },
      {
        day: "thu" as const,
        label: "Cross-skill",
        units: [
          {
            id: uid(wn, "thu", 0),
            skill: skill === "listening" ? "reading" : "listening",
            title: "Cross-skill Practice",
            description: "Maintain other skills while focusing on primary",
            exercises: [
              {
                targetModule: "toeic-practice",
                routePath: `/toeic/${skill === "listening" ? "reading" : "listening"}`,
                label: "Cross-skill",
                type: "practice" as ExerciseType,
              },
            ],
            estimatedMinutes: 25,
          },
        ],
      },
      {
        day: "fri" as const,
        label: "Integration",
        units: [
          {
            id: uid(wn, "fri", 0),
            skill: "review",
            title: "Week Integration",
            description: "Combined practice across all skills studied",
            exercises: [
              {
                targetModule: "toeic-vocab",
                routePath: "/toeic/vocab",
                label: "Vocabulary Review",
                type: "practice" as ExerciseType,
              },
              {
                targetModule: "error-notebook",
                routePath: "/error-notebook",
                label: "Errors",
                type: "practice" as ExerciseType,
              },
            ],
            estimatedMinutes: 30,
          },
        ],
      },
      {
        day: "sat" as const,
        label: "Review",
        units: [
          {
            id: uid(wn, "sat", 0),
            skill: "review",
            title: "Weekly Review",
            description: "Daily challenge + comprehensive review",
            exercises: [
              {
                targetModule: "error-notebook",
                routePath: "/error-notebook",
                label: "Challenge",
                type: "practice" as ExerciseType,
              },
            ],
            estimatedMinutes: 25,
          },
        ],
      },
    ],
  };
});

// ─── PHASE 3: Exam Mastery (Month 5-6) ───
const phase3Weeks: Week[] = ([17, 18, 19, 20, 21, 22, 23, 24] as const).map((wn) => {
  const topicMap: Record<number, { topic: string; skill: Skill }> = {
    17: { topic: "Full Mock Test #1 + Analysis", skill: "review" },
    18: { topic: "Error Analysis & Targeted Remediation", skill: "review" },
    19: { topic: "Weakness Drilling — AI-targeted Practice", skill: "review" },
    20: { topic: "Listening & Reading Speed Training", skill: "listening" },
    21: { topic: "Speaking Polish — All Parts", skill: "speaking" },
    22: { topic: "Writing Polish — Essay & Email", skill: "writing" },
    23: { topic: "Final Sprint — Timed Full Practice", skill: "review" },
    24: { topic: "Final Mock Test + Score Prediction", skill: "review" },
  };
  const { topic, skill } = topicMap[wn]!;

  return {
    weekNumber: wn,
    focusTopic: topic,
    focusSkill: skill,
    dailyPlan: [
      {
        day: "mon" as const,
        label: wn === 17 || wn === 24 ? "Mock Test" : "Focus",
        units: [
          {
            id: uid(wn, "mon", 0),
            skill,
            title: topic,
            description:
              wn === 17 || wn === 24
                ? "Complete a full mock test under timed conditions"
                : `Focused practice on ${topic.toLowerCase()}`,
            exercises: [
              {
                targetModule: wn === 17 || wn === 24 ? "toeic-mock-test" : "toeic-practice",
                routePath:
                  wn === 17 || wn === 24
                    ? "/toeic/mock-test"
                    : `/toeic/${skill === "review" ? "listening" : skill}`,
                label: wn === 17 || wn === 24 ? "Mock Test" : "Practice",
                type: (wn === 17 || wn === 24 ? "test" : "drill") as ExerciseType,
              },
            ],
            estimatedMinutes: wn === 17 || wn === 24 ? 120 : 40,
          },
        ],
      },
      {
        day: "tue" as const,
        label: "Analysis",
        units: [
          {
            id: uid(wn, "tue", 0),
            skill: "review",
            title: "Error Analysis & Review",
            description: "Analyze mistakes and review weak areas",
            exercises: [
              {
                targetModule: "error-notebook",
                routePath: "/error-notebook",
                label: "Error Analysis",
                type: "practice" as ExerciseType,
              },
              {
                targetModule: "toeic-progress",
                routePath: "/toeic/progress",
                label: "Progress Check",
                type: "practice" as ExerciseType,
              },
            ],
            estimatedMinutes: 30,
          },
        ],
      },
      {
        day: "wed" as const,
        label: "Drill",
        units: [
          {
            id: uid(wn, "wed", 0),
            skill: skill === "review" ? "grammar" : skill,
            title: "Targeted Weakness Drill",
            description: "AI-recommended exercises based on error patterns",
            exercises: [
              {
                targetModule: "toeic-practice",
                routePath: "/toeic/grammar",
                label: "Weak Area Drill",
                type: "drill" as ExerciseType,
              },
            ],
            estimatedMinutes: 30,
          },
        ],
      },
      {
        day: "thu" as const,
        label: "Cross-skill",
        units: [
          {
            id: uid(wn, "thu", 0),
            skill: wn >= 21 ? (wn <= 22 ? skill : "listening") : "reading",
            title:
              wn >= 21 && wn <= 22
                ? `${skill === "speaking" ? "Speaking" : "Writing"} Practice`
                : "Reading & Listening Practice",
            description: "Maintain breadth across all test sections",
            exercises: [
              {
                targetModule: "toeic-practice",
                routePath: `/toeic/${wn >= 21 && wn <= 22 ? skill : "practice"}`,
                label: "Cross-skill",
                type: "practice" as ExerciseType,
              },
            ],
            estimatedMinutes: 30,
          },
        ],
      },
      {
        day: "fri" as const,
        label: "Timed",
        units: [
          {
            id: uid(wn, "fri", 0),
            skill: "review",
            title: "Timed Practice Set",
            description: "Practice under time pressure — build exam stamina",
            exercises: [
              {
                targetModule: "toeic-practice",
                routePath: "/toeic/grammar",
                label: "Timed Drill",
                type: "drill" as ExerciseType,
              },
            ],
            estimatedMinutes: 35,
          },
        ],
      },
      {
        day: "sat" as const,
        label: "Review",
        units: [
          {
            id: uid(wn, "sat", 0),
            skill: "review",
            title: "Weekly Review",
            description: "Comprehensive review + progress check",
            exercises: [
              {
                targetModule: "error-notebook",
                routePath: "/error-notebook",
                label: "Challenge",
                type: "practice" as ExerciseType,
              },
              {
                targetModule: "toeic-progress",
                routePath: "/toeic/progress",
                label: "Progress",
                type: "practice" as ExerciseType,
              },
            ],
            estimatedMinutes: 30,
          },
        ],
      },
    ],
  };
});

// ─── Full Curriculum ───
export const CURRICULUM: Curriculum = {
  id: "toeic-6-month-800",
  title: "TOEIC 800-900 in 6 Months",
  targetScore: { lr: "800-900", sw: "350" },
  duration: "24 weeks (6 months)",
  phases: [
    {
      id: "phase-1",
      title: "Foundation",
      subtitle: "Build the core skills",
      monthRange: "Month 1-2",
      color: "#22c55e",
      accentColor: "var(--success)",
      weeks: phase1Weeks,
      checkpoint: {
        type: "mock-mini",
        label: "Phase 1 Checkpoint",
        description: "Mini assessment to evaluate grammar, vocabulary, and listening basics",
        routePath: "/toeic/mock-test",
      },
    },
    {
      id: "phase-2",
      title: "Skill Building",
      subtitle: "Master strategies for each Part",
      monthRange: "Month 3-4",
      color: "#3b82f6",
      accentColor: "var(--info)",
      weeks: phase2Weeks,
      checkpoint: {
        type: "mock-mini",
        label: "Phase 2 Checkpoint",
        description: "Mini Mock Test (100 questions) — first score benchmark",
        routePath: "/toeic/mock-test",
      },
    },
    {
      id: "phase-3",
      title: "Exam Mastery",
      subtitle: "Test practice & final polish",
      monthRange: "Month 5-6",
      color: "#f59e0b",
      accentColor: "var(--warning)",
      weeks: phase3Weeks,
      checkpoint: {
        type: "mock-full",
        label: "Final Assessment",
        description: "Full Mock Test (194 questions) — final score prediction",
        routePath: "/toeic/mock-test",
      },
    },
  ],
};

// ─── Utility functions ───
export function getWeek(weekNumber: number): Week | undefined {
  for (const phase of CURRICULUM.phases) {
    const week = phase.weeks.find((w) => w.weekNumber === weekNumber);
    if (week) return week;
  }
  return undefined;
}

export function getPhaseForWeek(weekNumber: number): Phase | undefined {
  return CURRICULUM.phases.find((p) => p.weeks.some((w) => w.weekNumber === weekNumber));
}

export function getAllUnits(): Unit[] {
  return CURRICULUM.phases.flatMap((p) =>
    p.weeks.flatMap((w) => w.dailyPlan.flatMap((d) => d.units)),
  );
}

export const SKILL_COLORS: Record<Skill, string> = {
  grammar: "#8b5cf6",
  listening: "#3b82f6",
  reading: "#22c55e",
  speaking: "#f59e0b",
  writing: "#ec4899",
  vocabulary: "#06b6d4",
  review: "#64748b",
};

export const SKILL_LABELS: Record<Skill, string> = {
  grammar: "Grammar",
  listening: "Listening",
  reading: "Reading",
  speaking: "Speaking",
  writing: "Writing",
  vocabulary: "Vocabulary",
  review: "Review",
};
