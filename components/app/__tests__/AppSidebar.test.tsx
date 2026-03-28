import { screen, fireEvent } from "@testing-library/react";
import { expect, it, vi, describe } from "vitest";

import { AppSidebar } from "@/components/app/AppSidebar";
import { renderUi } from "@/test/render";

vi.mock("next/navigation", () => ({
  usePathname: () => "/english-chatbot",
}));

describe("AppSidebar", () => {
  it("renders all Vietnamese nav labels when expanded", () => {
    renderUi(<AppSidebar isExpanded={true} onToggle={vi.fn()} />);
    expect(screen.getByRole("link", { name: "Trò chuyện" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Từ điển" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Từ vựng" })).toBeInTheDocument();
  });

  it("nav links have focus-visible outline classes", () => {
    renderUi(<AppSidebar isExpanded={true} onToggle={vi.fn()} />);
    expect(screen.getByRole("link", { name: "Trò chuyện" })).toHaveClass(
      "focus-visible:outline",
      "focus-visible:outline-2",
      "focus-visible:outline-offset-2",
      "focus-visible:outline-[var(--accent)]",
    );
  });

  it("has glass background classes", () => {
    const { container } = renderUi(<AppSidebar isExpanded={false} onToggle={vi.fn()} />);
    expect(container.firstElementChild).toHaveClass("bg-white/80", "backdrop-blur-md");
  });

  it("has w-[72px] class when collapsed", () => {
    const { container } = renderUi(<AppSidebar isExpanded={false} onToggle={vi.fn()} />);
    expect(container.firstElementChild).toHaveClass("w-[72px]");
    expect(container.firstElementChild).not.toHaveClass("w-[264px]");
  });

  it("has w-[264px] class when expanded", () => {
    const { container } = renderUi(<AppSidebar isExpanded={true} onToggle={vi.fn()} />);
    expect(container.firstElementChild).toHaveClass("w-[264px]");
    expect(container.firstElementChild).not.toHaveClass("w-[72px]");
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

  it("has the 920px responsive mobile layout classes", () => {
    const { container } = renderUi(<AppSidebar isExpanded={false} onToggle={vi.fn()} />);
    expect(container.firstElementChild).toHaveClass(
      "sticky",
      "top-0",
      "z-50",
      "flex",
      "h-screen",
      "flex-col",
      "gap-2",
      "overflow-hidden",
      "border-r",
      "px-4",
      "py-5",
      "transition-[width]",
      "duration-300",
      "max-[920px]:relative",
      "max-[920px]:h-auto",
      "max-[920px]:w-full",
      "max-[920px]:flex-row",
      "max-[920px]:border-r-0",
      "max-[920px]:border-b",
      "max-[920px]:px-4",
      "max-[920px]:py-3",
      "max-[920px]:gap-4",
      "max-[920px]:items-center",
    );
    expect(screen.getByRole("navigation", { name: "Các mục trong ứng dụng" })).toHaveClass(
      "flex",
      "flex-col",
      "gap-2",
      "pt-2",
      "max-[920px]:ml-auto",
      "max-[920px]:flex-row",
      "max-[920px]:gap-[6px]",
      "max-[920px]:p-0",
      "max-[920px]:pt-0",
      "max-[920px]:w-auto",
    );
  });
});
