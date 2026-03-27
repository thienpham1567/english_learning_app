import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UserMenu } from "@/components/app/UserMenu";
import { renderUi } from "@/test/render";

const push = vi.fn();
const signOut = vi.fn();

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
  });
});
