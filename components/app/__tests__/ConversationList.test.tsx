import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { ConversationList, truncateTitle } from "../ConversationList";

const threads = [
  { id: "1", title: "Thread one", updatedAt: new Date().toISOString(), personaId: "simon" },
  { id: "2", title: "Thread two", updatedAt: new Date().toISOString(), personaId: "simon" },
];

describe("ConversationList", () => {
  it("renders all thread titles", () => {
    render(
      <ConversationList
        conversations={threads}
        activeId={null}

        onNew={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("Thread one")).toBeInTheDocument();
    expect(screen.getByText("Thread two")).toBeInTheDocument();
  });

  it("renders conversation items as links with correct hrefs", () => {
    render(
      <ConversationList
        conversations={threads}
        activeId={null}
        onNew={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    const link = screen.getByText("Thread one").closest("a");
    expect(link).toHaveAttribute("href", "/english-chatbot/1");
  });

  it("calls onNew when the New chat button is clicked", () => {
    const onNew = vi.fn();
    render(
      <ConversationList
        conversations={[]}
        activeId={null}

        onNew={onNew}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /new chat/i }));
    expect(onNew).toHaveBeenCalled();
  });

  it("shows empty state text when there are no conversations", () => {
    render(
      <ConversationList
        conversations={[]}
        activeId={null}

        onNew={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText(/no conversations yet/i)).toBeInTheDocument();
  });

  it("renders a long title truncated with ellipsis in the sidebar", () => {
    const longTitle = "A".repeat(41); // 41 chars — over limit
    render(
      <ConversationList
        conversations={[{ id: "1", title: longTitle, updatedAt: new Date().toISOString(), personaId: "simon" }]}
        activeId={null}

        onNew={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("A".repeat(40) + "…")).toBeInTheDocument();
    expect(screen.queryByText(longTitle)).not.toBeInTheDocument();
  });

  it("renders a short title without truncation", () => {
    const shortTitle = "Short title"; // under 40 chars
    render(
      <ConversationList
        conversations={[{ id: "1", title: shortTitle, updatedAt: new Date().toISOString(), personaId: "simon" }]}
        activeId={null}

        onNew={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText(shortTitle)).toBeInTheDocument();
  });

  it("renders a title of exactly 40 chars without truncation", () => {
    const exactTitle = "B".repeat(40); // exactly at limit — should NOT truncate
    render(
      <ConversationList
        conversations={[{ id: "1", title: exactTitle, updatedAt: new Date().toISOString(), personaId: "simon" }]}
        activeId={null}

        onNew={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText(exactTitle)).toBeInTheDocument();
    expect(screen.queryByText("B".repeat(40) + "…")).not.toBeInTheDocument();
  });
});

describe("truncateTitle", () => {
  it("returns truncated text and truncated=true when title exceeds 40 chars", () => {
    const result = truncateTitle("A".repeat(41));
    expect(result.text).toBe("A".repeat(40) + "…");
    expect(result.truncated).toBe(true);
  });

  it("returns full text and truncated=false when title is exactly 40 chars", () => {
    const result = truncateTitle("A".repeat(40));
    expect(result.text).toBe("A".repeat(40));
    expect(result.truncated).toBe(false);
  });

  it("returns full text and truncated=false when title is under 40 chars", () => {
    const result = truncateTitle("Hello");
    expect(result.text).toBe("Hello");
    expect(result.truncated).toBe(false);
  });

  it("respects a custom max parameter", () => {
    const result = truncateTitle("Hello world", 5);
    expect(result.text).toBe("Hello…");
    expect(result.truncated).toBe(true);
  });
});
