import type { ModuleSkillMapping } from "./skill-taxonomy";
import { TOEIC_SKILLS } from "./toeic-skill-taxonomy";

export const MODULE_SKILL_MAPPING: ModuleSkillMapping[] = [
	{ moduleType: "toeic_practice", skillIds: [...TOEIC_SKILLS] },
	{ moduleType: "toeic_diagnostic", skillIds: [...TOEIC_SKILLS] },
	{ moduleType: "toeic_mock_test", skillIds: [...TOEIC_SKILLS] },
	{ moduleType: "toeic_speaking", skillIds: [...TOEIC_SKILLS] },
	{ moduleType: "toeic_writing", skillIds: [...TOEIC_SKILLS] },
	{
		moduleType: "toeic_grammar_drill",
		skillIds: [
			"toeic.part5.verb_form",
			"toeic.part5.preposition",
			"toeic.part5.conjunction",
			"toeic.part5.vocab",
			"toeic.part5.pronoun",
			"toeic.part6.grammar",
			"toeic.part6.discourse",
		],
	},
	{
		moduleType: "toeic_vocab",
		skillIds: ["toeic.part5.vocab", "toeic.part7.vocab_in_context"],
	},
];
