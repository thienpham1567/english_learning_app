/**
 * Text selection utilities for the content script.
 */

const WORD_PATTERN = /^[A-Za-z][A-Za-z\s'-]{0,79}$/;

export type SelectionType = "word" | "sentence";

export function getSelectedText(): string {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return "";
  return selection.toString().trim();
}

/**
 * Classify whether selected text is a word/phrase or a sentence.
 * - 1-3 tokens matching the dictionary pattern → word lookup
 * - Everything else → sentence translation
 */
export function classifySelection(text: string): SelectionType {
  const tokens = text.split(/\s+/).filter(Boolean);
  if (tokens.length <= 3 && WORD_PATTERN.test(text)) {
    return "word";
  }
  return "sentence";
}

/**
 * Extract surrounding sentences for context-aware translation.
 * Gets the paragraph text around the selection and returns ~2-3 surrounding sentences.
 */
export function getSurroundingContext(maxSentences = 3): string {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return "";

  const range = selection.getRangeAt(0);

  // Walk up to find the containing block element (paragraph, div, etc.)
  let container: Node | null = range.commonAncestorContainer;
  while (container && container.nodeType === Node.TEXT_NODE) {
    container = container.parentNode;
  }

  if (!container || !(container instanceof HTMLElement)) return "";

  const fullText = container.textContent || "";
  const selectedText = selection.toString().trim();

  // Find the selected text within the container
  const selectionIndex = fullText.indexOf(selectedText);
  if (selectionIndex === -1) return fullText.slice(0, 500);

  // Split into sentences and find surrounding ones
  const sentences = fullText.match(/[^.!?]+[.!?]+\s*/g) || [fullText];
  let charCount = 0;
  let startIdx = 0;
  let endIdx = sentences.length;

  for (let i = 0; i < sentences.length; i++) {
    charCount += sentences[i].length;
    if (charCount >= selectionIndex && startIdx === 0) {
      startIdx = Math.max(0, i - 1);
    }
    if (charCount >= selectionIndex + selectedText.length) {
      endIdx = Math.min(sentences.length, i + 2);
      break;
    }
  }

  return sentences
    .slice(startIdx, Math.min(endIdx, startIdx + maxSentences))
    .join("")
    .trim()
    .slice(0, 500);
}

/**
 * Get the bounding rectangle of the current text selection.
 * Used to position the tooltip near the selected text.
 */
export function getSelectionRect(): DOMRect | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  // Ensure the rect has dimensions
  if (rect.width === 0 && rect.height === 0) return null;

  return rect;
}
