"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useChatConversations } from "@/app/(app)/english-chatbot/_components/ChatConversationProvider";
import type { PageMessage } from "@/app/(app)/english-chatbot/_components/ChatMessage";
import { api } from "@/lib/api-client";
import { deriveTitle } from "@/lib/chat/derive-title";
import { parseAssistantStream } from "@/lib/chat/parse-assistant-stream";
import { DEFAULT_PERSONA_ID, PERSONAS } from "@/lib/chat/personas";
import type { ChatMessage as AppChatMessage } from "@/lib/chat/types";

const CHAT_ERROR_MESSAGE = "Gia sư đang gặp lỗi kỹ thuật. Bạn thử lại sau nhé.";

// ── Module-level state (survives component remounts) ──
let _justCreatedConvId: string | null = null;
let _isSending = false;
let _pendingMessages: PageMessage[] | null = null;

/**
 * Module-level setMessages ref — always points to the CURRENT component's setter.
 * This is critical: when router.replace() remounts the component, the old closure's
 * setMessages writes to a dead state. By using this ref, the streaming loop always
 * writes to the live component's state.
 */
let _setMessagesFn: React.Dispatch<React.SetStateAction<PageMessage[]>> | null = null;
let _setIsLoadingFn: React.Dispatch<React.SetStateAction<boolean>> | null = null;
let _setErrorFn: React.Dispatch<React.SetStateAction<string | null>> | null = null;

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
  const { conversations, setConversations, loadConversations } = useChatConversations();

  const [messages, setMessages] = useState<PageMessage[]>(() => {
    // Restore pending messages if we're remounting after router.replace()
    if (_pendingMessages) {
      const restored = _pendingMessages;
      _pendingMessages = null;
      return restored;
    }
    return [];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(_isSending);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Keep module-level refs pointing to the CURRENT component's setters ──
  // Assigned in an effect (NOT during render) so render stays pure. useState
  // setters are stable, so this effectively runs on mount; after a
  // router.replace() remount the new instance repoints these refs, letting the
  // in-flight streaming loop keep writing to the live component. Until the
  // effect runs, every consumer falls back to the local setter (`_setX ?? setX`).
  useEffect(() => {
    _setMessagesFn = setMessages;
    _setIsLoadingFn = setIsLoading;
    _setErrorFn = setError;
  }, []);

  const abortCtrlRef = useRef<AbortController | null>(null);
  const lastSendRef = useRef<string | null>(null);
  const lastVoiceTextRef = useRef<string | null>(null);
  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;

  // ── Load messages when conversationId changes ──
  useEffect(() => {
    if (!conversationId) {
      // Don't clear messages if we're in the middle of sending
      if (!_isSending) {
        setMessages([]);
        setError(null);
      }
      return;
    }

    // Skip loading if we just created this conversation in send()
    if (_justCreatedConvId === conversationId) {
      _justCreatedConvId = null;
      return;
    }

    // Skip loading if we're currently sending (race condition guard)
    if (_isSending) {
      return;
    }

    let cancelled = false;
    // Don't clear messages immediately — keep old messages visible
    // until new ones arrive for smooth transition
    setIsLoadingMessages(true);
    setError(null);
    (async () => {
      try {
        const rows = await api.get<
          Array<{ id: string; role: "user" | "assistant"; content: string }>
        >(`/conversations/${conversationId}/messages`);
        if (cancelled) return;
        // Atomic swap — old messages replaced in one render
        setMessages(rows.map((r) => ({ id: r.id, role: r.role, text: r.content })));
      } catch {
        if (!cancelled) {
          setMessages([]);
          setError("Không thể tải cuộc trò chuyện này.");
        }
      } finally {
        if (!cancelled) setIsLoadingMessages(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // ── Remove empty assistant placeholder on error ──
  const removeEmptyAssistantMessage = useCallback((messageId: string) => {
    // Use module-level ref to ensure we write to the LIVE component
    const setter = _setMessagesFn ?? setMessages;
    setter((curr) =>
      curr.filter((m) => m.id !== messageId || (m.role !== "divider" && m.text.trim().length > 0)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Send message ──
  const send = useCallback(
    async (text?: string, overrideMessages?: PageMessage[]) => {
      const t = (text ?? input).trim();
      if (!t || isLoading) return;

      // History the new turn is appended to. `regenerate` passes an explicit
      // sliced array; without this, send() would read a stale `messages` closure.
      const baseMessages = overrideMessages ?? messages;

      // Set module-level guard BEFORE any async work
      _isSending = true;

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
          _justCreatedConvId = created.id;
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

      const requestMessages = [...baseMessages, userMessage].filter(
        (m): m is AppChatMessage => m.role === "user" || m.role === "assistant",
      );
      const isFirstExchange = baseMessages.length === 0;

      // Build the new messages array including user + assistant placeholder
      const newMessages: PageMessage[] = [
        ...baseMessages,
        userMessage,
        { id: assistantMessageId, role: "assistant" as const, text: "" },
      ];

      // Set pending messages BEFORE router.replace so they survive remount
      if (_justCreatedConvId) {
        _pendingMessages = newMessages;
      }

      // Use module-level setter to ensure state writes survive remounts
      const liveSetMessages = () => _setMessagesFn ?? setMessages;
      const liveSetIsLoading = () => _setIsLoadingFn ?? setIsLoading;
      const liveSetError = () => _setErrorFn ?? setError;

      liveSetMessages()(newMessages);
      setInput("");
      liveSetError()(null);
      liveSetIsLoading()(true);
      lastSendRef.current = t;

      // Navigate AFTER setting state
      if (_justCreatedConvId) {
        router.replace(`/english-chatbot/${_justCreatedConvId}`, { scroll: false });
      }

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
              // Always use the LIVE component's setter
              (_setMessagesFn ?? setMessages)((curr) =>
                curr.map((m) => (m.id === assistantMessageId ? { ...m, text: m.text + delta } : m)),
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
              (_setErrorFn ?? setError)(msg);
              removeEmptyAssistantMessage(assistantMessageId);
            },
            onPersistError: (msg) => {
              (_setErrorFn ?? setError)(msg);
            },
          },
          controller.signal,
        );
      } catch (streamError) {
        if (!controller.signal.aborted) {
          console.error("Chat stream error:", streamError);
          (_setErrorFn ?? setError)(CHAT_ERROR_MESSAGE);
          removeEmptyAssistantMessage(assistantMessageId);
        }
      } finally {
        abortCtrlRef.current = null;
        _isSending = false;
        _pendingMessages = null;
        (_setIsLoadingFn ?? setIsLoading)(false);
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
    // Drop the last user turn and everything after it, then re-send that text
    // against the trimmed history (passed explicitly to avoid a stale closure).
    const base = messages.slice(0, lastUserIdx);
    void send(last.text, base);
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
