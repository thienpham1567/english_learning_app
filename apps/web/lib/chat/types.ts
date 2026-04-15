export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

export type DetectedLanguage = "english" | "vietnamese" | "mixed" | "unknown";
