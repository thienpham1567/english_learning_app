import { renderUi } from "@/test/render";
import { screen } from "@testing-library/react";
import { expect, it, vi, describe } from "vitest";

import { AppSidebar } from "@/components/app/AppSidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/english-chatbot",
}));

describe("AppSidebar", () => {
  it("renders the Vietnamese sidebar labels", () => {
    renderUi(<AppSidebar />);

    expect(screen.getByRole("link", { name: "Trò chuyện tiếng Anh" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Từ điển Cô Lành" })).toBeInTheDocument();
  });
});
