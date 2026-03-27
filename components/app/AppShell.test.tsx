import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { AppShell } from "@/components/app/AppShell";
import { renderUi } from "@/test/render";

vi.mock("@/components/app/AppSidebar", () => ({
  AppSidebar: () => <nav data-testid="sidebar">Sidebar</nav>,
}));

vi.mock("@/components/app/UserMenu", () => ({
  UserMenu: ({ user }: { user: { name: string } }) => (
    <div data-testid="user-menu">{user.name}</div>
  ),
}));

describe("AppShell", () => {
  it("renders the shell chrome and page content", () => {
    const { container } = renderUi(
      <AppShell user={{ name: "Cô Lành", image: null }}>
        <div>Trang nội dung</div>
      </AppShell>,
    );

    expect(container.firstElementChild).toHaveClass(
      "grid",
      "min-h-screen",
      "grid-cols-[72px_minmax(0,1fr)]",
      "grid-rows-[minmax(0,1fr)]",
      "max-[920px]:min-h-dvh",
      "max-[920px]:grid-cols-1",
      "max-[920px]:grid-rows-[auto_minmax(0,1fr)]",
    );
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("user-menu")).toHaveTextContent("Cô Lành");
    expect(screen.getByRole("banner")).toHaveClass(
      "flex",
      "h-[52px]",
      "shrink-0",
      "items-center",
      "justify-end",
      "border-b",
      "border-[var(--border)]",
      "bg-[var(--surface)]",
      "px-5",
      "max-[920px]:px-4",
    );
    expect(screen.getByRole("main")).toHaveClass(
      "flex",
      "min-h-0",
      "flex-1",
      "flex-col",
      "overflow-hidden",
    );
    expect(screen.getByRole("main")).not.toHaveClass("px-4", "py-6", "md:px-8", "md:py-8");
    expect(screen.getByRole("main")).toHaveTextContent("Trang nội dung");
  });
});
