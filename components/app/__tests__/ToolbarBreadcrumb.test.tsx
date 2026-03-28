import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUsePathname = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

import { ToolbarBreadcrumb } from "../ToolbarBreadcrumb";

describe("ToolbarBreadcrumb", () => {
  beforeEach(() => {
    mockUsePathname.mockReset();
  });

  it("renders eyebrow and title for /english-chatbot", () => {
    mockUsePathname.mockReturnValue("/english-chatbot");
    render(<ToolbarBreadcrumb />);
    expect(screen.getByText("Trợ lý học tập")).toBeInTheDocument();
    expect(screen.getByText("Trò chuyện")).toBeInTheDocument();
  });

  it("renders eyebrow and title for /co-lanh-dictionary", () => {
    mockUsePathname.mockReturnValue("/co-lanh-dictionary");
    render(<ToolbarBreadcrumb />);
    expect(screen.getByText("Từ điển")).toBeInTheDocument();
    expect(screen.getByText("Cô Lãnh")).toBeInTheDocument();
  });

  it("renders eyebrow and title for /my-vocabulary", () => {
    mockUsePathname.mockReturnValue("/my-vocabulary");
    render(<ToolbarBreadcrumb />);
    expect(screen.getByText("Từ vựng của tôi")).toBeInTheDocument();
    expect(screen.getByText("Từ vựng")).toBeInTheDocument();
  });

  it("renders nothing for an unknown route", () => {
    mockUsePathname.mockReturnValue("/unknown-route");
    const { container } = render(<ToolbarBreadcrumb />);
    expect(container).toBeEmptyDOMElement();
  });
});
