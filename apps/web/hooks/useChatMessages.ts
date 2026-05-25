"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { PageMessage } from "@/app/(app)/english-chatbot/_components/ChatMessage";
import { useChatConversations } from "@/app/(app)/english-chatbot/_components/ChatConversationProvider";
import { deriveTitle } from "@/lib/chat/derive-title";
import { parseAssistantStream } from "@/lib/chat/parse-assistant-stream";
import { DEFAULT_PERSONA_ID, PERSONAS } from "@/lib/chat/personas";
import type { ChatMessage as AppChatMessage } from "@/lib/chat/types";
import { api } from "@/lib/api-client";

const CHAT_ERROR_MESSAGE = "Gia sư đang gặp lỗi kỹ thuật. Bạn thử lại sau nhé.";

export type UseChatMessagesOptions = {
  conversationId: string | null;
  selectedPersonaId: string;
  /** Called after send completes (success or failure) with the user message id + whether it was a voice message. */
  onSendComplete?: (opts: {
    userMessageId: string;
    userText: string;
    isVoiceMessage: boolean;
    assistantMessageId: string;
  }) => void;
};

export function useChatMessages({
  conversationId,
  selectedPersonaId,
  onSendComplete,
}: UseChatMessagesOptions) {
  const router = useRouter();
  const { conversations, setConversations, loadConversations } =
    useChatConversations();

  const [messages, setMessages] = useState<PageMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const justCreatedRef = useRef(false);
  const abortCtrlRef = useRef<AbortController | null>(null);
  const lastSendRef = useRef<string | null>(null);
  const lastVoiceTextRef = useRef<string | null>(null);
  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;

  // ── Load messages when conversationId changes ──
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setError(null);
      return;
    }

    if (justCreatedRef.current) {
      justCreatedRef.current = false;
      return;
    }

    let cancelled = false;
    setIsLoadingMessages(true);
    (async () => {
      try {
        const rows = await api.get<
          Array<{ id: string; role: "user" | "assistant"; content: string }>
        >(`/conversations/${conversationId}/messages`);
        if (cancelled) return;
        setMessages(
          rows.map((r) => ({ id: r.id, role: r.role, text: r.content })),
        );
        setError(null);
      } catch {
        if (!cancelled) setError("Không thể tải cuộc trò chuyện này.");
      } finally {
        if (!cancelled) setIsLoadingMessages(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  // ── Remove empty assistant placeholder on error ──
  const removeEmptyAssistantMessage = useCallback((messageId: string) => {
    setMessages((curr) =>
      curr.filter(
        (m) =>
          m.id !== messageId ||
          (m.role !== "divider" && m.text.trim().length > 0),
      ),
    );
  }, []);

  // ── Send message ──
  const send = useCallback(
    async (text?: string) => {
      const t = (text ?? input).trim();
      if (!t || isLoading) return;

      let convId = conversationId;
      if (!convId) {
        try {
          const created = await api.post<{
            id: string;
            title: string;
            personaId: string;
          }>("/conversations", {
            title: deriveTitle(t),
            personaId: selectedPersonaId,
          });
          convId = created.id;
          setConversations((curr) => [
            {
              id: created.id,
              title: created.title,
              updatedAt: new Date().toISOString(),
              personaId: created.personaId,
            },
            ...curr,
          ]);
          justCreatedRef.current = true;
          router.replace(`/english-chatbot/${created.id}`);
        } catch {
          // proceed without persistence
        }
      }

      const isVoiceMessage = lastVoiceTextRef.current === t;
      if (isVoiceMessage) lastVoiceTextRef.current = null;

      const userMessage: AppChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        text: t,
      };
      const assistantMessageId = crypto.randomUUID();

      const requestMessages = [...messages, userMessage].filter(
        (m): m is AppChatMessage => m.role === "user" || m.role === "assistant",
      );
      const isFirstExchange = messages.length === 0;

      setMessages((curr) => [
        ...curr,
        userMessage,
        { id: assistantMessageId, role: "assistant", text: "" },
      ]);
      setInput("");
      setError(null);
      setIsLoading(true);
      lastSendRef.current = t;

      const controller = new AbortController();
      abortCtrlRef.current = controller;

      try {
        const response = await api.post<Response>(
          "/chat",
          {
            messages: requestMessages,
            conversationId: convId,
            personaId: selectedPersonaId,
          },
          { raw: true, signal: controller.signal },
        );

        if (!response.body) throw new Error(CHAT_ERROR_MESSAGE);

        await parseAssistantStream(
          response,
          {
            onDelta: (delta) => {
              setMessages((curr) =>
                curr.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, text: m.text + delta }
                    : m,
                ),
              );
            },
            onDone: () => {
              if (convId) {
                loadConversations();
                if (isFirstExchange) {
                  api
                    .post(`/conversations/${convId}/title`)
                    .then(() => loadConversations())
                    .catch(() => {});
                }
              }
            },
            onError: (msg) => {
              setError(msg);
              removeEmptyAssistantMessage(assistantMessageId);
            },
            onPersistError: (msg) => {
              setError(msg);
            },
          },
          controller.signal,
        );
      } catch (streamError) {
        if (!controller.signal.aborted) {
          console.error("Chat stream error:", streamError);
          setError(CHAT_ERROR_MESSAGE);
          removeEmptyAssistantMessage(assistantMessageId);
        }
      } finally {
        abortCtrlRef.current = null;
        setIsLoading(false);
        onSendComplete?.({
          userMessageId: userMessage.id,
          userText: t,
          isVoiceMessage,
          assistantMessageId,
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [input, isLoading, conversationId, selectedPersonaId, messages],
  );

  const stopStreaming = useCallback(() => {
    abortCtrlRef.current?.abort();
  }, []);

  const regenerate = useCallback(() => {
    if (isLoading) return;
    const lastUserIdx = [...messages].map((m) => m.role).lastIndexOf("user");
    if (lastUserIdx < 0) return;
    const last = messages[lastUserIdx];
    if (last.role !== "user") return;
    setMessages((curr) => curr.slice(0, lastUserIdx));
    void send(last.text);
  }, [isLoading, messages, send]);

  const retryLast = useCallback(() => {
    const text = lastSendRef.current;
    if (!text || isLoading) return;
    setError(null);
    void send(text);
  }, [isLoading, send]);

  /** Mark a text as originating from voice input (call before send). */
  const markVoiceText = useCallback((text: string) => {
    lastVoiceTextRef.current = text;
  }, []);

  return {
    messages,
    setMessages,
    input,
    setInput,
    isLoading,
    isLoadingMessages,
    error,
    setError,
    send,
    stopStreaming,
    regenerate,
    retryLast,
    lastSendRef,
    markVoiceText,
  };
}
