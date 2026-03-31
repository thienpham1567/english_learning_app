import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FuelExecutionTimeline } from "@/components/app/fuel-chat/FuelChatParts";
import type { FuelExecutionStep } from "@/lib/fuel-prices/types";

describe("FuelExecutionTimeline", () => {
  it("renders agent rows with their nested tool details and previews", () => {
    const steps: FuelExecutionStep[] = [
      {
        id: "agent-price-1",
        kind: "agent",
        name: "Trợ lý giá xăng",
        status: "done",
        summary: "Phân tích yêu cầu tra cứu giá mới nhất",
        resultPreview: "Đã sẵn sàng tổng hợp bảng giá xăng dầu.",
      },
      {
        id: "tool-price-1",
        parentId: "agent-price-1",
        kind: "tool",
        name: "Lấy giá mới nhất",
        tool: "get_fuel_prices",
        status: "done",
        summary: "Lấy bảng giá mới nhất từ PVOIL",
        params: {},
        resultPreview: "5 loại nhiên liệu đã được cập nhật.",
      },
    ];

    render(<FuelExecutionTimeline steps={steps} />);

    expect(screen.getByText("Call Agent")).toBeInTheDocument();
    expect(screen.getByText("Trợ lý giá xăng")).toBeInTheDocument();
    expect(screen.getByText("Lấy giá mới nhất")).toBeInTheDocument();
    expect(
      screen.getByText("Phân tích yêu cầu tra cứu giá mới nhất"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("5 loại nhiên liệu đã được cập nhật."),
    ).toBeInTheDocument();
  });

  it("shows live processing copy for a running agent", () => {
    const steps: FuelExecutionStep[] = [
      {
        id: "agent-cost-1",
        kind: "agent",
        name: "Trợ lý tính chi phí",
        status: "running",
        summary: "Phân tích hành trình và ước tính chi phí nhiên liệu",
      },
    ];

    render(<FuelExecutionTimeline steps={steps} />);

    expect(screen.getByText("AI is processing...")).toBeInTheDocument();
    expect(screen.getByText("Trợ lý tính chi phí")).toBeInTheDocument();
  });
});
