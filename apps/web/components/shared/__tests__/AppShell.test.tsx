import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { AppShell } from "@/components/shared/AppShell";
import { renderUi } from "@/test/render";

vi.mock("@/components/shared/AppSidebar", () => ({
  AppSidebar: () => <nav data-testid="sidebar">Sidebar</nav>,
}));

vi.mock("@/components/shared/UserMenu", () => ({
  UserMenu: ({ user }: { user: { name: string } }) => (
    <div data-testid="user-menu">{user.name}</div>
  ),
}));

vi.mock("@/components/shared/ToolbarBreadcrumb", () => ({
  ToolbarBreadcrumb: () => <div data-testid="breadcrumb">Breadcrumb</div>,
}));

const localStorageMock = (() => {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("AppShell", () => {
  it("renders the shell chrome and page content", () => {
    const { container } = renderUi(
      <AppShell user={{ name: "Cô Lành", image: null }}>
        <div>Trang nội dung</div>
      </AppShell>,
    );

    expect(container.firstElementChild).toHaveStyle({
      display: "flex",
      minHeight: "100vh",
      maxHeight: "100vh",
      overflow: "hidden",
    });
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("user-menu")).toHaveTextContent("Cô Lành");
    expect(screen.getByTestId("breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("banner").parentElement).toHaveStyle({
      display: "flex",
      flex: "1 1 0%",
    });
    const headerStyle = screen.getByRole("banner").getAttribute("style") ?? "";
    expect(headerStyle).toContain("display: flex");
    expect(headerStyle).toContain("align-items: center");
    expect(headerStyle).toContain("justify-content: space-between");
    expect(headerStyle).toContain("height: 52px");
    expect(headerStyle).toContain("border-bottom: 1px solid var(--border)");
    expect(headerStyle).toContain("background: var(--surface)");

    const mainStyle = screen.getByRole("main").getAttribute("style") ?? "";
    expect(mainStyle).toContain("display: flex");
    expect(mainStyle).toContain("flex-direction: column");
    expect(mainStyle).toContain("overflow: hidden");
    expect(mainStyle).toContain("padding: 24px");
    expect(mainStyle).toContain("min-height: 0");
    expect(screen.getByRole("main")).toHaveTextContent("Trang nội dung");
  });
});
