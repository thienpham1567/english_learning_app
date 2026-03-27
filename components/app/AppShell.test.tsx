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
    renderUi(
      <AppShell user={{ name: "Cô Lành", image: null }}>
        <div>Trang nội dung</div>
      </AppShell>,
    );

    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("user-menu")).toHaveTextContent("Cô Lành");
    expect(screen.getByRole("main")).toHaveTextContent("Trang nội dung");
  });
});
