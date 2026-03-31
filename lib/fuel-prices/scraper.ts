import { fuelPriceCache } from "@/lib/fuel-prices/cache";

export type FuelPrice = {
  name: string;
  price: string;
  unit: string;
};

export type FuelPriceResult = {
  success: boolean;
  prices: FuelPrice[];
  updatedAt: string;
  source: string;
  cached?: boolean;
  cacheTtlSeconds?: number;
  error?: string;
};

const PVOIL_URL = "https://www.pvoil.com.vn/tin-gia-xang-dau";

/**
 * Fetches and parses fuel prices from PVOIL website.
 * Uses 30-minute in-memory cache to avoid spamming PVOIL.
 */
export async function scrapeFuelPrices(): Promise<FuelPriceResult> {
  // Check cache first
  const cached = fuelPriceCache.get();
  if (cached) {
    return {
      ...cached,
      cached: true,
      cacheTtlSeconds: fuelPriceCache.getRemainingTtl(),
    };
  }

  try {
    const response = await fetch(PVOIL_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Try multiple parsing strategies
    let prices = parseTableStrategy(html);
    if (prices.length === 0) prices = parseKeywordStrategy(html);
    if (prices.length === 0) prices = parseJsonLdStrategy(html);

    if (prices.length === 0) {
      throw new Error("Không tìm thấy bảng giá xăng dầu trên trang PVOIL");
    }

    const result: FuelPriceResult = {
      success: true,
      prices,
      updatedAt: formatVietnamTime(),
      source: "PVOIL (pvoil.com.vn)",
      cached: false,
    };

    // Store in cache
    fuelPriceCache.set(result);
    return result;
  } catch (error) {
    console.error("Fuel price scraping error:", error);

    return {
      success: false,
      prices: [],
      updatedAt: formatVietnamTime(),
      source: "PVOIL (pvoil.com.vn)",
      error:
        error instanceof Error
          ? error.message
          : "Không thể kết nối tới trang PVOIL",
    };
  }
}

/**
 * Returns the previous price snapshot for comparison.
 */
export function getPreviousPriceSnapshot() {
  return fuelPriceCache.getPreviousSnapshot();
}

/**
 * Returns cache info for display.
 */
export function getCacheInfo() {
  return {
    remainingTtl: fuelPriceCache.getRemainingTtl(),
    historyCount: fuelPriceCache.getHistory().length,
  };
}

// ── Parsing strategies ──────────────────────────────────────

/** Strategy 1: Parse HTML table rows. */
function parseTableStrategy(html: string): FuelPrice[] {
  const prices: FuelPrice[] = [];
  const tableRowRegex =
    /<tr[^>]*>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>(?:\s*<td[^>]*>([\s\S]*?)<\/td>)*/gi;

  let match: RegExpExecArray | null;
  while ((match = tableRowRegex.exec(html)) !== null) {
    const rawName = stripHtmlTags(match[1]).trim();
    const rawPrice = stripHtmlTags(match[2]).trim();

    if (isFuelName(rawName) && looksLikePrice(rawPrice)) {
      prices.push({
        name: normalizeFuelName(rawName),
        price: formatPrice(rawPrice),
        unit: "đồng/lít",
      });
    }
  }
  return deduplicatePrices(prices);
}

/** Strategy 2: Match fuel keywords near numbers in HTML. */
function parseKeywordStrategy(html: string): FuelPrice[] {
  const prices: FuelPrice[] = [];
  const fuelKeywords = [
    { keyword: "RON 95", name: "Xăng RON 95-V" },
    { keyword: "E5 RON 92", name: "Xăng E5 RON 92" },
    { keyword: "E5RON92", name: "Xăng E5 RON 92" },
    { keyword: "Diesel", name: "Dầu Diesel 0.05S" },
    { keyword: "DO 0.05S", name: "Dầu DO 0.05S" },
    { keyword: "DO 0,05S", name: "Dầu DO 0.05S" },
    { keyword: "Dầu hỏa", name: "Dầu hỏa" },
    { keyword: "Mazut", name: "Mazut 180CST 3.5S" },
  ];

  for (const { keyword, name } of fuelKeywords) {
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`${escapedKeyword}[^\\d]{0,100}?([\\d.,]+)`, "i");
    const match = regex.exec(html);

    if (match && looksLikePrice(match[1])) {
      prices.push({
        name,
        price: formatPrice(match[1]),
        unit: "đồng/lít",
      });
    }
  }
  return deduplicatePrices(prices);
}

/** Strategy 3: Look for JSON-LD or structured data in the page. */
function parseJsonLdStrategy(html: string): FuelPrice[] {
  const prices: FuelPrice[] = [];
  const jsonLdRegex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  let match: RegExpExecArray | null;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]) as Record<string, unknown>;
      if (data && typeof data === "object") {
        // Look for price-related fields
        const text = JSON.stringify(data);
        if (/xăng|ron|diesel|dầu/i.test(text)) {
          // Try to extract from structured data
          const keywordPrices = parseKeywordStrategy(text);
          prices.push(...keywordPrices);
        }
      }
    } catch {
      // Invalid JSON, skip
    }
  }
  return deduplicatePrices(prices);
}

// ── Helpers ──────────────────────────────────────────────────

function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ");
}

function isFuelName(text: string): boolean {
  return /xăng|ron|diesel|dầu|e5|do\s*0|mazut|nhiên liệu|gasoline/i.test(text);
}

function looksLikePrice(text: string): boolean {
  const cleaned = text.replace(/[.,\s]/g, "");
  const num = Number(cleaned);
  return !isNaN(num) && num >= 10000 && num <= 50000;
}

function normalizeFuelName(name: string): string {
  return name.replace(/\s+/g, " ").replace(/^\d+\.\s*/, "").trim();
}

function formatPrice(raw: string): string {
  const cleaned = raw.replace(/[.,\s]/g, "");
  const num = Number(cleaned);
  if (isNaN(num)) return raw;
  return num.toLocaleString("vi-VN");
}

function formatVietnamTime(): string {
  return new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
}

function deduplicatePrices(prices: FuelPrice[]): FuelPrice[] {
  const seen = new Set<string>();
  return prices.filter((p) => {
    const key = p.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
