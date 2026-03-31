import {
  scrapeFuelPrices,
  getPreviousPriceSnapshot,
} from "@/lib/fuel-prices/scraper";
import { sendDiscordMessage } from "@/lib/fuel-prices/discord";
import type { FuelChatMessage, ToolExecutorOptions } from "@/lib/fuel-prices/types";

// Re-export for convenience (consumers can import from a single place)
export { FUEL_TOOLS } from "@/lib/fuel-prices/tool-definitions";
export { FUEL_PRICE_INSTRUCTIONS } from "@/lib/fuel-prices/system-prompt";
export type { FuelChatMessage } from "@/lib/fuel-prices/types";

// ── Tool Executor ───────────────────────────────────────────

export async function executeFuelTool(
  toolName: string,
  args: Record<string, unknown>,
  options?: ToolExecutorOptions,
): Promise<string> {
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
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

// ── Message Builder ─────────────────────────────────────────

/**
 * Converts client messages to OpenAI Responses API input format.
 */
export function buildFuelChatInput(messages: FuelChatMessage[]) {
  return messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.text,
  }));
}

// ── Tool Handlers (private) ─────────────────────────────────

async function handleGetFuelPrices(): Promise<string> {
  const result = await scrapeFuelPrices();
  return JSON.stringify(result);
}

async function handleSendDiscordReport(
  args: Record<string, unknown>,
  options?: ToolExecutorOptions,
): Promise<string> {
  const content =
    typeof args.content === "string" ? args.content : String(args.content);
  const result = await sendDiscordMessage(content, options?.discordWebhookUrl);
  return JSON.stringify(result);
}

async function handleCompareFuelPrices(): Promise<string> {
  const current = await scrapeFuelPrices();
  const previous = getPreviousPriceSnapshot();

  if (!previous) {
    return JSON.stringify({
      success: false,
      message:
        "Chưa có dữ liệu cũ để so sánh. Hãy tra cứu giá ít nhất 2 lần (cách nhau > 30 phút) để có dữ liệu so sánh.",
      current: current.success ? current.prices : null,
    });
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

  return JSON.stringify({
    success: true,
    comparison,
    previousTime: previous.timestamp,
    currentTime: current.updatedAt,
  });
}

async function handleCalculateFuelCost(
  args: Record<string, unknown>,
): Promise<string> {
  const distanceKm = Number(args.distance_km) || 0;
  const fuelConsumption = Number(args.fuel_consumption) || 6.5;
  const fuelType =
    typeof args.fuel_type === "string" ? args.fuel_type : "RON 95";

  if (distanceKm <= 0) {
    return JSON.stringify({
      success: false,
      message: "Khoảng cách phải lớn hơn 0 km.",
    });
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

  return JSON.stringify({
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
  });
}

// ── Helpers ─────────────────────────────────────────────────

function parseVietnameseNumber(str: string): number | null {
  const cleaned = str.replace(/[.,\s]/g, "");
  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}
