// ── Chrome message types between content script, background, and side panel ──

export type WordResult = {
  headword: string;
  phoneticsUs: string | null;
  phoneticsUk: string | null;
  partOfSpeech: string | null;
  level: string | null;
  register: string | null;
  shortMeaningsVi: string[];
  definitionEn: string;
  example: { en: string; vi: string } | null;
  senseCount: number;
  saved: boolean;
};

export type TranslationResult = {
  translation: string;
  keyVocabulary: { word: string; meaning: string }[];
};

export type LookupRequest = {
  type: "LOOKUP_WORD";
  word: string;
};

export type TranslateRequest = {
  type: "TRANSLATE_SENTENCE";
  text: string;
  context: string;
};

export type OpenSidePanelRequest = {
  type: "OPEN_SIDE_PANEL";
  word: string;
};

export type GetSettingsRequest = {
  type: "GET_SETTINGS";
};

export type SaveSettingsRequest = {
  type: "SAVE_SETTINGS";
  settings: ExtensionSettings;
};

export type ExtensionMessage =
  | LookupRequest
  | TranslateRequest
  | OpenSidePanelRequest
  | GetSettingsRequest
  | SaveSettingsRequest;

export type ExtensionSettings = {
  apiBaseUrl: string;
  autoSaveWords: boolean;
  showTooltipOnSelect: boolean;
};

export const DEFAULT_SETTINGS: ExtensionSettings = {
  apiBaseUrl: "https://thienglish.vercel.app",
  autoSaveWords: true,
  showTooltipOnSelect: true,
};
