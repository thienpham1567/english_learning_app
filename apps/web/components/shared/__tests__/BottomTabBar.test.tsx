import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

import { BottomTabBar } from "@/components/shared/BottomTabBar";
import { renderUi } from "@/test/render";

const push = vi.fn();
const pathname = "/home";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => pathname,
}));

describe("BottomTabBar", () => {
  it("opens a learning hub with core practice routes", () => {
    renderUi(<BottomTabBar />);

    fireEvent.click(screen.getByRole("button", { name: /Học/i }));

    expect(screen.getByText("Luyện nghe")).toBeInTheDocument();
    expect(screen.getByText("Luyện đọc")).toBeInTheDocument();
    expect(screen.getByText("Luyện nói")).toBeInTheDocument();
    expect(screen.getByText("Luyện viết")).toBeInTheDocument();
  });

  it("opens a review hub with review and progress routes", () => {
    renderUi(<BottomTabBar />);

    fireEvent.click(screen.getByRole("button", { name: /Ôn/i }));

    expect(screen.getByText("Ôn tập")).toBeInTheDocument();
    expect(screen.getByText("Sổ lỗi sai")).toBeInTheDocument();
    expect(screen.getByText("Tiến độ")).toBeInTheDocument();
    expect(screen.getByText("Thi thử")).toBeInTheDocument();
  });
});
