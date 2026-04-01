import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";

import {
  BookOpen,
  Sparkles,
  MessageCircle,
  Lightbulb,
  PenLine,
  ListChecks,
  FileText,
  GraduationCap,
  BriefcaseBusiness,
  Mail,
  Headphones,
  BarChart3,
} from "lucide-react";

import { SimonAvatar } from "@/components/app/english-chatbot/persona-avatars/SimonAvatar";
import { ChristineAvatar } from "@/components/app/english-chatbot/persona-avatars/ChristineAvatar";
import { EddieAvatar } from "@/components/app/english-chatbot/persona-avatars/EddieAvatar";

export type PersonaInstructionInput = {
  consecutiveVietnameseTurns: number;
};

export type Persona = {
  id: string;
  label: string;
  avatar: ComponentType<{ size?: number }>;
  buildInstructions: (input: PersonaInstructionInput) => string;
  suggestions: readonly { text: string; icon: ComponentType<LucideProps> }[];
};

function viNudge(): string {
  return "In this reply, gently remind the learner to switch back to English for speaking practice.";
}

export const PERSONAS: readonly Persona[] = [
  {
    id: "simon",
    label: "Simon Hosking — Native Fluency",
    avatar: SimonAvatar,
    buildInstructions({ consecutiveVietnameseTurns }) {
      const lines = [
        "You are Simon Hosking, a native English speaker and conversational fluency coach.",
        "Focus on natural idioms, slang, and conversational flow to help the learner speak like a native.",
        "Prefer English in your replies.",
        "Use Vietnamese only briefly when clarification genuinely helps.",
        "Be friendly, concise, and encouraging.",
        "Correct mistakes naturally, as a native speaker would, and keep the conversation going.",
      ];
      if (consecutiveVietnameseTurns >= 2) lines.push(viNudge());
      return lines.join("\n");
    },
    suggestions: [
      { text: "Sửa ngữ pháp giúp mình: I goed to school.", icon: BookOpen },
      { text: "Giải thích một từ lóng của người Úc nhé.", icon: MessageCircle },
      { text: "'Break a leg' nghĩa là gì vậy?", icon: Lightbulb },
      { text: "Cho mình một bài luyện nhanh bằng tiếng Anh.", icon: Sparkles },
      { text: "Sự khác nhau giữa 'fun' và 'funny' là gì?", icon: Lightbulb },
      { text: "Vì sao phải nói 'I am' chứ không phải 'I is'?", icon: Lightbulb },
      { text: "Dạy mình cách chào hỏi tự nhiên như người bản xứ.", icon: MessageCircle },
      { text: "Cho mình 5 phrasal verb thông dụng nhất nhé.", icon: ListChecks },
    ],
  },
  {
    id: "christine",
    label: "Christine Ho — IELTS Master",
    avatar: ChristineAvatar,
    buildInstructions({ consecutiveVietnameseTurns }) {
      const lines = [
        "You are Christine Ho, an expert IELTS examiner and academic English tutor.",
        "Focus on Academic English and provide feedback based on IELTS rubrics: Task Response, Coherence and Cohesion, Lexical Resource, and Grammatical Range and Accuracy.",
        "When correcting writing or speaking, reference the relevant IELTS band descriptor.",
        "Prefer English in your replies.",
        "Use Vietnamese only briefly when clarification genuinely helps.",
        "Be precise, constructive, and professional.",
      ];
      if (consecutiveVietnameseTurns >= 2) lines.push(viNudge());
      return lines.join("\n");
    },
    suggestions: [
      { text: "Chấm đoạn Writing Task 2 này theo tiêu chí IELTS.", icon: PenLine },
      { text: "Cho mình từ vựng học thuật thay cho 'very good'.", icon: BookOpen },
      { text: "Viết lại câu này cho giống band 7+.", icon: Sparkles },
      { text: "Luyện Speaking Part 2: Describe a memorable trip.", icon: MessageCircle },
      { text: "Giải thích cách dùng 'Although' và 'Despite'.", icon: Lightbulb },
      { text: "Cho mình cấu trúc mở bài Writing Task 1.", icon: FileText },
      { text: "Mình cần cải thiện Coherence & Cohesion, bắt đầu từ đâu?", icon: GraduationCap },
      { text: "Chữa lỗi ngữ pháp phổ biến band 5-6 giúp mình.", icon: ListChecks },
    ],
  },
  {
    id: "eddie",
    label: "Eddie Oliver — TOEIC Master",
    avatar: EddieAvatar,
    buildInstructions({ consecutiveVietnameseTurns }) {
      const lines = [
        "You are Eddie Oliver, a business English specialist and TOEIC expert.",
        "Focus on workplace communication, business vocabulary, and TOEIC-style listening and reading structures.",
        "Help the learner understand professional English used in emails, meetings, and business contexts.",
        "Prefer English in your replies.",
        "Use Vietnamese only briefly when clarification genuinely helps.",
        "Be professional, practical, and clear.",
      ];
      if (consecutiveVietnameseTurns >= 2) lines.push(viNudge());
      return lines.join("\n");
    },
    suggestions: [
      { text: "Viết email xin nghỉ phép bằng tiếng Anh.", icon: Mail },
      { text: "Cho mình một bài luyện TOEIC Part 5.", icon: ListChecks },
      { text: "Giải thích từ vựng kinh doanh: revenue vs. profit.", icon: BriefcaseBusiness },
      { text: "Luyện nghe: tóm tắt đoạn hội thoại văn phòng.", icon: Headphones },
      { text: "Viết báo cáo ngắn bằng tiếng Anh về doanh số tháng.", icon: BarChart3 },
      { text: "Dạy mình cách trình bày ý kiến trong cuộc họp.", icon: MessageCircle },
      { text: "Cho mình mẫu email follow-up sau cuộc họp.", icon: Mail },
      { text: "Phân biệt 'make' và 'do' trong ngữ cảnh công việc.", icon: Lightbulb },
    ],
  },
];

export const DEFAULT_PERSONA_ID = "simon";

export const PERSONA_IDS = PERSONAS.map((p) => p.id);

export function findPersona(id: string): Persona {
  return PERSONAS.find((p) => p.id === id) ?? PERSONAS[0];
}
