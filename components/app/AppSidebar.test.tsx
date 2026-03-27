import { screen } from "@testing-library/react";
import { expect, it, vi, describe } from "vitest";

import { AppSidebar } from "@/components/app/AppSidebar";
import { renderUi } from "@/test/render";

vi.mock("next/navigation", () => ({
  usePathname: () => "/english-chatbot",
}));

describe("AppSidebar", () => {
  it("renders the Vietnamese sidebar labels", () => {
    renderUi(<AppSidebar />);

    expect(screen.getByRole("link", { name: "Trò chuyện" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Từ điển" })).toBeInTheDocument();
  });

  it("uses the 920px responsive mobile layout classes", () => {
    const { container } = renderUi(<AppSidebar />);

    expect(container.firstElementChild).toHaveClass(
      "group/sidebar",
      "sticky",
      "top-0",
      "flex",
      "h-screen",
      "w-[72px]",
      "flex-col",
      "gap-2",
      "overflow-hidden",
      "border-r",
      "border-[var(--border)]",
      "bg-[var(--surface)]",
      "px-4",
      "py-5",
      "transition-[width]",
      "duration-300",
      "hover:w-[264px]",
      "hover:shadow-[var(--shadow-lg)]",
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

    expect(screen.getByText("Trò chuyện")).toHaveClass(
      "whitespace-nowrap",
      "opacity-0",
      "transition",
      "duration-200",
      "group-hover/sidebar:opacity-100",
      "max-[920px]:opacity-100",
      "max-[920px]:translate-x-0",
      "max-[920px]:text-[13px]",
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
