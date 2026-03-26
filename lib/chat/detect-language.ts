import type { DetectedLanguage } from "@/lib/chat/types";

const vietnameseChars =
  /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;
const englishWords =
  /\b(the|and|is|are|what|how|why|when|where|practice|english|sentence|grammar)\b/i;
const vietnameseWords = /\b(và|là|mình|bạn|cô|nghĩa|tiếng|anh|việt|giúp|cách)\b/i;

export function detectLanguage(input: string): DetectedLanguage {
  const text = input.trim();
  if (!text) return "unknown";

  const hasVietnameseSignal =
    vietnameseChars.test(text) || vietnameseWords.test(text);
  const hasEnglishSignal = englishWords.test(text);

  if (hasVietnameseSignal && hasEnglishSignal) return "mixed";
  if (hasVietnameseSignal) return "vietnamese";
  if (hasEnglishSignal) return "english";
  return "unknown";
}
