import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { ConversationList } from "./ConversationList";

const threads = [
  { id: "1", title: "Thread one", updatedAt: new Date().toISOString() },
  { id: "2", title: "Thread two", updatedAt: new Date().toISOString() },
];

describe("ConversationList", () => {
  it("renders all thread titles", () => {
    render(
      <ConversationList
        conversations={threads}
        activeId={null}
        onSelect={vi.fn()}
        onNew={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("Thread one")).toBeInTheDocument();
    expect(screen.getByText("Thread two")).toBeInTheDocument();
  });

  it("calls onSelect with the thread id when a thread is clicked", () => {
    const onSelect = vi.fn();
    render(
      <ConversationList
        conversations={threads}
        activeId={null}
        onSelect={onSelect}
        onNew={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Thread one"));
    expect(onSelect).toHaveBeenCalledWith("1");
  });

  it("calls onNew when the New chat button is clicked", () => {
    const onNew = vi.fn();
    render(
      <ConversationList
        conversations={[]}
        activeId={null}
        onSelect={vi.fn()}
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
        onSelect={vi.fn()}
        onNew={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText(/no conversations yet/i)).toBeInTheDocument();
  });
});
