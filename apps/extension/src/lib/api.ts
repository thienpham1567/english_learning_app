import type {
  WordResult,
  TranslationResult,
  ExtensionSettings,
  DEFAULT_SETTINGS,
} from "./messaging";

/**
 * API client for the extension.
 * All calls go through the background service worker to avoid CORS issues.
 * The service worker makes fetch requests with credentials: "include" to pass
 * the better-auth session cookie.
 */

export async function lookupWord(word: string): Promise<WordResult> {
  const response = await chrome.runtime.sendMessage({
    type: "LOOKUP_WORD",
    word,
  });

  if (response?.error) {
    throw new Error(response.error);
  }

  return response as WordResult;
}

export async function translateSentence(
  text: string,
  context: string
): Promise<TranslationResult> {
  const response = await chrome.runtime.sendMessage({
    type: "TRANSLATE_SENTENCE",
    text,
    context,
  });

  if (response?.error) {
    throw new Error(response.error);
  }

  return response as TranslationResult;
}

export async function openSidePanel(word: string): Promise<void> {
  await chrome.runtime.sendMessage({
    type: "OPEN_SIDE_PANEL",
    word,
  });
}

export async function getSettings(): Promise<ExtensionSettings> {
  const response = await chrome.runtime.sendMessage({
    type: "GET_SETTINGS",
  });
  return response as ExtensionSettings;
}

export async function saveSettings(
  settings: ExtensionSettings
): Promise<void> {
  await chrome.runtime.sendMessage({
    type: "SAVE_SETTINGS",
    settings,
  });
}
