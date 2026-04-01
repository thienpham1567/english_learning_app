import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UserMenu } from "@/components/app/shared/UserMenu";
import { renderUi } from "@/test/render";

const { push, signOut } = vi.hoisted(() => ({
  push: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signOut,
  },
}));

describe("UserMenu", () => {
  beforeEach(() => {
    push.mockReset();
    signOut.mockReset();
    signOut.mockResolvedValue(undefined);
  });

  it("opens the dropdown and shows the sign-out action", () => {
    renderUi(<UserMenu user={{ name: "Cô Lành", image: null }} />);

    fireEvent.click(screen.getByRole("button", { name: /cô lành/i }));

    expect(screen.getByRole("button", { name: "Đăng xuất" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đăng xuất" }).parentElement).toHaveClass("z-[200]");
  });

  it("keeps the user name hidden through the 920px shell breakpoint", () => {
    renderUi(<UserMenu user={{ name: "Cô Lành", image: null }} />);

    expect(screen.getByText("Cô Lành")).toHaveClass(
      "text-sm",
      "font-medium",
      "text-(--ink)",
      "max-[920px]:hidden",
    );
  });

  it("keeps the trigger compact inside the shell header", () => {
    renderUi(<UserMenu user={{ name: "Cô Lành", image: null }} />);

    expect(screen.getByRole("button", { name: /cô lành/i })).toHaveClass(
      "flex",
      "items-center",
      "gap-2",
      "rounded-full",
      "border",
      "border-(--border)",
      "bg-(--surface)",
      "pl-[5px]",
      "pr-[10px]",
      "py-[5px]",
      "text-left",
      "shadow-(--shadow-sm)",
      "focus-visible:outline",
      "focus-visible:outline-2",
      "focus-visible:outline-offset-2",
      "focus-visible:outline-(--accent)",
    );

    expect(screen.getByText("CL")).toHaveClass(
      "size-7",
      "rounded-full",
      "grid",
    );
  });

  it("keeps a visible focus ring on menu actions", () => {
    renderUi(<UserMenu user={{ name: "Cô Lành", image: null }} />);

    fireEvent.click(screen.getByRole("button", { name: /cô lành/i }));

    expect(screen.getByRole("button", { name: "Đăng xuất" })).toHaveClass(
      "focus-visible:outline",
      "focus-visible:outline-2",
      "focus-visible:outline-offset-2",
      "focus-visible:outline-(--accent)",
    );
  });
});
