import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UserMenu } from "@/components/shared/UserMenu";
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

    expect(screen.getByRole("menuitem", { name: /Đăng xuất/ })).toBeInTheDocument();
  });

  it("renders user identity in the compact trigger", () => {
    renderUi(<UserMenu user={{ name: "Cô Lành", image: null }} />);

    expect(screen.getByText("CL")).toBeInTheDocument();
    expect(screen.getByText("Cô Lành")).toBeInTheDocument();
  });

  it("keeps the trigger compact inside the shell header", () => {
    renderUi(<UserMenu user={{ name: "Cô Lành", image: null }} />);

    expect(screen.getByRole("button", { name: /cô lành/i })).toHaveStyle({
      display: "flex",
      alignItems: "center",
      gap: "8px",
      borderRadius: "999px",
      height: "38px",
      paddingLeft: "5px",
      paddingRight: "12px",
    });
  });

  it("signs out and redirects to sign-in", async () => {
    renderUi(<UserMenu user={{ name: "Cô Lành", image: null }} />);

    fireEvent.click(screen.getByRole("button", { name: /cô lành/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Đăng xuất/ }));

    await waitFor(() => expect(signOut).toHaveBeenCalledOnce());
    expect(push).toHaveBeenCalledWith("/sign-in");
  });
});
