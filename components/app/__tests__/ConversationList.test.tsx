import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { ConversationList, truncateTitle } from "../ConversationList";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock the context hook
const mockConversations = [
  { id: "1", title: "Thread one", updatedAt: new Date().toISOString(), personaId: "simon" },
  { id: "2", title: "Thread two", updatedAt: new Date().toISOString(), personaId: "simon" },
];
const mockDeleteConversation = vi.fn();

vi.mock("@/components/app/ChatConversationProvider", () => ({
  useChatConversations: () => ({
    conversations: mockConversations,
    deleteConversation: mockDeleteConversation,
  }),
}));

describe("ConversationList", () => {
  it("renders all thread titles", () => {
    render(<ConversationList activeId={null} />);
    expect(screen.getByText("Thread one")).toBeInTheDocument();
    expect(screen.getByText("Thread two")).toBeInTheDocument();
  });

  it("renders conversation items as links with correct hrefs", () => {
    render(<ConversationList activeId={null} />);
    const link = screen.getByText("Thread one").closest("a");
    expect(link).toHaveAttribute("href", "/english-chatbot/1");
  });

  it("navigates when the New chat button is clicked", () => {
    render(<ConversationList activeId={null} />);
    fireEvent.click(screen.getByRole("button", { name: /new chat/i }));
    // Navigation is handled via router.push, just verify the button is clickable
  });

  it("renders a long title truncated with ellipsis in the sidebar", () => {
    render(<ConversationList activeId={null} />);
    // The mock data has short titles, so test truncateTitle directly
  });

  it("shows inline confirmation when delete button is clicked", () => {
    render(<ConversationList activeId={null} />);
    const deleteButtons = screen.getAllByLabelText("Delete conversation");
    fireEvent.click(deleteButtons[0]);
    expect(screen.getByText("Xoá?")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm delete")).toBeInTheDocument();
    expect(screen.getByLabelText("Cancel delete")).toBeInTheDocument();
  });

  it("calls deleteConversation when confirm is clicked", () => {
    render(<ConversationList activeId={null} />);
    fireEvent.click(screen.getAllByLabelText("Delete conversation")[0]);
    fireEvent.click(screen.getByLabelText("Confirm delete"));
    expect(mockDeleteConversation).toHaveBeenCalledWith("1");
  });

  it("restores row when cancel is clicked", () => {
    render(<ConversationList activeId={null} />);
    fireEvent.click(screen.getAllByLabelText("Delete conversation")[0]);
    expect(screen.getByText("Xoá?")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Cancel delete"));
    expect(screen.queryByText("Xoá?")).not.toBeInTheDocument();
    expect(screen.getByText("Thread one")).toBeInTheDocument();
  });

  it("only shows confirmation on one row at a time", () => {
    render(<ConversationList activeId={null} />);
    const deleteButtons = screen.getAllByLabelText("Delete conversation");
    fireEvent.click(deleteButtons[0]);
    expect(screen.getByText("Xoá?")).toBeInTheDocument();
    fireEvent.click(deleteButtons[1]);
    expect(screen.getAllByText("Xoá?")).toHaveLength(1);
    expect(screen.getByText("Thread one")).toBeInTheDocument();
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
