import { z } from "zod/v4";

export const TOEIC_SKILLS = [
	// Part 1 — Photo (3)
	"toeic.part1.people_action",
	"toeic.part1.object_state",
	"toeic.part1.scene",
	// Part 2 — Question-Response (3)
	"toeic.part2.wh_question",
	"toeic.part2.yn_question",
	"toeic.part2.statement",
	// Part 3 — Conversations (3)
	"toeic.part3.gist",
	"toeic.part3.detail",
	"toeic.part3.inference",
	// Part 4 — Talks (3)
	"toeic.part4.gist",
	"toeic.part4.detail",
	"toeic.part4.inference",
	// Part 5 — Incomplete sentences (5)
	"toeic.part5.verb_form",
	"toeic.part5.preposition",
	"toeic.part5.conjunction",
	"toeic.part5.vocab",
	"toeic.part5.pronoun",
	// Part 6 — Cloze passages (2)
	"toeic.part6.grammar",
	"toeic.part6.discourse",
	// Part 7 — Reading comprehension (5)
	"toeic.part7.detail",
	"toeic.part7.inference",
	"toeic.part7.vocab_in_context",
	"toeic.part7.main_idea",
	"toeic.part7.not_question",
] as const;

export const ToeicSkillSchema = z.enum(TOEIC_SKILLS);
export type ToeicSkill = z.infer<typeof ToeicSkillSchema>;

const SKILL_LABELS: Record<ToeicSkill, { en: string; vi: string }> = {
	"toeic.part1.people_action": { en: "Part 1 · People & actions", vi: "Part 1 · Người & hành động" },
	"toeic.part1.object_state": { en: "Part 1 · Object state", vi: "Part 1 · Trạng thái vật" },
	"toeic.part1.scene": { en: "Part 1 · Scene description", vi: "Part 1 · Mô tả khung cảnh" },
	"toeic.part2.wh_question": { en: "Part 2 · WH questions", vi: "Part 2 · Câu hỏi WH" },
	"toeic.part2.yn_question": { en: "Part 2 · Yes/No questions", vi: "Part 2 · Câu hỏi Yes/No" },
	"toeic.part2.statement": { en: "Part 2 · Statement response", vi: "Part 2 · Đáp lại câu trần thuật" },
	"toeic.part3.gist": { en: "Part 3 · Gist", vi: "Part 3 · Ý chính" },
	"toeic.part3.detail": { en: "Part 3 · Detail", vi: "Part 3 · Chi tiết" },
	"toeic.part3.inference": { en: "Part 3 · Inference", vi: "Part 3 · Suy luận" },
	"toeic.part4.gist": { en: "Part 4 · Gist", vi: "Part 4 · Ý chính" },
	"toeic.part4.detail": { en: "Part 4 · Detail", vi: "Part 4 · Chi tiết" },
	"toeic.part4.inference": { en: "Part 4 · Inference", vi: "Part 4 · Suy luận" },
	"toeic.part5.verb_form": { en: "Part 5 · Verb form/tense", vi: "Part 5 · Thì & dạng động từ" },
	"toeic.part5.preposition": { en: "Part 5 · Preposition", vi: "Part 5 · Giới từ" },
	"toeic.part5.conjunction": { en: "Part 5 · Conjunction", vi: "Part 5 · Liên từ" },
	"toeic.part5.vocab": { en: "Part 5 · Vocabulary", vi: "Part 5 · Từ vựng" },
	"toeic.part5.pronoun": { en: "Part 5 · Pronoun", vi: "Part 5 · Đại từ" },
	"toeic.part6.grammar": { en: "Part 6 · Grammar in cloze", vi: "Part 6 · Ngữ pháp trong đoạn" },
	"toeic.part6.discourse": { en: "Part 6 · Discourse/cohesion", vi: "Part 6 · Liên kết đoạn" },
	"toeic.part7.detail": { en: "Part 7 · Detail", vi: "Part 7 · Chi tiết" },
	"toeic.part7.inference": { en: "Part 7 · Inference", vi: "Part 7 · Suy luận" },
	"toeic.part7.vocab_in_context": { en: "Part 7 · Vocab in context", vi: "Part 7 · Từ vựng trong ngữ cảnh" },
	"toeic.part7.main_idea": { en: "Part 7 · Main idea", vi: "Part 7 · Ý chính bài đọc" },
	"toeic.part7.not_question": { en: "Part 7 · NOT/EXCEPT", vi: "Part 7 · Câu phủ định/loại trừ" },
};

export function getSkillLabel(id: ToeicSkill, lang: "en" | "vi" = "vi"): string {
	return SKILL_LABELS[id]?.[lang] ?? id;
}

export function getSkillsByPart(part: number): ToeicSkill[] {
	const prefix = `toeic.part${part}.`;
	return TOEIC_SKILLS.filter((s) => s.startsWith(prefix));
}

export function isToeicSkill(id: string): id is ToeicSkill {
	return (TOEIC_SKILLS as readonly string[]).includes(id);
}
