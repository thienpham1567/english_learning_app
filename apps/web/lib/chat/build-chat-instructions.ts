import { findPersona } from "@/lib/chat/personas";
import type { PersonaInstructionInput } from "@/lib/chat/personas";

export function buildChatInstructions(input: PersonaInstructionInput & { personaId: string }) {
  const persona = findPersona(input.personaId);
  return persona.buildInstructions({
    consecutiveVietnameseTurns: input.consecutiveVietnameseTurns,
  });
}
