import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SignInPage from "@/app/sign-in/page";
import { renderUi } from "@/test/render";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: {
      social: vi.fn(),
      email: vi.fn(),
    },
  },
}));

describe("SignInPage", () => {
  it("renders the Tailwind sign-in surface contract", () => {
    const { container } = renderUi(<SignInPage />);
    const pageShell = container.firstElementChild;
    const card = screen.getByRole("heading", { name: "Trợ lý học tập" }).closest("div");

    expect(pageShell).toHaveClass("flex", "min-h-screen", "items-center", "justify-center");
    expect(pageShell).not.toHaveClass("sign-in-page");
    expect(card).toHaveClass("w-full", "max-w-md", "rounded-[var(--radius-2xl)]", "border", "border-[var(--border)]", "bg-[rgba(255,255,255,0.92)]", "p-8", "shadow-[var(--shadow-lg)]", "backdrop-blur");
    expect(card).not.toHaveClass("sign-in-card");
    expect(screen.getByPlaceholderText("Tên đăng nhập")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đăng nhập bằng Google" })).toBeInTheDocument();
  });
});
