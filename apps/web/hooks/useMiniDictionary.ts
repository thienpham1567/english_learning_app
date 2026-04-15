"use client";

import { useState, useCallback } from "react";

type MiniDictionaryState = {
  word: string;
  anchorRect: DOMRect | null;
  visible: boolean;
};

export function useMiniDictionary() {
  const [state, setState] = useState<MiniDictionaryState>({
    word: "",
    anchorRect: null,
    visible: false,
  });

  const openForWord = useCallback((word: string, rect: DOMRect) => {
    setState({ word: word.trim().toLowerCase(), anchorRect: rect, visible: true });
  }, []);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  return { ...state, openForWord, close };
}
