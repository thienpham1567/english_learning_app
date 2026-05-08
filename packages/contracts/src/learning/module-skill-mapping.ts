import type { ModuleSkillMapping } from "./skill-taxonomy";
import { TOEIC_SKILLS } from "./toeic-skill-taxonomy";

export const MODULE_SKILL_MAPPING: ModuleSkillMapping[] = [
	{ moduleType: "toeic_practice", skillIds: [...TOEIC_SKILLS] },
	{ moduleType: "toeic_diagnostic", skillIds: [...TOEIC_SKILLS] },
	{ moduleType: "toeic_mock_test", skillIds: [...TOEIC_SKILLS] },
	{ moduleType: "toeic_speaking", skillIds: [...TOEIC_SKILLS] },
	{ moduleType: "toeic_writing", skillIds: [...TOEIC_SKILLS] },
];
