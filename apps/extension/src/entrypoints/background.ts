import {
  type ExtensionMessage,
  type ExtensionSettings,
  type WordResult,
  type TranslationResult,
  DEFAULT_SETTINGS,
} from "@/lib/messaging";

export default defineBackground(() => {
  // ── Settings management ──────────────────────────────────────────────────

  async function loadSettings(): Promise<ExtensionSettings> {
    const result = await chrome.storage.local.get("settings");
    return result.settings
      ? { ...DEFAULT_SETTINGS, ...result.settings }
      : DEFAULT_SETTINGS;
  }

  async function saveSettings(settings: ExtensionSettings): Promise<void> {
    await chrome.storage.local.set({ settings });
  }

  // ── API helpers ──────────────────────────────────────────────────────────

  async function apiPost<T>(
    path: string,
    body: Record<string, unknown>,
  ): Promise<T> {
    const settings = await loadSettings();
    const url = `${settings.apiBaseUrl}/api${path}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `API error: ${response.status}`);
    }

    return response.json();
  }

  // ── Word lookup ──────────────────────────────────────────────────────────

  async function handleLookupWord(word: string): Promise<WordResult> {
    const result = await apiPost<{
      data: {
        headword: string;
        phoneticsUs: string | null;
        phoneticsUk: string | null;
        partOfSpeech: string | null;
        level: string | null;
        register: string | null;
        senses: Array<{
          definitionEn: string;
          shortMeaningsVi: string[];
          examples: Array<{ en: string; vi: string }>;
        }>;
      };
      saved: boolean;
    }>("/dictionary", { word });

    const firstSense = result.data.senses[0];

    return {
      headword: result.data.headword,
      phoneticsUs: result.data.phoneticsUs,
      phoneticsUk: result.data.phoneticsUk,
      partOfSpeech: result.data.partOfSpeech,
      level: result.data.level,
      register: result.data.register,
      shortMeaningsVi: firstSense?.shortMeaningsVi ?? [],
      definitionEn: firstSense?.definitionEn ?? "",
      example: firstSense?.examples?.[0] ?? null,
      senseCount: result.data.senses.length,
      saved: result.saved,
    };
  }

  // ── Sentence translation ─────────────────────────────────────────────────

  async function handleTranslateSentence(
    text: string,
    context: string,
  ): Promise<TranslationResult> {
    return apiPost<TranslationResult>("/translate", { text, context });
  }

  // ── Context menu ─────────────────────────────────────────────────────────

  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "lookup-word",
      title: 'Look up "%s"',
      contexts: ["selection"],
    });

    chrome.contextMenus.create({
      id: "translate-sentence",
      title: 'Translate "%s"',
      contexts: ["selection"],
    });
  });

  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (!tab?.id || !info.selectionText) return;

    if (info.menuItemId === "lookup-word") {
      chrome.tabs.sendMessage(tab.id, {
        type: "CONTEXT_MENU_LOOKUP",
        text: info.selectionText,
      });
    } else if (info.menuItemId === "translate-sentence") {
      chrome.tabs.sendMessage(tab.id, {
        type: "CONTEXT_MENU_TRANSLATE",
        text: info.selectionText,
      });
    }
  });

  // ── Keyboard shortcut ────────────────────────────────────────────────────

  chrome.commands.onCommand.addListener(async (command, tab) => {
    if (command === "lookup-selection" && tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: "KEYBOARD_LOOKUP" });
    }
  });

  // ── Full word lookup (for side panel) ──────────────────────────────────

  async function handleLookupWordFull(word: string) {
    const result = await apiPost<{
      data: Record<string, unknown>;
      saved: boolean;
    }>("/dictionary", { word });
    return result.data;
  }

  // ── Message handler ──────────────────────────────────────────────────────

  chrome.runtime.onMessage.addListener(
    (
      message: ExtensionMessage & { type: string; word?: string },
      sender: chrome.runtime.MessageSender,
      sendResponse: (response: unknown) => void,
    ) => {
      (async () => {
        try {
          switch (message.type) {
            case "LOOKUP_WORD": {
              const result = await handleLookupWord(message.word!);
              sendResponse(result);
              break;
            }
            case "LOOKUP_WORD_FULL": {
              const result = await handleLookupWordFull(message.word!);
              sendResponse(result);
              break;
            }
            case "TRANSLATE_SENTENCE": {
              const result = await handleTranslateSentence(
                message.text,
                message.context,
              );
              sendResponse(result);
              break;
            }
            case "OPEN_SIDE_PANEL": {
              // When called from popup, sender.tab is undefined — get active tab
              let tabId = sender.tab?.id;
              if (!tabId) {
                const [activeTab] = await chrome.tabs.query({
                  active: true,
                  currentWindow: true,
                });
                tabId = activeTab?.id;
              }
              if (tabId) {
                await chrome.sidePanel.open({ tabId });
                await chrome.storage.session.set({
                  sidePanelWord: message.word,
                });
              }
              sendResponse({ ok: true });
              break;
            }
            case "GET_SETTINGS": {
              const settings = await loadSettings();
              sendResponse(settings);
              break;
            }
            case "SAVE_SETTINGS": {
              await saveSettings(message.settings);
              sendResponse({ ok: true });
              break;
            }
            default:
              sendResponse({ error: "Unknown message type" });
          }
        } catch (err) {
          sendResponse({
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      })();

      // Return true to indicate we'll call sendResponse asynchronously
      return true;
    },
  );
});
