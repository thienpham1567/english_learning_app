import { renderUi } from "@/test/render";
import { screen } from "@testing-library/react";
import { vi } from "vitest";

import { AppSidebar } from "@/components/app/AppSidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/english-chatbot",
}));

describe("AppSidebar", () => {
  it("renders the Vietnamese sidebar labels", () => {
    renderUi(<AppSidebar />);

    expect(screen.getByText("Trò chuyện tiếng Anh")).toBeInTheDocument();
    expect(screen.getByText("Từ điển cô Lành")).toBeInTheDocument();
  });
});
