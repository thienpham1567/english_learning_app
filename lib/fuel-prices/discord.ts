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
        avatar_url: "https://cdn-icons-png.flaticon.com/512/2933/2933245.png",
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
 */
function buildFuelPriceEmbed(content: string): DiscordEmbed {
  const embed: DiscordEmbed = {
    title: "⛽ Bảng Giá Xăng Dầu Hôm Nay",
    description: content,
    color: 0xf59e0b, // Amber-500
    footer: {
      text: "Cô Kiều • Nguồn: PVOIL",
      icon_url: "https://cdn-icons-png.flaticon.com/512/2933/2933245.png",
    },
    timestamp: new Date().toISOString(),
  };

  // Try to extract structured price data from content
  const fields = extractPriceFields(content);
  if (fields.length > 0) {
    embed.fields = fields;
    // Keep only the non-price parts in description
    embed.description = extractNonPriceText(content);
  }

  return embed;
}

/**
 * Tries to extract fuel type + price pairs from the message.
 */
function extractPriceFields(content: string): DiscordEmbedField[] {
  const fields: DiscordEmbedField[] = [];
  const pricePatterns = [
    // Match: "RON 95: 23,500 đồng/lít" or similar
    /(?:xăng\s+)?((?:E5\s+)?RON\s+\d+[\w-]*)[:\s]+([0-9.,]+)\s*(?:đồng|VND|₫)/gi,
    // Match: "Diesel: 21,000 đồng/lít"
    /(?:dầu\s+)?(diesel[^:\n]*)[:\s]+([0-9.,]+)\s*(?:đồng|VND|₫)/gi,
    // Match: "Dầu hỏa: 21,500 đồng/lít"
    /(dầu\s+hỏa)[:\s]+([0-9.,]+)\s*(?:đồng|VND|₫)/gi,
    // Match: "Mazut: 15,000 đồng/kg"
    /(mazut[^:\n]*)[:\s]+([0-9.,]+)\s*(?:đồng|VND|₫)/gi,
  ];

  for (const pattern of pricePatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      const name = match[1].trim();
      const price = match[2].trim();
      // Avoid duplicates
      if (!fields.some((f) => f.name.toLowerCase() === name.toLowerCase())) {
        fields.push({
          name: `⛽ ${name}`,
          value: `**${price}** đồng/lít`,
          inline: true,
        });
      }
    }
  }

  return fields;
}

/**
 * Removes price data lines from content to keep just the commentary.
 */
function extractNonPriceText(content: string): string {
  const lines = content.split("\n");
  const nonPriceLines = lines.filter((line) => {
    const trimmed = line.trim();
    // Keep lines that don't look like "FuelName: Price"
    return !/^\|?[\s]*(?:⛽|🛢|🔥)?[\s]*(?:xăng|dầu|diesel|ron|e5|mazut)/i.test(
      trimmed,
    );
  });

  const result = nonPriceLines.join("\n").trim();
  return result || content.slice(0, 200);
}
