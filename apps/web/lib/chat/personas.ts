import type { ComponentType } from "react";
import type { AntdIconProps } from "@ant-design/icons/lib/components/AntdIcon";

import {
  ReadOutlined,
  StarOutlined,
  MessageOutlined,
  BulbOutlined,
  EditOutlined,
  OrderedListOutlined,
  FileTextOutlined,
  TrophyOutlined,
  ShopOutlined,
  MailOutlined,
  CustomerServiceOutlined,
  BarChartOutlined,
} from "@ant-design/icons";

import { SimonAvatar } from "@/components/app/english-chatbot/persona-avatars/SimonAvatar";
import { ChristineAvatar } from "@/components/app/english-chatbot/persona-avatars/ChristineAvatar";
import { EddieAvatar } from "@/components/app/english-chatbot/persona-avatars/EddieAvatar";

export type PersonaInstructionInput = {
  consecutiveVietnameseTurns: number;
};

export type Persona = {
  id: string;
  label: string;
  specialty: string;
  description: string;
  avatar: ComponentType<{ size?: number }>;
  buildInstructions: (input: PersonaInstructionInput) => string;
  suggestions: readonly { text: string; icon: ComponentType<Partial<AntdIconProps>> }[];
};

function viNudge(): string {
  return "In this reply, gently remind the learner to switch back to English for speaking practice.";
}

export const PERSONAS: readonly Persona[] = [
  {
    id: "simon",
    label: "Simon Hosking",
    specialty: "Native Fluency",
    description: "Luyện nói tự nhiên như người bản xứ, idioms và slang.",
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
      { text: "Sửa ngữ pháp giúp mình: I goed to school.", icon: ReadOutlined },
      { text: "Giải thích một từ lóng của người Úc nhé.", icon: MessageOutlined },
      { text: "'Break a leg' nghĩa là gì vậy?", icon: BulbOutlined },
      { text: "Cho mình một bài luyện nhanh bằng tiếng Anh.", icon: StarOutlined },
      { text: "Sự khác nhau giữa 'fun' và 'funny' là gì?", icon: BulbOutlined },
      { text: "Vì sao phải nói 'I am' chứ không phải 'I is'?", icon: BulbOutlined },
      { text: "Dạy mình cách chào hỏi tự nhiên như người bản xứ.", icon: MessageOutlined },
      { text: "Cho mình 5 phrasal verb thông dụng nhất nhé.", icon: OrderedListOutlined },
    ],
  },
  {
    id: "christine",
    label: "Christine Ho",
    specialty: "IELTS Master",
    description: "Chấm bài, luyện Writing & Speaking theo chuẩn IELTS.",
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
      { text: "Chấm đoạn Writing Task 2 này theo tiêu chí IELTS.", icon: EditOutlined },
      { text: "Cho mình từ vựng học thuật thay cho 'very good'.", icon: ReadOutlined },
      { text: "Viết lại câu này cho giống band 7+.", icon: StarOutlined },
      { text: "Luyện Speaking Part 2: Describe a memorable trip.", icon: MessageOutlined },
      { text: "Giải thích cách dùng 'Although' và 'Despite'.", icon: BulbOutlined },
      { text: "Cho mình cấu trúc mở bài Writing Task 1.", icon: FileTextOutlined },
      { text: "Mình cần cải thiện Coherence & Cohesion, bắt đầu từ đâu?", icon: TrophyOutlined },
      { text: "Chữa lỗi ngữ pháp phổ biến band 5-6 giúp mình.", icon: OrderedListOutlined },
    ],
  },
  {
    id: "eddie",
    label: "Eddie Oliver",
    specialty: "TOEIC Master",
    description: "Tiếng Anh thương mại, email, và luyện TOEIC.",
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
      { text: "Viết email xin nghỉ phép bằng tiếng Anh.", icon: MailOutlined },
      { text: "Cho mình một bài luyện TOEIC Part 5.", icon: OrderedListOutlined },
      { text: "Giải thích từ vựng kinh doanh: revenue vs. profit.", icon: ShopOutlined },
      { text: "Luyện nghe: tóm tắt đoạn hội thoại văn phòng.", icon: CustomerServiceOutlined },
      { text: "Viết báo cáo ngắn bằng tiếng Anh về doanh số tháng.", icon: BarChartOutlined },
      { text: "Dạy mình cách trình bày ý kiến trong cuộc họp.", icon: MessageOutlined },
      { text: "Cho mình mẫu email follow-up sau cuộc họp.", icon: MailOutlined },
      { text: "Phân biệt 'make' và 'do' trong ngữ cảnh công việc.", icon: BulbOutlined },
    ],
  },
];

export const DEFAULT_PERSONA_ID = "simon";

export const PERSONA_IDS = PERSONAS.map((p) => p.id);

export function findPersona(id: string): Persona {
  return PERSONAS.find((p) => p.id === id) ?? PERSONAS[0];
}
