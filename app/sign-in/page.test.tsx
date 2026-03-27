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
  it("renders the sign-in form and Google action", () => {
    renderUi(<SignInPage />);

    expect(screen.getByRole("heading", { name: "Trợ lý học tập" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Tên đăng nhập")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đăng nhập bằng Google" })).toBeInTheDocument();
  });
});
