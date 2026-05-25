import ReactDOM from "react-dom/client";
import { Tooltip } from "@/components/Tooltip";
import {
  getSelectedText,
  classifySelection,
  getSurroundingContext,
  getSelectionRect,
} from "@/lib/selection";
import "@/styles/tooltip.module.css";

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",

  async main(ctx) {
    let currentUi: ReturnType<typeof createShadowRootUi> extends Promise<
      infer T
    >
      ? T
      : never;
    let reactRoot: ReactDOM.Root | null = null;

    // ── Cleanup function ─────────────────────────────────────────────────

    function cleanup() {
      if (reactRoot) {
        reactRoot.unmount();
        reactRoot = null;
      }
      if (currentUi) {
        currentUi.remove();
        // @ts-expect-error - resetting reference
        currentUi = null;
      }
    }

    // ── Show tooltip ─────────────────────────────────────────────────────

    async function showTooltip(text: string, forceType?: "word" | "sentence") {
      cleanup();

      const rect = getSelectionRect();
      if (!rect) return;

      const type = forceType || classifySelection(text);
      const context =
        type === "sentence" ? getSurroundingContext() : "";

      const position = {
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      };

      const ui = await createShadowRootUi(ctx, {
        name: "english-companion-tooltip",
        position: "overlay",
        zIndex: 2147483647,
        onMount(container) {
          const app = document.createElement("div");
          container.append(app);

          const root = ReactDOM.createRoot(app);
          root.render(
            <Tooltip
              text={text}
              type={type}
              context={context}
              position={{
                top: rect.bottom,
                left: rect.left,
              }}
              onClose={cleanup}
            />
          );

          reactRoot = root;
          return root;
        },
        onRemove(root) {
          root?.unmount();
          reactRoot = null;
        },
      });

      currentUi = ui;
      ui.mount();
    }

    // ── Mouse selection listener ─────────────────────────────────────────

    let selectionTimeout: ReturnType<typeof setTimeout> | null = null;

    document.addEventListener("mouseup", (e) => {
      // Don't trigger if clicking inside our own tooltip
      if (
        e.target instanceof HTMLElement &&
        e.target.closest("english-companion-tooltip")
      ) {
        return;
      }

      if (selectionTimeout) clearTimeout(selectionTimeout);

      selectionTimeout = setTimeout(() => {
        const text = getSelectedText();
        if (text.length >= 2 && text.length <= 500) {
          showTooltip(text);
        }
      }, 300);
    });

    // ── Click outside to dismiss ─────────────────────────────────────────

    document.addEventListener("mousedown", (e) => {
      if (
        currentUi &&
        e.target instanceof HTMLElement &&
        !e.target.closest("english-companion-tooltip")
      ) {
        cleanup();
      }
    });

    // ── Escape key to dismiss ────────────────────────────────────────────

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && currentUi) {
        cleanup();
      }
    });

    // ── Messages from background (context menu, keyboard shortcut) ──────

    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === "KEYBOARD_LOOKUP") {
        const text = getSelectedText();
        if (text.length >= 2) {
          showTooltip(text);
        }
      } else if (message.type === "CONTEXT_MENU_LOOKUP") {
        showTooltip(message.text, "word");
      } else if (message.type === "CONTEXT_MENU_TRANSLATE") {
        showTooltip(message.text, "sentence");
      }
    });
  },
});
