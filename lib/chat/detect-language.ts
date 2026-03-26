import type { DetectedLanguage } from "@/lib/chat/types";

const vietnameseChars =
  /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;
const englishWords =
  /\b(and|is|are|what|how|why|when|where|practice|english|sentence|grammar|can|you|help|me|please|understand)\b/i;
const vietnameseWords =
  /\b(và|là|mình|bạn|cô|nghĩa|tiếng|anh|việt|giúp|cách|minh|muon|hoc|tieng|giai|thich|khong|co the|giai thich|the nao|lam on)\b/i;

function normalizeText(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function detectLanguage(input: string): DetectedLanguage {
  const text = input.trim();
  if (!text) return "unknown";

  const hasVietnameseSignal =
    vietnameseChars.test(text) || vietnameseWords.test(normalizeText(text));
  const hasEnglishSignal = englishWords.test(text);

  if (hasVietnameseSignal && hasEnglishSignal) return "mixed";
  if (hasVietnameseSignal) return "vietnamese";
  if (hasEnglishSignal) return "english";
  return "unknown";
}
