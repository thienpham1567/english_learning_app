import { GRAMMAR_TOPIC_CATEGORIES } from "./topics";

export type PriorityTierId = "high" | "medium" | "low";

export type GrammarPointRef =
  | { kind: "expand"; categoryId: string }
  | { kind: "direct"; topicId: string };

export type GrammarPoint = {
  id: string;
  title: string;
  /** Vietnamese "ghi chú trọng tâm" shown under the point and fed to AI generation. */
  focusNote: string;
  ref: GrammarPointRef;
};

export type PriorityTier = {
  id: PriorityTierId;
  stars: string;
  title: string;
  subtitle: string;
  color: string;
  points: GrammarPoint[];
};

export const PRIORITY_TIERS: PriorityTier[] = [
  {
    id: "high",
    stars: "⭐⭐⭐",
    title: "Ưu tiên cao nhất",
    subtitle: "Học kỹ trước",
    color: "var(--error)",
    points: [
      {
        id: "p-word-forms",
        title: "Word forms (N/V/Adj/Adv)",
        focusNote: "Nhận biết qua hậu tố: -tion/-ment/-ity (N); -ly (Adv); -able/-ive/-ous (Adj)",
        ref: { kind: "expand", categoryId: "parts-of-speech" },
      },
      {
        id: "p-tenses",
        title: "12 thì động từ",
        focusNote: "HTĐ, QKĐ, HTHT, TLĐ gặp nhiều nhất; HTTD và QKHT ít hơn",
        ref: { kind: "expand", categoryId: "tenses" },
      },
      {
        id: "p-sva",
        title: "Hòa hợp chủ–vị",
        focusNote:
          "one of + N(plural) + V_s; neither A nor B + V (chia theo B); the number of vs a number of",
        ref: { kind: "expand", categoryId: "subject-verb-agreement" },
      },
      {
        id: "p-word-choice",
        title: "Từ loại + word choice",
        focusNote: "comply with, contribute to, account for, refrain from",
        ref: { kind: "expand", categoryId: "prepositions" },
      },
      {
        id: "p-prep-time-place",
        title: "Giới từ thời gian/nơi chốn",
        focusNote: "in/on/at; by/until; for/during/while; among/between",
        ref: { kind: "expand", categoryId: "prepositions" },
      },
      {
        id: "p-conj-vs-prep",
        title: "Phân biệt liên từ/giới từ",
        focusNote: "because vs because of; although vs despite; while vs during",
        ref: { kind: "direct", topicId: "conj-vs-prep" },
      },
      {
        id: "p-pronouns",
        title: "Đại từ",
        focusNote: "its vs it's; their vs theirs; phản thân khi chủ–tân ngữ cùng người",
        ref: { kind: "expand", categoryId: "pronouns" },
      },
      {
        id: "p-relative-clauses",
        title: "Mệnh đề quan hệ",
        focusNote: "who/whom/which/that/whose/where/when; rút gọn V-ing / V-ed",
        ref: { kind: "expand", categoryId: "clauses" },
      },
      {
        id: "p-transitions",
        title: "Liên từ & trạng từ liên kết",
        focusNote: "however, therefore, moreover, nevertheless, consequently — cốt lõi Part 6",
        ref: { kind: "expand", categoryId: "conjunctions" },
      },
      {
        id: "p-gerund-infinitive",
        title: "Gerund vs To-infinitive",
        focusNote:
          "enjoy/avoid/consider + V-ing; agree/decide/refuse + to V; khác nghĩa: remember/stop/regret",
        ref: { kind: "expand", categoryId: "gerunds-infinitives" },
      },
      {
        id: "p-participles",
        title: "Participles (V-ing vs V-ed)",
        focusNote: "interesting/interested; phân từ rút gọn mệnh đề",
        ref: { kind: "direct", topicId: "participles" },
      },
      {
        id: "p-parallel",
        title: "Cấu trúc song song",
        focusNote: "both...and, either...or, not only...but also → cùng dạng",
        ref: { kind: "direct", topicId: "parallel-structure" },
      },
      {
        id: "p-sentence-insertion",
        title: "Sentence insertion (Part 6)",
        focusNote: "Tìm đại từ liên kết và trạng từ chuyển ý",
        ref: { kind: "direct", topicId: "sentence-insertion" },
      },
    ],
  },
  {
    id: "medium",
    stars: "⭐⭐",
    title: "Ưu tiên trung bình",
    subtitle: "Củng cố sau nền tảng",
    color: "var(--warning)",
    points: [
      {
        id: "p-passive",
        title: "Câu bị động",
        focusNote: "be + V3/Ved trong các thì; bị động hoàn thành",
        ref: { kind: "expand", categoryId: "passive" },
      },
      {
        id: "p-comparatives",
        title: "So sánh",
        focusNote: "-er/more...than; as...as; the more...the more",
        ref: { kind: "expand", categoryId: "comparatives" },
      },
      {
        id: "p-modals",
        title: "Modal verbs",
        focusNote: "should/must/may/might/can/could; modal perfect (should have + V3)",
        ref: { kind: "expand", categoryId: "modals" },
      },
      {
        id: "p-conditionals",
        title: "Câu điều kiện",
        focusNote: "Type 0–3, Mixed; đảo ngữ (Had I known, Should you need, Were I)",
        ref: { kind: "expand", categoryId: "conditionals" },
      },
      {
        id: "p-subjunctive",
        title: "Câu giả định",
        focusNote: "suggest/recommend/demand/insist + that + S + V (bare)",
        ref: { kind: "direct", topicId: "subjunctive" },
      },
      {
        id: "p-inversion",
        title: "Đảo ngữ",
        focusNote: "Sau Never, Rarely, Hardly, Not only, Under no circumstances",
        ref: { kind: "direct", topicId: "inversion-toeic" },
      },
      {
        id: "p-causative",
        title: "Cấu trúc nguyên nhân",
        focusNote: "have/get + sb + to V; have/get + sth + V3",
        ref: { kind: "direct", topicId: "causative" },
      },
      {
        id: "p-determiners",
        title: "Determiners/Quantifiers",
        focusNote: "much/many, few/little, a number of vs the number of",
        ref: { kind: "expand", categoryId: "determiners" },
      },
      {
        id: "p-articles",
        title: "Mạo từ",
        focusNote: "a/an/the/Ø — nhiều bẫy nhỏ trong Part 6",
        ref: { kind: "direct", topicId: "articles" },
      },
    ],
  },
  {
    id: "low",
    stars: "⭐",
    title: "Ít gặp",
    subtitle: "Nhận biết là đủ",
    color: "var(--text-muted)",
    points: [
      {
        id: "p-reported-speech",
        title: "Reported speech",
        focusNote: "Hiếm trong Part 5; chủ yếu nhận biết trong Part 7",
        ref: { kind: "direct", topicId: "reported-speech" },
      },
      {
        id: "p-tag-questions",
        title: "Tag questions",
        focusNote: "Chủ yếu Part 2 Listening",
        ref: { kind: "direct", topicId: "tag-questions" },
      },
    ],
  },
];

/** All topic IDs a tier touches (expand → sub-topics, direct → the topic). */
export function getTierTopicIds(tier: PriorityTier): string[] {
  const ids: string[] = [];
  for (const point of tier.points) {
    const ref = point.ref;
    if (ref.kind === "direct") {
      ids.push(ref.topicId);
    } else {
      const cat = GRAMMAR_TOPIC_CATEGORIES.find((c) => c.id === ref.categoryId);
      if (cat) ids.push(...cat.topics.map((t) => t.id));
    }
  }
  return ids;
}
