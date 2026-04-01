import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FuelExecutionPanel } from "@/components/app/fuel-prices/FuelChatParts";
import type { FuelAssistantRun } from "@/lib/fuel-prices/types";

describe("FuelExecutionPanel", () => {
  it("renders a function-style card with name, status, input, and output", () => {
    const run: FuelAssistantRun = {
      status: "done",
      startedAt: "2026-04-01T01:00:00.000Z",
      finishedAt: "2026-04-01T01:00:03.000Z",
      tools: [
        {
          id: "tool-1",
          tool: "get_fuel_prices",
          name: "gia_xang",
          status: "done",
          input: {},
          output: {
            status: "success",
            prices: [{ product: "Xăng RON 95-III", price: "24.330 đ" }],
          },
        },
      ],
    };

    render(<FuelExecutionPanel run={run} />);

    expect(screen.getByText("gia_xang")).toBeInTheDocument();
    expect(screen.getByText("success")).toBeInTheDocument();
    expect(screen.getByText("INPUT")).toBeInTheDocument();
    expect(screen.getByText("OUTPUT")).toBeInTheDocument();
    expect(screen.getByText("{}")).toBeInTheDocument();
    expect(screen.getByText(/"product": "Xăng RON 95-III"/)).toBeInTheDocument();
  });

  it("shows a running shell before the first function starts", () => {
    render(
      <FuelExecutionPanel
        run={{
          status: "running",
          startedAt: "2026-04-01T01:00:00.000Z",
          tools: [],
        }}
      />,
    );

    expect(screen.getByText("Đang chuẩn bị gọi function...")).toBeInTheDocument();
  });
});
