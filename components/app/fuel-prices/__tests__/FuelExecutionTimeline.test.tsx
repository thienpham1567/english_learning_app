import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FuelExecutionPanel } from "@/components/app/fuel-prices/FuelChatParts";
import type { FuelAssistantRun } from "@/lib/fuel-prices/types";

describe("FuelExecutionPanel", () => {
  it("renders tool cards with thinking, source, rendering, and result blocks", () => {
    const run: FuelAssistantRun = {
      status: "done",
      startedAt: "2026-04-01T01:00:00.000Z",
      finishedAt: "2026-04-01T01:00:03.000Z",
      tools: [
        {
          id: "tool-1",
          tool: "get_fuel_prices",
          name: "Lấy giá mới nhất",
          status: "done",
          thinking: [
            "Đang xác định nguồn có dữ liệu mới nhất",
            "Đã chọn PVOIL vì trả về bảng giá trực tiếp",
          ],
          sources: [
            {
              label: "PVOIL (pvoil.com.vn)",
              href: "https://www.pvoil.com.vn/tin-gia-xang-dau",
              updatedAt: "08:52 01/04/2026",
            },
          ],
          rendering: "Đang dựng bảng Markdown cho toàn bộ nhiên liệu",
          resultMarkdown: "| Sản phẩm | Giá |",
        },
      ],
    };

    render(<FuelExecutionPanel run={run} />);

    expect(screen.getByText("Lấy giá mới nhất")).toBeInTheDocument();
    expect(screen.getByText("Thinking")).toBeInTheDocument();
    expect(screen.getByText("Source")).toBeInTheDocument();
    expect(screen.getByText("Rendering")).toBeInTheDocument();
    expect(screen.getByText("Result")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "PVOIL (pvoil.com.vn)" }),
    ).toHaveAttribute("href", "https://www.pvoil.com.vn/tin-gia-xang-dau");
    expect(screen.queryByText("Call Agent")).not.toBeInTheDocument();
  });

  it("shows a processing shell while the run is active", () => {
    render(
      <FuelExecutionPanel
        run={{
          status: "running",
          startedAt: "2026-04-01T01:00:00.000Z",
          tools: [],
        }}
      />,
    );

    expect(screen.getByText("Running")).toBeInTheDocument();
    expect(screen.getByText("Đang chuẩn bị gọi tool đầu tiên")).toBeInTheDocument();
  });
});
