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
  articleUrl?: string;
  cached?: boolean;
  cacheTtlSeconds?: number;
  error?: string;
};

// ── Data Sources ────────────────────────────────────────────

const VIETNAMNET_TAG_URL =
  "https://vietnamnet.vn/gia-xang-dau-tag5537394984591514120.html";

const PVOIL_URL = "https://www.pvoil.com.vn/tin-gia-xang-dau";

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
};

// ── Public API ──────────────────────────────────────────────

/**
 * Fetches and parses fuel prices. Tries VietnamNet first, falls back to PVOIL.
 * Uses 30-minute in-memory cache to avoid spamming sources.
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

  // Try VietnamNet (primary) → PVOIL (fallback)
  const result =
    (await tryVietnamNet()) ??
    (await tryPvoil()) ??
    createErrorResult("Không thể lấy dữ liệu giá xăng từ bất kỳ nguồn nào");

  if (result.success) {
    fuelPriceCache.set(result);
  }
  return result;
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

// ── VietnamNet Strategy ─────────────────────────────────────
// 1. Fetch the tag page to find the latest "giá xăng dầu" article
// 2. Fetch that article and extract prices from the body text

async function tryVietnamNet(): Promise<FuelPriceResult | null> {
  try {
    // Step 1: Find the latest fuel price article
    const tagHtml = await fetchHtml(VIETNAMNET_TAG_URL);
    const articleUrl = findLatestPriceArticle(tagHtml);

    if (!articleUrl) {
      console.warn("VietnamNet: No price article found on tag page");
      return null;
    }

    // Step 2: Fetch and parse the article
    const fullUrl = articleUrl.startsWith("http")
      ? articleUrl
      : `https://vietnamnet.vn${articleUrl}`;

    const articleHtml = await fetchHtml(fullUrl);
    const prices = extractPricesFromArticle(articleHtml);

    if (prices.length === 0) {
      console.warn("VietnamNet: No prices found in article:", fullUrl);
      return null;
    }

    return {
      success: true,
      prices,
      updatedAt: formatVietnamTime(),
      source: "VietNamNet (vietnamnet.vn)",
      articleUrl: fullUrl,
      cached: false,
    };
  } catch (error) {
    console.error("VietnamNet scraper error:", error);
    return null;
  }
}

/**
 * Finds the URL of the latest article about fuel price adjustments.
 */
function findLatestPriceArticle(html: string): string | null {
  // Look for article links that mention price changes
  const linkRegex =
    /href="(\/[^"]*(?:gia-xang-dau|dieu-chinh-gia|gia-xang)[^"]*\.html)"/gi;
  const candidates: string[] = [];

  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1];
    // Skip the tag page itself, only want article pages
    if (url.includes("-tag")) continue;
    // Prefer articles about price adjustments or announcements
    candidates.push(url);
  }

  if (candidates.length === 0) return null;

  // Prioritise articles that mention actual price adjustments
  const priceArticle = candidates.find((url) =>
    /giam|tang|dieu-chinh|gia-xang-dau-hom-nay|gia-moi/i.test(url),
  );

  return priceArticle ?? candidates[0];
}

/**
 * Extracts fuel prices from a VietnamNet article body.
 * Looks for patterns like "xăng E5RON92 không cao hơn 23.326 đồng/lít"
 */
function extractPricesFromArticle(html: string): FuelPrice[] {
  const text = stripHtmlTags(html);
  const prices: FuelPrice[] = [];

  const pricePatterns: Array<{
    pattern: RegExp;
    name: string;
    unit: string;
  }> = [
    {
      // "xăng E5RON92 không cao hơn 23.326 đồng/lít" or "E5 RON 92...23.326"
      pattern:
        /(?:xăng\s+)?E5\s*RON\s*92[^0-9]{0,60}?(\d[\d.,]+)\s*(?:đồng|VND)/gi,
      name: "Xăng E5 RON 92",
      unit: "đồng/lít",
    },
    {
      // "xăng RON95-III không cao hơn 24.332 đồng/lít"
      pattern: /(?:xăng\s+)?RON\s*95[^0-9]{0,60}?(\d[\d.,]+)\s*(?:đồng|VND)/gi,
      name: "Xăng RON 95-III",
      unit: "đồng/lít",
    },
    {
      // "Dầu diesel 0.05S không cao hơn 35.440 đồng/lít"
      pattern:
        /[Dd]ầu\s+(?:diesel|DO)\s*(?:0[.,]05S)?[^0-9]{0,60}?(\d[\d.,]+)\s*(?:đồng|VND)/gi,
      name: "Dầu Diesel 0.05S",
      unit: "đồng/lít",
    },
    {
      // "Dầu hỏa không cao hơn 35.384 đồng/lít"
      pattern: /[Dd]ầu\s+hỏa[^0-9]{0,60}?(\d[\d.,]+)\s*(?:đồng|VND)/gi,
      name: "Dầu hỏa",
      unit: "đồng/lít",
    },
    {
      // "Dầu madút 180CST 3.5S không cao hơn 21.748 đồng/kg"
      pattern: /[Dd]ầu\s+ma(?:dú|zú)t[^0-9]{0,60}?(\d[\d.,]+)\s*(?:đồng|VND)/gi,
      name: "Dầu Mazut 180CST 3.5S",
      unit: "đồng/kg",
    },
  ];

  for (const { pattern, name, unit } of pricePatterns) {
    const allMatches: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text)) !== null) {
      const raw = m[1];
      if (looksLikePrice(raw)) {
        allMatches.push(raw);
      }
    }
    // Take the first valid match (usually the latest price)
    if (allMatches.length > 0) {
      prices.push({
        name,
        price: formatPrice(allMatches[0]),
        unit,
      });
    }
  }

  return deduplicatePrices(prices);
}

// ── PVOIL Fallback Strategy ─────────────────────────────────
// Original HTML table scraper (fallback when VietnamNet fails)

async function tryPvoil(): Promise<FuelPriceResult | null> {
  try {
    const html = await fetchHtml(PVOIL_URL);

    let prices = parseTableStrategy(html);
    if (prices.length === 0) prices = parseKeywordStrategy(html);
    if (prices.length === 0) prices = parseJsonLdStrategy(html);

    if (prices.length === 0) {
      console.warn("PVOIL: No prices found");
      return null;
    }

    return {
      success: true,
      prices,
      updatedAt: formatVietnamTime(),
      source: "PVOIL (pvoil.com.vn)",
      cached: false,
    };
  } catch (error) {
    console.error("PVOIL scraper error:", error);
    return null;
  }
}

/** Parse HTML table rows. */
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

/** Match fuel keywords near numbers in HTML. */
function parseKeywordStrategy(html: string): FuelPrice[] {
  const prices: FuelPrice[] = [];
  const fuelKeywords = [
    { keyword: "RON 95", name: "Xăng RON 95-III" },
    { keyword: "E5 RON 92", name: "Xăng E5 RON 92" },
    { keyword: "E5RON92", name: "Xăng E5 RON 92" },
    { keyword: "Diesel", name: "Dầu Diesel 0.05S" },
    { keyword: "DO 0.05S", name: "Dầu DO 0.05S" },
    { keyword: "DO 0,05S", name: "Dầu DO 0.05S" },
    { keyword: "Dầu hỏa", name: "Dầu hỏa" },
    { keyword: "Mazut", name: "Dầu Mazut 180CST 3.5S" },
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

/** Look for JSON-LD structured data. */
function parseJsonLdStrategy(html: string): FuelPrice[] {
  const prices: FuelPrice[] = [];
  const jsonLdRegex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  let match: RegExpExecArray | null;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]) as Record<string, unknown>;
      if (data && typeof data === "object") {
        const text = JSON.stringify(data);
        if (/xăng|ron|diesel|dầu/i.test(text)) {
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

// ── Shared Helpers ──────────────────────────────────────────

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: FETCH_HEADERS,
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.text();
}

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
  return name
    .replace(/\s+/g, " ")
    .replace(/^\d+\.\s*/, "")
    .trim();
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

function createErrorResult(message: string): FuelPriceResult {
  return {
    success: false,
    prices: [],
    updatedAt: formatVietnamTime(),
    source: "N/A",
    error: message,
  };
}
