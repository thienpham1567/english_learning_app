import type { ResponseInputItem } from "openai/resources/responses/responses";

import {
  scrapeFuelPrices,
  getPreviousPriceSnapshot,
} from "@/lib/fuel-prices/scraper";
import { sendDiscordMessage } from "@/lib/fuel-prices/discord";
import type {
  FuelChatMessage,
  FuelToolExecutionOutput,
  ToolExecutorOptions,
} from "@/lib/fuel-prices/types";

// Re-export for convenience (consumers can import from a single place)
export { FUEL_TOOLS } from "@/lib/fuel-prices/tool-definitions";
export { FUEL_PRICE_INSTRUCTIONS } from "@/lib/fuel-prices/system-prompt";
export type { FuelChatMessage } from "@/lib/fuel-prices/types";

// ── Tool Executor ───────────────────────────────────────────

export async function executeFuelTool(
  toolName: string,
  args: Record<string, unknown>,
  options?: ToolExecutorOptions,
): Promise<FuelToolExecutionOutput> {
  switch (toolName) {
    case "get_fuel_prices":
      return handleGetFuelPrices();

    case "send_discord_report":
      return handleSendDiscordReport(args, options);

    case "compare_fuel_prices":
      return handleCompareFuelPrices();

    case "calculate_fuel_cost":
      return handleCalculateFuelCost(args);

    default:
      return {
        content: JSON.stringify({ error: `Unknown tool: ${toolName}` }),
        thinking: ["Không nhận diện được công cụ được yêu cầu."],
        resultPreview: "Tool không hợp lệ.",
      };
  }
}

// ── Message Builder ─────────────────────────────────────────

/**
 * Converts client messages to OpenAI Responses API input format.
 */
export function buildFuelChatInput(
  messages: FuelChatMessage[],
): ResponseInputItem[] {
  return messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.text,
  }));
}

// ── Tool Handlers (private) ─────────────────────────────────

async function handleGetFuelPrices(): Promise<FuelToolExecutionOutput> {
  const result = await scrapeFuelPrices();
  return {
    content: JSON.stringify(result),
    thinking: [
      "Đang kiểm tra nguồn giá xăng hiện có",
      `Đã lấy dữ liệu từ ${result.source}`,
      "Đang chuẩn hóa dữ liệu để hiển thị đủ tất cả loại nhiên liệu",
    ],
    sources: [
      {
        label: result.source,
        href: result.articleUrl ?? "https://www.pvoil.com.vn/tin-gia-xang-dau",
        updatedAt: result.updatedAt,
      },
    ],
    renderingHint: "Đang dựng bảng Markdown cho toàn bộ nhiên liệu",
    resultPreview: `${result.prices.length} loại nhiên liệu đã được cập nhật.`,
  };
}

async function handleSendDiscordReport(
  args: Record<string, unknown>,
  options?: ToolExecutorOptions,
): Promise<FuelToolExecutionOutput> {
  const content =
    typeof args.content === "string" ? args.content : String(args.content);
  const result = await sendDiscordMessage(content, options?.discordWebhookUrl);
  return {
    content: JSON.stringify(result),
    thinking: [
      "Đang kiểm tra cấu hình webhook Discord",
      "Đang gửi payload báo cáo giá xăng",
    ],
    renderingHint: "Đang tổng hợp trạng thái gửi báo cáo lên Discord",
    resultPreview: result.message,
  };
}

async function handleCompareFuelPrices(): Promise<FuelToolExecutionOutput> {
  const current = await scrapeFuelPrices();
  const previous = getPreviousPriceSnapshot();

  if (!previous) {
    return {
      content: JSON.stringify({
        success: false,
        message:
          "Chưa có dữ liệu cũ để so sánh. Hãy tra cứu giá ít nhất 2 lần (cách nhau > 30 phút) để có dữ liệu so sánh.",
        current: current.success ? current.prices : null,
      }),
      thinking: [
        "Đang tải snapshot hiện tại và lần tra cứu trước",
        "Chưa tìm thấy dữ liệu cũ đủ điều kiện để so sánh",
      ],
      renderingHint: "Đang chuẩn bị thông báo chưa có dữ liệu so sánh",
      resultPreview: "Chưa có dữ liệu cũ để so sánh.",
    };
  }

  const comparison = current.prices.map((p) => {
    const oldPrice = previous.prices[p.name];
    const currentNum = parseVietnameseNumber(p.price);
    const oldNum = oldPrice ? parseVietnameseNumber(oldPrice) : null;

    let change = "không đổi";
    let diff = 0;
    if (oldNum !== null && currentNum !== null) {
      diff = currentNum - oldNum;
      if (diff > 0)
        change = `tăng ${Math.abs(diff).toLocaleString("vi-VN")} đồng`;
      else if (diff < 0)
        change = `giảm ${Math.abs(diff).toLocaleString("vi-VN")} đồng`;
    }

    return {
      name: p.name,
      currentPrice: p.price,
      previousPrice: oldPrice ?? "N/A",
      change,
      diff,
    };
  });

  return {
    content: JSON.stringify({
      success: true,
      comparison,
      previousTime: previous.timestamp,
      currentTime: current.updatedAt,
    }),
    thinking: [
      "Đang tải snapshot hiện tại và lần tra cứu trước",
      "Đang đối chiếu chênh lệch giá theo từng loại nhiên liệu",
    ],
    renderingHint: "Đang tổng hợp biến động giá xăng dầu",
    resultPreview: `${comparison.length} mục đã được so sánh với snapshot trước.`,
  };
}

async function handleCalculateFuelCost(
  args: Record<string, unknown>,
): Promise<FuelToolExecutionOutput> {
  const distanceKm = Number(args.distance_km) || 0;
  const fuelConsumption = Number(args.fuel_consumption) || 6.5;
  const fuelType =
    typeof args.fuel_type === "string" ? args.fuel_type : "RON 95";

  if (distanceKm <= 0) {
    return {
      content: JSON.stringify({
        success: false,
        message: "Khoảng cách phải lớn hơn 0 km.",
      }),
      thinking: ["Đang kiểm tra tham số quãng đường người dùng nhập"],
      renderingHint: "Đang chuẩn bị thông báo lỗi đầu vào",
      resultPreview: "Khoảng cách phải lớn hơn 0 km.",
    };
  }

  const priceResult = await scrapeFuelPrices();
  let pricePerLiter = 0;
  let matchedFuel = fuelType;

  if (priceResult.success) {
    const matchingFuel = priceResult.prices.find(
      (p) =>
        p.name.toLowerCase().includes(fuelType.toLowerCase()) ||
        fuelType.toLowerCase().includes(p.name.toLowerCase()),
    );
    if (matchingFuel) {
      pricePerLiter = parseVietnameseNumber(matchingFuel.price) ?? 0;
      matchedFuel = matchingFuel.name;
    }
  }

  const litersNeeded = (distanceKm / 100) * fuelConsumption;
  const totalCost =
    pricePerLiter > 0 ? Math.round(litersNeeded * pricePerLiter) : 0;

  return {
    content: JSON.stringify({
      success: true,
      distanceKm,
      fuelConsumption,
      fuelType: matchedFuel,
      litersNeeded: Math.round(litersNeeded * 100) / 100,
      pricePerLiter:
        pricePerLiter > 0
          ? pricePerLiter.toLocaleString("vi-VN")
          : "không xác định",
      totalCost:
        totalCost > 0 ? totalCost.toLocaleString("vi-VN") : "không xác định",
      note:
        pricePerLiter === 0
          ? "Không tìm được giá xăng tương ứng, user cần cung cấp giá."
          : undefined,
    }),
    thinking: [
      "Đang đọc thông tin quãng đường và mức tiêu thụ nhiên liệu",
      "Đang ghép loại nhiên liệu với bảng giá hiện tại",
      "Đang tính lượng xăng cần dùng và tổng chi phí",
    ],
    renderingHint: "Đang tổng hợp bảng ước tính chi phí chuyến đi",
    resultPreview:
      totalCost > 0
        ? `Chi phí ước tính: ${totalCost.toLocaleString("vi-VN")} VNĐ.`
        : "Chưa xác định được chi phí ước tính.",
  };
}

// ── Helpers ─────────────────────────────────────────────────

function parseVietnameseNumber(str: string): number | null {
  const cleaned = str.replace(/[.,\s]/g, "");
  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}
