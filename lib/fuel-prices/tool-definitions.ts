import type { Tool } from "openai/resources/responses/responses";

/**
 * OpenAI function-calling tool definitions for the Fuel Price chatbot.
 */
export const FUEL_TOOLS: Tool[] = [
  {
    type: "function",
    name: "get_fuel_prices",
    description:
      "Lấy bảng giá xăng dầu mới nhất từ PVOIL. Gọi tool này khi user hỏi về giá xăng, giá dầu, giá nhiên liệu.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
    strict: false,
  },
  {
    type: "function",
    name: "send_discord_report",
    description:
      "Gửi bảng tổng hợp giá xăng dầu vào kênh Discord của lớp học. Chỉ gọi khi user đồng ý gửi.",
    parameters: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description:
            "Nội dung tin nhắn đã được biên soạn lại theo phong cách nhây, vui, dễ thương của Cô Minh để gửi lên Discord.",
        },
      },
      required: ["content"],
    },
    strict: false,
  },
  {
    type: "function",
    name: "compare_fuel_prices",
    description:
      "So sánh giá xăng dầu hiện tại với lần tra cứu trước. Dùng khi user hỏi giá tăng hay giảm, hoặc muốn so sánh.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
    strict: false,
  },
  {
    type: "function",
    name: "calculate_fuel_cost",
    description:
      "Tính chi phí xăng dầu cho một chuyến đi dựa trên khoảng cách và mức tiêu thụ nhiên liệu.",
    parameters: {
      type: "object",
      properties: {
        distance_km: {
          type: "number",
          description: "Khoảng cách chuyến đi (km)",
        },
        fuel_consumption: {
          type: "number",
          description:
            "Mức tiêu thụ nhiên liệu (lít/100km). Mặc định 6.5 nếu không biết.",
        },
        fuel_type: {
          type: "string",
          description:
            "Loại xăng (RON 95, E5 RON 92, Diesel). Mặc định RON 95.",
        },
      },
      required: ["distance_km"],
    },
    strict: false,
  },
];
