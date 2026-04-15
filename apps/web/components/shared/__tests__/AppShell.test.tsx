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

    expect(container.firstElementChild).toHaveClass(
      "grid",
      "h-screen",
      "max-h-screen",
      "min-h-screen",
      "overflow-y-auto",
      "grid-cols-[72px_minmax(0,1fr)]",
      "grid-rows-[minmax(0,1fr)]",
      "max-[920px]:h-dvh",
      "max-[920px]:max-h-dvh",
      "max-[920px]:min-h-dvh",
      "max-[920px]:grid-cols-1",
      "max-[920px]:grid-rows-[auto_minmax(0,1fr)]",
    );
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("user-menu")).toHaveTextContent("Cô Lành");
    expect(screen.getByTestId("breadcrumb")).toBeInTheDocument();
    expect(container.firstElementChild?.firstElementChild?.nextElementSibling).toHaveClass(
      "flex",
      "min-w-0",
      "min-h-0",
      "flex-col",
    );
    expect(screen.getByRole("banner")).toHaveClass(
      "relative",
      "z-120",
      "overflow-visible",
      "flex",
      "h-13",
      "shrink-0",
      "items-center",
      "justify-between",
      "border-b",
      "border-white/30",
      "bg-white/70",
      "backdrop-blur-xl",
      "px-5",
      "max-[920px]:h-12",
      "max-[920px]:px-4",
    );
    expect(screen.getByRole("main")).toHaveClass(
      "flex",
      "min-h-0",
      "flex-1",
      "flex-col",
      "overflow-y-auto",
    );
    expect(screen.getByRole("main")).not.toHaveClass("px-4", "py-6", "md:px-8", "md:py-8");
    expect(screen.getByRole("main")).toHaveTextContent("Trang nội dung");
  });
});
