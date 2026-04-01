"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { applyFuelSseEvent } from "@/lib/fuel-prices/timeline";
import { buildFuelChatHistory } from "@/lib/fuel-prices/history";
import type { FuelChatTurn, FuelSseEventPayload } from "@/lib/fuel-prices/types";

const ERROR_MESSAGE = "Hệ thống đang gặp sự cố kỹ thuật. Vui lòng thử lại sau!";

function parseSsePayloads(chunk: string) {
  return chunk
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .filter(Boolean);
}

export function useFuelChat() {
  const [messages, setMessages] = useState<FuelChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [discordWebhookUrl, setDiscordWebhookUrl] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("fuelChatDiscordWebhookUrl") || "";
    }
    return "";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("fuelChatDiscordWebhookUrl", discordWebhookUrl);
    }
  }, [discordWebhookUrl]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const lastMsg = messages.at(-1);
  const streamingHasStarted =
    isLoading &&
    lastMsg?.role === "assistant" &&
    lastMsg.run.tools.length > 0;

  useEffect(() => {
    const bottom = bottomRef.current;
    if (
      isNearBottomRef.current &&
      bottom &&
      typeof bottom.scrollIntoView === "function"
    ) {
      bottom.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, error]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distFromBottom < 80;
    setShowScrollBtn(distFromBottom > 200);
  }, []);

  const scrollToBottom = useCallback(() => {
    isNearBottomRef.current = true;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const send = useCallback(
    async (text?: string) => {
      const t = (text ?? input).trim();
      if (!t || isLoading) return;

      const userMessage: FuelChatTurn = {
        id: crypto.randomUUID(),
        role: "user",
        text: t,
      };
      const assistantMessageId = crypto.randomUUID();
      const assistantTurn: FuelChatTurn = {
        id: assistantMessageId,
        role: "assistant",
        run: { status: "pending", tools: [] },
      };
      const allMessages = [...messages, userMessage];

      setMessages((curr) => [...curr, userMessage, assistantTurn]);
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      setError(null);
      setIsLoading(true);

      try {
        const response = await fetch("/api/fuel-prices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: buildFuelChatHistory(allMessages),
            discordWebhookUrl: discordWebhookUrl || undefined,
          }),
        });

        if (!response.ok || !response.body) throw new Error(ERROR_MESSAGE);

        await processSseStream(
          response.body,
          assistantMessageId,
          setMessages,
          setError,
        );
      } catch (streamError) {
        console.error("Fuel price chat error:", streamError);
        setError(ERROR_MESSAGE);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages, discordWebhookUrl],
  );

  return {
    messages,
    input,
    isLoading,
    error,
    showScrollBtn,
    streamingHasStarted,
    discordWebhookUrl,
    hasMessages: messages.length > 0,
    bottomRef,
    textareaRef,
    scrollContainerRef,
    setInput,
    send,
    handleScroll,
    scrollToBottom,
    autoResize,
    clearError,
    setDiscordWebhookUrl,
  };
}

async function processSseStream(
  body: ReadableStream<Uint8Array>,
  assistantMessageId: string,
  setMessages: React.Dispatch<React.SetStateAction<FuelChatTurn[]>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finished = false;

  while (!finished) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    let eventBoundary = buffer.indexOf("\n\n");

    while (eventBoundary !== -1) {
      const rawEvent = buffer.slice(0, eventBoundary);
      buffer = buffer.slice(eventBoundary + 2);

      for (const payload of parseSsePayloads(rawEvent)) {
        const event = JSON.parse(payload) as FuelSseEventPayload;

        setMessages((curr) => applyFuelSseEvent(curr, assistantMessageId, event));

        if (event.type === "run_error") {
          setError(event.message);
          finished = true;
        }

        if (event.type === "run_done") {
          finished = true;
        }
      }

      eventBoundary = buffer.indexOf("\n\n");
    }
  }
}
