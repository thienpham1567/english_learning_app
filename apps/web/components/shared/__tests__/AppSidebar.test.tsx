import { screen, fireEvent } from "@testing-library/react";
import { expect, it, vi, describe } from "vitest";

import { AppSidebar } from "@/components/shared/AppSidebar";
import { renderUi } from "@/test/render";

vi.mock("next/navigation", () => ({
  usePathname: () => "/english-chatbot",
}));

vi.mock("@/hooks/useSidebarBadges", () => ({
  useSidebarBadges: () => null,
}));

vi.stubGlobal("localStorage", {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
});

describe("AppSidebar", () => {
  it("renders all Vietnamese nav labels when expanded", () => {
    renderUi(<AppSidebar isExpanded={true} onToggle={vi.fn()} />);
    expect(screen.getByRole("link", { name: /Trò chuyện/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Từ điển/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Luyện nghe/ })).toBeInTheDocument();
  });

  it("marks the active nav link", () => {
    renderUi(<AppSidebar isExpanded={true} onToggle={vi.fn()} />);
    expect(screen.getByRole("link", { name: /Trò chuyện/ })).toHaveAttribute("aria-current", "page");
  });

  it("uses the sidebar surface styling", () => {
    const { container } = renderUi(<AppSidebar isExpanded={false} onToggle={vi.fn()} />);
    expect(container.firstElementChild).toHaveStyle({
      position: "sticky",
      top: "0px",
      background: "var(--sidebar-bg)",
      borderRight: "1px solid rgba(255,255,255,0.1)",
    });
  });

  it("has 72px width when collapsed", () => {
    const { container } = renderUi(<AppSidebar isExpanded={false} onToggle={vi.fn()} />);
    expect(container.firstElementChild).toHaveStyle({ width: "72px" });
  });

  it("has 264px width when expanded", () => {
    const { container } = renderUi(<AppSidebar isExpanded={true} onToggle={vi.fn()} />);
    expect(container.firstElementChild).toHaveStyle({ width: "264px" });
  });

  it("shows expand button when collapsed and calls onToggle on click", () => {
    const onToggle = vi.fn();
    renderUi(<AppSidebar isExpanded={false} onToggle={onToggle} />);
    const btn = screen.getByRole("button", { name: "Expand sidebar" });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("shows collapse button when expanded and calls onToggle on click", () => {
    const onToggle = vi.fn();
    renderUi(<AppSidebar isExpanded={true} onToggle={onToggle} />);
    const btn = screen.getByRole("button", { name: "Collapse sidebar" });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("renders an application navigation region", () => {
    const { container } = renderUi(<AppSidebar isExpanded={false} onToggle={vi.fn()} />);
    expect(container.firstElementChild).toHaveStyle({ display: "flex", height: "100vh" });
    expect(screen.getByRole("navigation", { name: "Các mục trong ứng dụng" })).toHaveStyle({
      display: "flex",
      flexDirection: "column",
      overflow: "auto",
    });
  });
});
