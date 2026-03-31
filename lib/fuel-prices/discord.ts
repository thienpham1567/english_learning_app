export type DiscordResult = {
  success: boolean;
  message: string;
};

type DiscordEmbedField = {
  name: string;
  value: string;
  inline?: boolean;
};

type DiscordEmbed = {
  title: string;
  description?: string;
  color: number;
  fields?: DiscordEmbedField[];
  footer?: { text: string; icon_url?: string };
  thumbnail?: { url: string };
  timestamp?: string;
};

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

/**
 * Sends a rich embed message to Discord via webhook.
 */
export async function sendDiscordMessage(
  content: string,
  customWebhookUrl?: string,
): Promise<DiscordResult> {
  const webhookUrl = customWebhookUrl || DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    return {
      success: false,
      message:
        "Chưa cấu hình Discord Webhook URL. Vui lòng nhập URL trong giao diện hoặc",
    };
  }

  try {
    // Parse the content to create a rich embed
    const embed = buildFuelPriceEmbed(content);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Cô Kiều ⛽ Báo Giá Xăng",
        avatar_url: "https://cdn-icons-png.flaticon.com/512/6997/6997662.png",
        embeds: [embed],
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(
        `Discord webhook lỗi (HTTP ${response.status}): ${errorText}`,
      );
    }

    return {
      success: true,
      message: "Đã gửi báo cáo giá xăng lên Discord thành công! 🎉",
    };
  } catch (error) {
    console.error("Discord webhook error:", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? `Gửi Discord thất bại: ${error.message}`
          : "Không thể gửi tin nhắn lên Discord. Thử lại sau nhé!",
    };
  }
}

/**
 * Builds a rich Discord embed from fuel price content.
 * Uses Discord markdown for a premium, readable layout.
 */
function buildFuelPriceEmbed(content: string): DiscordEmbed {
  const prices = extractPriceEntries(content);

  // If we extracted structured prices, build a pretty formatted embed
  if (prices.length > 0) {
    const priceLines = prices.map((p) => {
      const icon = p.type === "gas" ? "⛽" : "🛢️";
      const padded = p.price.padStart(8);
      return `${icon} ${p.name.padEnd(24)} ${padded} đ/${p.unit}`;
    });

    const priceBlock = ["```", ...priceLines, "```"].join("\n");

    const description = [
      "📊 **Cập nhật giá nhiên liệu mới nhất**",
      "",
      priceBlock,
      "",
      `🕐 Cập nhật lúc: **${formatVnTime()}**`,
    ].join("\n");

    const commentary = extractCommentary(content);

    const embed: DiscordEmbed = {
      title: "⛽ Bảng Giá Xăng Dầu Hôm Nay",
      description,
      color: 0xf59e0b, // Amber-500
      footer: {
        text: "Cô Kiều 💁‍♀️ • Cây xăng cô Kiều",
        icon_url: "https://cdn-icons-png.flaticon.com/512/6997/6997662.png",
      },
      timestamp: new Date().toISOString(),
    };

    // Add commentary as a field if there's any
    if (commentary) {
      embed.fields = [
        {
          name: "📝 Nhận xét",
          value: commentary,
          inline: false,
        },
      ];
    }

    return embed;
  }

  // Fallback: send raw content with basic formatting
  return {
    title: "⛽ Báo Cáo Giá Xăng Dầu",
    description: content.slice(0, 2000),
    color: 0xf59e0b,
    footer: {
      text: "Cô Kiều 💁‍♀️ • Cây xăng cô Kiều",
      icon_url: "https://cdn-icons-png.flaticon.com/512/6997/6997662.png",
    },
    timestamp: new Date().toISOString(),
  };
}

type PriceEntry = {
  name: string;
  price: string;
  unit: string;
  type: "gas" | "oil";
};

/**
 * Extracts structured price entries from the AI's response.
 * Handles markdown table rows and plain text patterns.
 */
function extractPriceEntries(content: string): PriceEntry[] {
  const entries: PriceEntry[] = [];
  const seen = new Set<string>();

  // Pattern 1: Markdown table rows — "| **Xăng RON 95** | 24,332 |"
  const tableRowRegex =
    /\|\s*\*{0,2}([^|*]+?)\*{0,2}\s*\|\s*\*{0,2}([\d.,]+)\*{0,2}\s*\|/g;
  let match: RegExpExecArray | null;
  while ((match = tableRowRegex.exec(content)) !== null) {
    const rawName = match[1].replace(/[⛽🛢️🔴🟢🔺🔻➖]/g, "").trim();
    const price = match[2].trim();
    if (looksLikePrice(price) && !seen.has(rawName.toLowerCase())) {
      seen.add(rawName.toLowerCase());
      entries.push({
        name: rawName,
        price: formatNumber(price),
        unit: /mazut/i.test(rawName) ? "kg" : "lít",
        type: /dầu|diesel|mazut|hỏa/i.test(rawName) ? "oil" : "gas",
      });
    }
  }

  if (entries.length > 0) return entries;

  // Pattern 2: Key-value — "Xăng RON 95: 24,332 đồng/lít"
  const kvPatterns: Array<{ regex: RegExp; type: "gas" | "oil" }> = [
    {
      regex:
        /(?:xăng\s+)?((?:E5\s+)?RON\s+\d+[\w-]*)[:\s]+(\d[\d.,]+)\s*(?:đồng|VND)/gi,
      type: "gas",
    },
    {
      regex:
        /(?:dầu\s+)?(diesel[^:\n]*)[:\s]+(\d[\d.,]+)\s*(?:đồng|VND)/gi,
      type: "oil",
    },
    {
      regex: /(dầu\s+hỏa)[:\s]+(\d[\d.,]+)\s*(?:đồng|VND)/gi,
      type: "oil",
    },
    {
      regex: /(mazut[^:\n]*)[:\s]+(\d[\d.,]+)\s*(?:đồng|VND)/gi,
      type: "oil",
    },
  ];

  for (const { regex, type } of kvPatterns) {
    while ((match = regex.exec(content)) !== null) {
      const name = match[1].trim();
      const price = match[2].trim();
      if (looksLikePrice(price) && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        entries.push({
          name,
          price: formatNumber(price),
          unit: /mazut/i.test(name) ? "kg" : "lít",
          type,
        });
      }
    }
  }

  return entries;
}

/**
 * Extracts commentary text (non-price, non-table content).
 */
function extractCommentary(content: string): string {
  const lines = content.split("\n");
  const commentary = lines
    .filter((line) => {
      const t = line.trim();
      if (!t) return false;
      // Skip table rows, headers, dividers
      if (t.startsWith("|") || t.startsWith("---")) return false;
      // Skip lines that are just price data
      if (/^\*{0,2}[⛽🛢️]/.test(t)) return false;
      // Skip "Sản phẩm" header lines
      if (/sản phẩm|giá.*vnđ|biến động/i.test(t)) return false;
      return true;
    })
    .join("\n")
    .trim();

  return commentary.length > 400 ? commentary.slice(0, 397) + "..." : commentary;
}

function looksLikePrice(text: string): boolean {
  const num = Number(text.replace(/[.,\s]/g, ""));
  return !isNaN(num) && num >= 10000 && num <= 50000;
}

function formatNumber(raw: string): string {
  const num = Number(raw.replace(/[.,\s]/g, ""));
  if (isNaN(num)) return raw;
  return num.toLocaleString("vi-VN");
}

function formatVnTime(): string {
  return new Date().toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
