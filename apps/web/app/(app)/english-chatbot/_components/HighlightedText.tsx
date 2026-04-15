"use client";

import { memo, useMemo, useCallback, type MouseEvent } from "react";

// Stopwords — common short/ambiguous English words to skip
const STOPWORDS = new Set([
  "a", "an", "the", "and", "but", "for", "nor", "yet", "not", "can", "has",
  "had", "was", "are", "his", "her", "its", "our", "who", "how", "what",
  "that", "this", "with", "from", "into", "been", "have", "will", "they",
  "them", "then", "than", "also", "just", "very", "much", "more", "most",
  "some", "only", "each", "both", "such", "too", "all", "any", "few", "own",
  "may", "did", "does", "about", "would", "could", "should", "which", "where",
  "when", "there", "their", "these", "those", "other", "after", "before",
  "your", "you", "she", "him", "let", "get", "got", "use", "way", "say",
  "said", "like", "make", "made", "take", "come", "here", "well", "now",
]);

// Match English words 3+ chars at word boundaries
const WORD_REGEX = /\b[A-Za-z]{3,}\b/g;

type Segment = { type: "text"; value: string } | { type: "word"; value: string };

function splitIntoSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(WORD_REGEX)) {
    const word = match[0];
    const start = match.index!;

    // Add preceding text
    if (start > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, start) });
    }

    // Check if highlightable
    if (STOPWORDS.has(word.toLowerCase())) {
      segments.push({ type: "text", value: word });
    } else {
      segments.push({ type: "word", value: word });
    }

    lastIndex = start + word.length;
  }

  // Trailing text
  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  return segments;
}

type Props = {
  text: string;
  onWordClick: (word: string, rect: DOMRect) => void;
  savedWords?: Set<string>;
};

export const HighlightedText = memo(function HighlightedText({
  text,
  onWordClick,
  savedWords,
}: Props) {
  const segments = useMemo(() => splitIntoSegments(text), [text]);

  const handleClick = useCallback(
    (e: MouseEvent<HTMLSpanElement>) => {
      const word = e.currentTarget.dataset.word;
      if (word) {
        onWordClick(word, e.currentTarget.getBoundingClientRect());
      }
    },
    [onWordClick],
  );

  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === "text") return seg.value;

        const isSaved = savedWords?.has(seg.value.toLowerCase()) ?? false;

        return (
          <span
            key={i}
            data-word={seg.value.toLowerCase()}
            onClick={handleClick}
            style={{
              cursor: "pointer",
              textDecorationLine: "underline",
              textDecorationStyle: "dotted",
              textDecorationColor: isSaved ? "var(--accent)" : "var(--text-muted)",
              textUnderlineOffset: 3,
              textDecorationThickness: 1,
              transition: "text-decoration-color 0.2s",
            }}
          >
            {seg.value}
          </span>
        );
      })}
    </>
  );
});
