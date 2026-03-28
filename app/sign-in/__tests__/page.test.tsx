import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SignInPage from "@/app/sign-in/page";
import { renderUi } from "@/test/render";

const authMocks = vi.hoisted(() => ({
  social: vi.fn(),
  email: vi.fn(),
}));

const searchParamsState = vi.hoisted(() => ({
  value: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParamsState.value,
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: {
      social: authMocks.social,
      email: authMocks.email,
    },
  },
}));

beforeEach(() => {
  authMocks.social.mockReset();
  authMocks.email.mockReset();
  searchParamsState.value = new URLSearchParams();
});

describe("SignInPage", () => {
  it("renders the hero heading and core form elements", () => {
    renderUi(<SignInPage />);

    const hero = screen.getByRole("heading", { name: "Xin chào" }).parentElement;

    expect(hero).toHaveClass("flex", "flex-col", "items-center", "text-center");
    expect(screen.getByRole("heading", { name: "Xin chào" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Tên đăng nhập")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đăng nhập bằng Google" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đăng nhập bằng Google" })).toHaveClass(
      "focus-visible:outline-2",
      "focus-visible:outline-offset-2",
      "focus-visible:outline-(--accent)",
    );
  });

  it("normalizes bare usernames before submitting email sign-in", async () => {
    authMocks.email.mockResolvedValue({ error: { message: "invalid" } });
    const user = userEvent.setup();

    renderUi(<SignInPage />);

    await user.type(screen.getByPlaceholderText("Tên đăng nhập"), "alice");
    await user.type(screen.getByPlaceholderText("Mật khẩu"), "secret");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(authMocks.email).toHaveBeenCalledWith({
      email: "alice@local.app",
      password: "secret",
    });
    expect(screen.getByText("Email hoặc mật khẩu không đúng.")).toBeInTheDocument();
  });

  it("invokes Google sign-in and keeps the form disabled while loading", async () => {
    authMocks.social.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(resolve, 0);
        }),
    );
    const user = userEvent.setup();

    renderUi(<SignInPage />);

    await user.click(screen.getByRole("button", { name: "Đăng nhập bằng Google" }));

    expect(authMocks.social).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "/english-chatbot",
    });
    expect(screen.getByPlaceholderText("Tên đăng nhập")).toBeDisabled();
    expect(screen.getByPlaceholderText("Mật khẩu")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Đang đăng nhập..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Đăng nhập bằng Google" })).toBeDisabled();
  });

  it("keeps the email submit button keyboard-accessible", async () => {
    const user = userEvent.setup();

    renderUi(<SignInPage />);

    await user.type(screen.getByPlaceholderText("Tên đăng nhập"), "alice");
    await user.type(screen.getByPlaceholderText("Mật khẩu"), "secret");

    expect(screen.getByRole("button", { name: "Đăng nhập" })).toHaveClass(
      "focus-visible:outline-2",
      "focus-visible:outline-offset-2",
      "focus-visible:outline-(--accent)",
    );
  });

  it("renders the query-param error banner", () => {
    searchParamsState.value = new URLSearchParams("error=1");

    renderUi(<SignInPage />);

    expect(screen.getByText("Đăng nhập thất bại. Vui lòng thử lại.")).toBeInTheDocument();
  });
});
