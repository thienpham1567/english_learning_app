"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Flex, Typography, Slider, message, Tooltip } from "antd";
import {
  SoundOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  LoadingOutlined,
  ManOutlined,
  WomanOutlined,
  DeleteOutlined,
  CopyOutlined,
  FieldTimeOutlined,
  InfoCircleOutlined,
  UndoOutlined,
  FileTextOutlined,
  HistoryOutlined,
  ClockCircleOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import * as m from "motion/react-client";
import { AnimatePresence } from "motion/react";

const { Text, Title, Paragraph } = Typography;

/* ── Voice configuration ── */
type Accent = "us" | "uk" | "au";
type Gender = "m" | "f";

interface VoiceOption {
  accent: Accent;
  gender: Gender;
  role: string;
  label: string;
  name: string;
  flag: string;
  accentLabel: string;
  description: string;
}

const VOICES: VoiceOption[] = [
  { accent: "us", gender: "m", role: "us-m", label: "US Male", name: "Austin", flag: "🇺🇸", accentLabel: "Mỹ", description: "Giọng nam trầm ấm, phát âm rõ ràng chuẩn Mỹ." },
  { accent: "us", gender: "f", role: "us-f", label: "US Female", name: "Autumn", flag: "🇺🇸", accentLabel: "Mỹ", description: "Giọng nữ tự nhiên, biểu cảm, dễ nghe." },
  { accent: "uk", gender: "m", role: "uk-m", label: "UK Male", name: "Daniel", flag: "🇬🇧", accentLabel: "Anh", description: "Giọng nam Anh quý phái, thanh lịch, chuẩn mực." },
  { accent: "uk", gender: "f", role: "uk-f", label: "UK Female", name: "Diana", flag: "🇬🇧", accentLabel: "Anh", description: "Giọng nữ Anh ngọt ngào, tinh tế, truyền cảm." },
  { accent: "au", gender: "m", role: "au-m", label: "AU Male", name: "Troy", flag: "🇦🇺", accentLabel: "Úc", description: "Giọng nam Úc hào sảng, phóng khoáng, tự nhiên." },
  { accent: "au", gender: "f", role: "au-f", label: "AU Female", name: "Hannah", flag: "🇦🇺", accentLabel: "Úc", description: "Giọng nữ Úc nhẹ nhàng, êm dịu, dễ đồng điệu." },
];

const SPEED_PRESETS = [0.8, 1.0, 1.2, 1.5];

/* ── TOEIC Sample Passages — organised by topic & length ── */
type SampleLength = "short" | "medium" | "long";
type SampleTopic = string;

interface SampleText {
  title: string;
  topic: SampleTopic;
  length: SampleLength;
  icon: string;
  text: string;
}

const TOEIC_TOPICS = [
  { key: "office", label: "Văn phòng", icon: "🏢" },
  { key: "hr", label: "Nhân sự", icon: "👥" },
  { key: "finance", label: "Tài chính", icon: "💰" },
  { key: "marketing", label: "Marketing", icon: "📣" },
  { key: "travel", label: "Du lịch", icon: "✈️" },
  { key: "dining", label: "Ẩm thực", icon: "🍽️" },
  { key: "health", label: "Sức khỏe", icon: "🏥" },
  { key: "technology", label: "Công nghệ", icon: "💻" },
  { key: "manufacturing", label: "Sản xuất", icon: "🏭" },
  { key: "realestate", label: "Bất động sản", icon: "🏠" },
] as const;

const SAMPLE_TEXTS: SampleText[] = [
  // ── Office & Workplace ──
  {
    title: "Họp ngắn buổi sáng",
    topic: "office",
    length: "short",
    icon: "🏢",
    text: "Good morning, everyone. Before we start today's meeting, I'd like to remind all staff members that the monthly report is due by Friday afternoon.",
  },
  {
    title: "Thông báo bảo trì văn phòng",
    topic: "office",
    length: "medium",
    icon: "🏢",
    text: "Please be advised that the building management team will be conducting routine maintenance on the air conditioning system this Saturday. All employees are requested to ensure that their windows are closed and personal belongings are secured before leaving on Friday evening. We apologize for any inconvenience this may cause.",
  },
  {
    title: "Chính sách làm việc từ xa",
    topic: "office",
    length: "long",
    icon: "🏢",
    text: "Following the recent survey results, the management team has decided to implement a hybrid work policy starting next quarter. Employees will be required to work in the office at least three days per week, while the remaining two days can be spent working remotely from home. All team leaders are expected to coordinate schedules within their departments to ensure adequate office coverage. Please note that this policy will be reviewed after a six-month trial period, and adjustments may be made based on productivity metrics and employee feedback.",
  },

  // ── Human Resources ──
  {
    title: "Thông báo tuyển dụng",
    topic: "hr",
    length: "short",
    icon: "👥",
    text: "We are currently seeking a qualified marketing coordinator to join our expanding team. Interested candidates should submit their résumés by the end of next week.",
  },
  {
    title: "Chương trình đào tạo nhân viên",
    topic: "hr",
    length: "medium",
    icon: "👥",
    text: "The Human Resources department is pleased to announce a new professional development program for all full-time employees. The program includes workshops on leadership skills, time management, and effective communication. Registration will open on Monday, and spaces are limited to thirty participants per session. Early registration is strongly encouraged.",
  },
  {
    title: "Đánh giá hiệu suất hàng năm",
    topic: "hr",
    length: "long",
    icon: "👥",
    text: "As we approach the end of the fiscal year, all department managers are reminded to complete performance evaluations for their team members by December fifteenth. The evaluation process has been updated this year to include a self-assessment component, which employees should complete before meeting with their supervisors. Managers are encouraged to provide specific, constructive feedback and to discuss career development goals with each team member. The completed evaluation forms must be submitted to the Human Resources department no later than December twenty-second. A training session on the new evaluation criteria will be held next Tuesday at two o'clock in Conference Room B.",
  },

  // ── Finance & Banking ──
  {
    title: "Báo cáo quý",
    topic: "finance",
    length: "short",
    icon: "💰",
    text: "Our third-quarter revenue exceeded projections by twelve percent, driven primarily by strong sales in the Asia-Pacific region and increased demand for our premium product line.",
  },
  {
    title: "Thay đổi chính sách hoàn tiền",
    topic: "finance",
    length: "medium",
    icon: "💰",
    text: "Effective January first, our refund policy will be updated to allow customers a thirty-day return window for all purchases made online. Refunds will be processed within five to seven business days after the returned item has been received and inspected at our warehouse. Customers are responsible for return shipping costs unless the item is defective or was shipped incorrectly.",
  },
  {
    title: "Kế hoạch ngân sách năm mới",
    topic: "finance",
    length: "long",
    icon: "💰",
    text: "The finance committee has completed its review of the proposed budget for the upcoming fiscal year. After careful analysis of current market conditions and projected growth rates, the committee recommends a fifteen percent increase in the research and development allocation. This investment is expected to support the launch of three new product lines by the third quarter. Additionally, the committee suggests reallocating funds from the travel budget to support the expansion of our digital marketing initiatives. Department heads are invited to submit any objections or alternative proposals by the end of this month. A final budget presentation will be delivered to the board of directors on February tenth.",
  },

  // ── Marketing & Advertising ──
  {
    title: "Ra mắt chiến dịch mới",
    topic: "marketing",
    length: "short",
    icon: "📣",
    text: "Our new social media campaign launches next Monday. The marketing team has prepared engaging content across all major platforms to maximize brand awareness and customer engagement.",
  },
  {
    title: "Phân tích thị trường mục tiêu",
    topic: "marketing",
    length: "medium",
    icon: "📣",
    text: "Recent market research indicates that our target demographic has shifted significantly over the past two years. Consumers between the ages of twenty-five and thirty-four now represent our fastest-growing customer segment. The marketing team recommends adjusting our advertising strategy to focus more heavily on digital channels, particularly short-form video content and influencer partnerships, to better reach this audience.",
  },
  {
    title: "Kế hoạch tái định vị thương hiệu",
    topic: "marketing",
    length: "long",
    icon: "📣",
    text: "Following extensive consumer research and competitive analysis, our brand strategy team has developed a comprehensive rebranding proposal. The new brand identity will feature a modernized logo, updated color palette, and refreshed messaging that emphasizes sustainability and innovation. The rollout will begin with our digital properties in March, followed by updated packaging and in-store materials in May. All customer-facing communications should transition to the new brand guidelines by the end of June. Regional managers are responsible for ensuring that their local marketing materials comply with the updated standards. A detailed brand toolkit will be distributed to all departments next week.",
  },

  // ── Travel & Transportation ──
  {
    title: "Thông báo chuyến bay",
    topic: "travel",
    length: "short",
    icon: "✈️",
    text: "Attention all passengers. Flight seven-two-three to Singapore has been delayed by approximately forty-five minutes due to severe weather conditions. We apologize for the inconvenience.",
  },
  {
    title: "Hướng dẫn đặt phòng khách sạn",
    topic: "travel",
    length: "medium",
    icon: "✈️",
    text: "For employees traveling on company business, please remember to book accommodations through our approved travel management system. The company will reimburse hotel expenses up to one hundred fifty dollars per night for domestic travel and two hundred dollars for international trips. All receipts must be submitted within ten business days of your return. Late submissions may result in delayed reimbursement.",
  },
  {
    title: "Chính sách công tác nước ngoài",
    topic: "travel",
    length: "long",
    icon: "✈️",
    text: "The company has recently updated its international business travel policy to reflect current global conditions. All employees planning overseas trips must submit their travel requests at least three weeks in advance for approval by their department head and the travel coordinator. Business class airfare is approved for flights exceeding eight hours in duration. Travelers are required to purchase comprehensive travel insurance through our corporate provider. Upon arrival at their destination, employees should register with the local embassy or consulate. A per diem allowance will be provided based on the cost-of-living index of the destination country. Detailed guidelines and the updated expense reporting form are available on the company intranet.",
  },

  // ── Dining & Restaurants ──
  {
    title: "Đặt bàn nhà hàng",
    topic: "dining",
    length: "short",
    icon: "🍽️",
    text: "Good evening. I'd like to make a reservation for six people this Saturday at seven o'clock. Could you please seat us near the window if possible?",
  },
  {
    title: "Thực đơn mới theo mùa",
    topic: "dining",
    length: "medium",
    icon: "🍽️",
    text: "We are delighted to introduce our new seasonal menu, featuring locally sourced ingredients and contemporary interpretations of classic dishes. Highlights include a roasted butternut squash soup, pan-seared salmon with citrus glaze, and a rich dark chocolate torte for dessert. Our sommelier has also curated a selection of wines to complement each course. Reservations for the tasting event can be made online.",
  },
  {
    title: "Dịch vụ catering công ty",
    topic: "dining",
    length: "long",
    icon: "🍽️",
    text: "Thank you for choosing our catering service for your upcoming corporate event. Based on our discussion, we have prepared a customized menu that accommodates various dietary requirements, including vegetarian, vegan, and gluten-free options. The package includes a welcome reception with canapés and beverages, a three-course seated dinner, and a dessert station. Our team will arrive two hours before the event to set up, and all equipment will be cleared within one hour after the event concludes. Please confirm the final guest count at least five business days in advance. We look forward to making your event a memorable occasion. Should you have any additional requests or modifications, please do not hesitate to contact our events coordinator.",
  },

  // ── Health & Wellness ──
  {
    title: "Thông báo kiểm tra sức khỏe",
    topic: "health",
    length: "short",
    icon: "🏥",
    text: "All employees are reminded that the annual health screening will take place next Thursday in the first-floor conference room. Please fast for eight hours before your appointment.",
  },
  {
    title: "Chương trình sức khỏe nhân viên",
    topic: "health",
    length: "medium",
    icon: "🏥",
    text: "Our company wellness program has been expanded to include complimentary gym memberships, weekly yoga classes, and monthly nutrition workshops. Employees who participate in at least three wellness activities per quarter will be eligible for a premium discount on their health insurance. Sign-up sheets are available at the front desk, and more information can be found on the employee benefits portal.",
  },
  {
    title: "Hướng dẫn an toàn lao động",
    topic: "health",
    length: "long",
    icon: "🏥",
    text: "In accordance with updated workplace safety regulations, all employees working in the warehouse and manufacturing areas are required to complete a refresher training course on proper equipment handling and emergency procedures. The training sessions will be held during the first two weeks of January, and attendance is mandatory. Topics covered will include the correct use of personal protective equipment, fire evacuation routes, first aid basics, and the reporting process for workplace injuries. Employees who have not completed the training by the deadline will not be permitted to access restricted work areas. Please check the schedule posted on the bulletin board and register for a session that fits your shift. Supervisors are responsible for ensuring full participation from their teams.",
  },

  // ── Technology & IT ──
  {
    title: "Cập nhật hệ thống",
    topic: "technology",
    length: "short",
    icon: "💻",
    text: "The IT department will perform a scheduled system upgrade this weekend. All internal applications will be unavailable from Saturday evening until Sunday morning.",
  },
  {
    title: "Chính sách bảo mật dữ liệu",
    topic: "technology",
    length: "medium",
    icon: "💻",
    text: "In response to recent cybersecurity threats, the IT security team has implemented new data protection protocols. All employees must now use two-factor authentication when accessing company systems remotely. Passwords must be changed every sixty days and must include a combination of uppercase letters, lowercase letters, numbers, and special characters. Please contact the IT help desk if you experience any difficulties with the new security measures.",
  },
  {
    title: "Triển khai phần mềm quản lý mới",
    topic: "technology",
    length: "long",
    icon: "💻",
    text: "We are pleased to announce the rollout of our new enterprise resource planning software, which will replace the current legacy system by the end of the second quarter. The new platform offers improved functionality for inventory management, customer relationship tracking, and financial reporting. A series of training workshops will be conducted throughout March and April to ensure a smooth transition. Each department will receive customized training tailored to their specific workflow requirements. During the transition period, both systems will run simultaneously to prevent any disruption to daily operations. All employees are expected to complete the online orientation module before attending their assigned workshop. Technical support staff will be available around the clock during the first week of full deployment to address any issues promptly.",
  },

  // ── Manufacturing & Production ──
  {
    title: "Báo cáo sản xuất",
    topic: "manufacturing",
    length: "short",
    icon: "🏭",
    text: "Production output for the month of October increased by eight percent compared to the previous quarter, largely due to the installation of new automated assembly equipment.",
  },
  {
    title: "Quy trình kiểm soát chất lượng",
    topic: "manufacturing",
    length: "medium",
    icon: "🏭",
    text: "The quality assurance department has introduced a new inspection protocol for all products leaving our manufacturing facility. Each batch will now undergo a three-stage testing process before being approved for shipment. Products that do not meet our strict quality standards will be flagged for review and may be returned to the production line for rework. This measure is expected to reduce customer complaints by approximately twenty percent.",
  },
  {
    title: "Mở rộng nhà máy sản xuất",
    topic: "manufacturing",
    length: "long",
    icon: "🏭",
    text: "Following the board's approval last month, construction of our new manufacturing facility in the southern industrial zone will commence in early February. The forty-thousand-square-foot plant will house state-of-the-art production lines capable of manufacturing up to ten thousand units per day. The project is expected to be completed within eighteen months and will create approximately three hundred new jobs in the region. During the construction phase, our current facility will continue to operate at full capacity to meet existing customer demand. A dedicated project management team has been assembled to oversee the construction timeline and budget. Regular progress updates will be provided to all stakeholders through monthly briefings and quarterly reports.",
  },

  // ── Real Estate & Housing ──
  {
    title: "Thông báo cho thuê",
    topic: "realestate",
    length: "short",
    icon: "🏠",
    text: "A newly renovated two-bedroom apartment is available for lease starting next month. The unit features modern appliances, hardwood floors, and a private balcony with city views.",
  },
  {
    title: "Hướng dẫn mua nhà",
    topic: "realestate",
    length: "medium",
    icon: "🏠",
    text: "For first-time homebuyers, navigating the mortgage process can seem overwhelming. It is advisable to obtain pre-approval from your bank before beginning your property search. This will give you a clear understanding of your budget and demonstrate to sellers that you are a serious buyer. Additionally, working with a licensed real estate agent can help you identify suitable properties and negotiate favorable terms on your behalf.",
  },
  {
    title: "Dự án phát triển khu đô thị mới",
    topic: "realestate",
    length: "long",
    icon: "🏠",
    text: "The city planning commission has approved a major mixed-use development project in the downtown waterfront district. The development will include two hundred residential units ranging from studio apartments to three-bedroom family homes, along with fifteen thousand square feet of retail space on the ground floor. The design incorporates sustainable building practices, including solar panels, rainwater harvesting systems, and energy-efficient insulation. A public park and pedestrian promenade will connect the development to the existing waterfront trail. Construction is scheduled to begin in the spring, with the first phase of residential units expected to be available for occupancy within two years. Interested buyers can register for priority viewing at the developer's sales office, which opens next Monday.",
  },
];

const MAX_CHARS = 10_000;
const HISTORY_KEY = "read-aloud-history";
const MAX_HISTORY = 50;

/* ── History types ── */
interface HistoryEntry {
  id: string;
  text: string;
  voice: string;
  speed: number;
  createdAt: string; // ISO string
  wordCount: number;
  preview: string; // first ~80 chars
}

/* ── Client-side audio blob cache ── */
const audioBlobCache = new Map<string, string>(); // cacheKey -> objectURL

function makeCacheKey(text: string, voice: string, speed: number): string {
  return `${voice}|${speed}|${text.trim()}`;
}

/* ── localStorage helpers ── */
function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
  } catch { /* quota exceeded — ignore */ }
}

function addHistoryEntry(text: string, voice: string, speed: number): HistoryEntry[] {
  const trimmed = text.trim();
  const entries = loadHistory();

  // De-dup: if identical text+voice+speed exists, move to top
  const existing = entries.findIndex(
    (e) => e.text === trimmed && e.voice === voice && e.speed === speed,
  );
  if (existing >= 0) {
    const [item] = entries.splice(existing, 1);
    item.createdAt = new Date().toISOString();
    entries.unshift(item);
  } else {
    const preview = trimmed.length > 80 ? trimmed.slice(0, 77) + "..." : trimmed;
    entries.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: trimmed,
      voice,
      speed,
      createdAt: new Date().toISOString(),
      wordCount: trimmed.split(/\s+/).length,
      preview,
    });
  }

  const sliced = entries.slice(0, MAX_HISTORY);
  saveHistory(sliced);
  return sliced;
}

/* ── Format time ago ── */
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffS = Math.floor((now - then) / 1000);
  if (diffS < 60) return "vừa xong";
  if (diffS < 3600) return `${Math.floor(diffS / 60)} phút trước`;
  if (diffS < 86400) return `${Math.floor(diffS / 3600)} giờ trước`;
  return `${Math.floor(diffS / 86400)} ngày trước`;
}

/* ══════════════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════════════ */

export default function ReadAloudPage() {
  const [text, setText] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("us-m");
  const [speed, setSpeed] = useState(1);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // History state
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // AI passage generation state
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedLength, setSelectedLength] = useState<SampleLength | "all">("all");
  const [aiPassages, setAiPassages] = useState<SampleText[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Load history on mount
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  // Generate AI passages
  const generateAiPassages = useCallback(async (topic?: string, length?: string) => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/read-aloud/passages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic && topic !== "all" ? topic : undefined,
          length: length && length !== "all" ? length : "medium",
          count: 3,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (data.passages?.length) {
        setAiPassages((prev) => [...data.passages, ...prev].slice(0, 30));
        message.success(`✨ Đã tạo ${data.passages.length} đoạn văn mới bằng AI!`);
      }
    } catch {
      message.error("Không thể tạo đoạn văn. Vui lòng thử lại.");
    } finally {
      setAiLoading(false);
    }
  }, []);

  // Combined passages: AI-generated first, then hardcoded fallbacks
  const allPassages = [...aiPassages, ...SAMPLE_TEXTS];
  const filteredPassages = allPassages.filter((p) => {
    if (selectedTopic !== "all" && p.topic !== selectedTopic) return false;
    if (selectedLength !== "all" && p.length !== selectedLength) return false;
    return true;
  });

  const selectedVoice = VOICES.find((v) => v.role === selectedRole)!;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;
  const estimatedMinutes = Math.ceil(wordCount / (150 * speed));

  /* ── Generate audio (with client blob cache) ── */
  const handleGenerate = useCallback(async () => {
    if (!text.trim()) {
      message.warning("Hãy nhập văn bản trước!");
      return;
    }
    if (text.length > MAX_CHARS) {
      message.error(`Văn bản quá dài! Tối đa ${MAX_CHARS.toLocaleString()} ký tự.`);
      return;
    }

    // Stop current playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrl) {
      // Don't revoke — keep in blob cache
      setAudioUrl(null);
    }

    setLoading(true);
    setPlaying(false);

    const cacheKey = makeCacheKey(text, selectedVoice.role, speed);

    // Check client blob cache first
    const cachedUrl = audioBlobCache.get(cacheKey);
    if (cachedUrl) {
      setAudioUrl(cachedUrl);
      const audio = new Audio(cachedUrl);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.onerror = () => {
        setPlaying(false);
        message.error("Lỗi phát audio");
      };
      await audio.play();
      setPlaying(true);
      setLoading(false);

      // Still add to history
      setHistory(addHistoryEntry(text, selectedVoice.role, speed));
      message.success("⚡ Phát từ bộ nhớ đệm — không tốn token!");
      return;
    }

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/read-aloud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          voice: selectedVoice.role,
          speed,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Lỗi không xác định" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      // Store in client blob cache
      audioBlobCache.set(cacheKey, url);

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.onerror = () => {
        setPlaying(false);
        message.error("Lỗi phát audio");
      };
      await audio.play();
      setPlaying(true);

      // Add to history
      setHistory(addHistoryEntry(text, selectedVoice.role, speed));
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      message.error(err instanceof Error ? err.message : "Lỗi tổng hợp giọng nói");
    } finally {
      setLoading(false);
    }
  }, [text, selectedVoice, speed, audioUrl]);

  /* ── Playback controls ── */
  const togglePlayback = useCallback(() => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  }, [playing]);

  const handleStop = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    // Don't revoke blob URLs — keep them cached
    setAudioUrl(null);
    setPlaying(false);
    setLoading(false);
  }, []);

  const handleClear = useCallback(() => {
    handleStop();
    setText("");
  }, [handleStop]);

  const handlePaste = useCallback(async () => {
    try {
      const clipboard = await navigator.clipboard.readText();
      setText(clipboard);
      message.success("Đã dán từ clipboard!");
    } catch {
      message.error("Không thể truy cập clipboard");
    }
  }, []);

  /* ── History actions ── */
  const handleReplayHistory = useCallback((entry: HistoryEntry) => {
    setText(entry.text);
    setSelectedRole(entry.voice);
    setSpeed(entry.speed);
    setShowHistory(false);
    message.info("Đã tải lại đoạn văn — nhấn \"Bắt đầu nghe đọc\" để phát");
  }, []);

  const handleDeleteHistory = useCallback((id: string) => {
    setHistory((prev) => {
      const next = prev.filter((e) => e.id !== id);
      saveHistory(next);
      return next;
    });
    message.success("Đã xóa mục lịch sử");
  }, []);

  const handleClearAllHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
    // Also clear blob cache
    for (const [, url] of audioBlobCache) {
      URL.revokeObjectURL(url);
    }
    audioBlobCache.clear();
    message.success("Đã xóa toàn bộ lịch sử");
  }, []);

  return (
    <div
      style={{ height: "100%", overflowY: "auto", padding: "var(--space-6)" }}
      className="anim-fade-up"
    >
      <Flex vertical gap="var(--space-5)" style={{ maxWidth: 1080, margin: "0 auto" }}>
        {/* Header */}
        <ModuleHeader
          icon={<SoundOutlined />}
          gradient="linear-gradient(135deg, #4c1d95, #6d28d9 50%, #7c3aed)"
          title="Đọc to — Read Aloud"
          subtitle="Công cụ chuyển đổi văn bản tiếng Anh thành giọng nói thông minh với công nghệ Groq LPU siêu tốc"
        />

        {/* Main Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: "var(--space-5)",
          }}
          className="read-aloud-grid"
        >
          {/* ── Left: Input & Sample area ── */}
          <Flex vertical gap="var(--space-4)">
            <m.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                background: "var(--surface)",
                borderRadius: "var(--radius-xl)",
                border: "1px solid var(--border)",
                padding: "var(--space-5)",
                boxShadow: "var(--shadow-md)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-4)",
                position: "relative",
              }}
            >
              {/* Header Actions */}
              <Flex align="center" justify="space-between">
                <Text style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                  <FileTextOutlined style={{ color: "var(--accent)" }} />
                  Nhập văn bản tiếng Anh
                </Text>
                <Flex gap={8}>
                  <ToolButton
                    icon={<HistoryOutlined />}
                    label={`Lịch sử (${history.length})`}
                    onClick={() => setShowHistory(!showHistory)}
                    active={showHistory}
                  />
                  <ToolButton
                    icon={<CopyOutlined />}
                    label="Dán văn bản"
                    onClick={handlePaste}
                  />
                  <ToolButton
                    icon={<DeleteOutlined />}
                    label="Xóa hết"
                    onClick={handleClear}
                    danger
                  />
                </Flex>
              </Flex>

              {/* Input Area */}
              <div style={{ position: "relative" }}>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={"Dán hoặc nhập một đoạn văn tiếng Anh vào đây để nghe đọc thử...\n\nNhấp vào các văn bản mẫu bên dưới để thử nhanh."}
                  maxLength={MAX_CHARS}
                  style={{
                    width: "100%",
                    minHeight: 320,
                    resize: "vertical",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "var(--space-4)",
                    fontSize: 16,
                    lineHeight: 1.75,
                    fontFamily: "var(--font-body)",
                    color: "var(--text-primary)",
                    background: "var(--surface-alt)",
                    outline: "none",
                    transition: "all 0.25s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.boxShadow = "0 0 0 4px var(--accent-muted)";
                    e.currentTarget.style.background = "var(--surface)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.background = "var(--surface-alt)";
                  }}
                />
              </div>

              {/* Text Stats */}
              <Flex align="center" justify="space-between" style={{ padding: "0 4px" }}>
                <Flex gap={16}>
                  <Stat label="Số từ" value={wordCount.toLocaleString()} />
                  <Stat label="Ký tự" value={`${charCount.toLocaleString()} / ${MAX_CHARS.toLocaleString()}`} />
                </Flex>
                {wordCount > 0 && (
                  <Flex align="center" gap={6} style={{ background: "var(--accent-light)", padding: "4px 10px", borderRadius: 12 }}>
                    <FieldTimeOutlined style={{ fontSize: 12, color: "var(--accent)" }} />
                    <Text style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>
                      Thời gian nghe ước tính: ~{estimatedMinutes} phút
                    </Text>
                  </Flex>
                )}
              </Flex>
            </m.div>

            {/* ── History Panel (collapsible) ── */}
            <AnimatePresence>
              {showHistory && (
                <m.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  style={{ overflow: "hidden" }}
                >
                  <div
                    style={{
                      background: "var(--surface)",
                      borderRadius: "var(--radius-xl)",
                      border: "1px solid var(--border)",
                      padding: "var(--space-5)",
                      boxShadow: "var(--shadow-md)",
                    }}
                  >
                    {/* History header */}
                    <Flex align="center" justify="space-between" style={{ marginBottom: 16 }}>
                      <Flex align="center" gap={8}>
                        <HistoryOutlined style={{ color: "var(--accent)", fontSize: 16 }} />
                        <Text style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>
                          Lịch sử đã nghe ({history.length})
                        </Text>
                      </Flex>
                      <Flex gap={8}>
                        {history.length > 0 && (
                          <m.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={handleClearAllHistory}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "5px 12px",
                              borderRadius: 8,
                              border: "1px solid rgba(239, 68, 68, 0.2)",
                              background: "rgba(239, 68, 68, 0.06)",
                              color: "var(--error)",
                              fontSize: 11.5,
                              fontWeight: 700,
                              cursor: "pointer",
                              fontFamily: "var(--font-body)",
                            }}
                          >
                            <DeleteOutlined style={{ fontSize: 11 }} />
                            Xóa tất cả
                          </m.button>
                        )}
                        <m.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowHistory(false)}
                          style={{
                            display: "grid",
                            placeItems: "center",
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            border: "1px solid var(--border)",
                            background: "var(--surface-alt)",
                            color: "var(--text-muted)",
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          <CloseOutlined />
                        </m.button>
                      </Flex>
                    </Flex>

                    {/* History list */}
                    {history.length === 0 ? (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "32px 16px",
                          color: "var(--text-muted)",
                        }}
                      >
                        <HistoryOutlined style={{ fontSize: 28, marginBottom: 8, opacity: 0.4 }} />
                        <div style={{ fontSize: 13, fontWeight: 600 }}>
                          Chưa có lịch sử nào
                        </div>
                        <div style={{ fontSize: 11.5, marginTop: 4 }}>
                          Khi bạn nghe đọc, các đoạn văn sẽ được lưu tại đây
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 380, overflowY: "auto" }}>
                        {history.map((entry, idx) => {
                          const voice = VOICES.find((v) => v.role === entry.voice);
                          const isCached = audioBlobCache.has(makeCacheKey(entry.text, entry.voice, entry.speed));
                          return (
                            <m.div
                              key={entry.id}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.03 }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                padding: "12px 14px",
                                borderRadius: "var(--radius-lg)",
                                border: "1px solid var(--border)",
                                background: "var(--surface-alt)",
                                cursor: "pointer",
                                transition: "all 0.15s",
                              }}
                              whileHover={{ x: 3, background: "var(--accent-light)" }}
                              onClick={() => handleReplayHistory(entry)}
                            >
                              {/* Voice flag */}
                              <div
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 10,
                                  background: "var(--surface)",
                                  border: "1px solid var(--border)",
                                  display: "grid",
                                  placeItems: "center",
                                  fontSize: 18,
                                  flexShrink: 0,
                                }}
                              >
                                {voice?.flag ?? "🗣️"}
                              </div>

                              {/* Content */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: 13.5,
                                    fontWeight: 700,
                                    color: "var(--text-primary)",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    lineHeight: 1.3,
                                  }}
                                >
                                  {entry.preview}
                                </div>
                                <Flex align="center" gap={8} style={{ marginTop: 3 }}>
                                  <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>
                                    {voice?.name ?? entry.voice} · {entry.speed}x · {entry.wordCount} từ
                                  </span>
                                  <span style={{ fontSize: 10.5, color: "var(--text-muted)" }}>
                                    <ClockCircleOutlined style={{ fontSize: 9, marginRight: 3 }} />
                                    {timeAgo(entry.createdAt)}
                                  </span>
                                  {isCached && (
                                    <span
                                      style={{
                                        fontSize: 9.5,
                                        fontWeight: 800,
                                        padding: "1px 6px",
                                        borderRadius: 6,
                                        background: "rgba(16, 185, 129, 0.1)",
                                        color: "var(--success)",
                                        border: "1px solid rgba(16, 185, 129, 0.2)",
                                      }}
                                    >
                                      ⚡ Cached
                                    </span>
                                  )}
                                </Flex>
                              </div>

                              {/* Delete button */}
                              <m.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteHistory(entry.id);
                                }}
                                style={{
                                  display: "grid",
                                  placeItems: "center",
                                  width: 28,
                                  height: 28,
                                  borderRadius: 8,
                                  border: "1px solid rgba(239, 68, 68, 0.15)",
                                  background: "transparent",
                                  color: "var(--error)",
                                  fontSize: 12,
                                  cursor: "pointer",
                                  flexShrink: 0,
                                  opacity: 0.5,
                                  transition: "opacity 0.15s",
                                }}
                                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                                  e.currentTarget.style.opacity = "1";
                                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
                                }}
                                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                                  e.currentTarget.style.opacity = "0.5";
                                  e.currentTarget.style.background = "transparent";
                                }}
                              >
                                <DeleteOutlined />
                              </m.button>
                            </m.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </m.div>
              )}
            </AnimatePresence>

            {/* ── TOEIC Passage Browser with AI Generation ── */}
            <m.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              style={{
                background: "var(--surface)",
                borderRadius: "var(--radius-xl)",
                border: "1px solid var(--border)",
                padding: "var(--space-5)",
                boxShadow: "var(--shadow-md)",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {/* Header + AI Generate Button */}
              <Flex align="center" justify="space-between" wrap="wrap" gap={8}>
                <Flex align="center" gap={8}>
                  <Text style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    📚 Văn bản mẫu TOEIC ({filteredPassages.length})
                  </Text>
                </Flex>
                <m.button
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => generateAiPassages(selectedTopic, selectedLength)}
                  disabled={aiLoading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 16px",
                    borderRadius: 12,
                    border: "1px solid var(--accent)",
                    background: "var(--accent-light)",
                    color: "var(--accent)",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: aiLoading ? "wait" : "pointer",
                    opacity: aiLoading ? 0.6 : 1,
                    fontFamily: "var(--font-body)",
                    transition: "all 0.2s",
                  }}
                >
                  {aiLoading ? (
                    <><LoadingOutlined spin style={{ fontSize: 12 }} /> Đang tạo...</>
                  ) : (
                    <>✨ Tạo bằng AI</>
                  )}
                </m.button>
              </Flex>

              {/* Topic filter chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                <FilterChip
                  label="Tất cả"
                  active={selectedTopic === "all"}
                  onClick={() => setSelectedTopic("all")}
                />
                {TOEIC_TOPICS.map((t) => (
                  <FilterChip
                    key={t.key}
                    label={`${t.icon} ${t.label}`}
                    active={selectedTopic === t.key}
                    onClick={() => setSelectedTopic(t.key)}
                  />
                ))}
              </div>

              {/* Length filter */}
              <Flex gap={6} align="center">
                <Text style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Độ dài:</Text>
                {(["all", "short", "medium", "long"] as const).map((len) => (
                  <FilterChip
                    key={len}
                    label={len === "all" ? "Tất cả" : len === "short" ? "Ngắn (~30 từ)" : len === "medium" ? "Trung bình (~60 từ)" : "Dài (~120 từ)"}
                    active={selectedLength === len}
                    onClick={() => setSelectedLength(len)}
                  />
                ))}
              </Flex>

              {/* Passage cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 400, overflowY: "auto" }}>
                {filteredPassages.length === 0 ? (
                  <div style={{
                    padding: "24px 16px", textAlign: "center",
                    borderRadius: 14, border: "1px dashed var(--border)",
                    color: "var(--text-muted)", fontSize: 13,
                  }}>
                    Không có đoạn văn nào. Nhấn &quot;✨ Tạo bằng AI&quot; để tạo mới!
                  </div>
                ) : (
                  filteredPassages.map((sample, idx) => (
                    <m.div
                      key={`${sample.topic}-${idx}`}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      whileHover={{ x: 3, background: "var(--accent-light)" }}
                      onClick={() => {
                        setText(sample.text);
                        message.success(`Đã tải: ${sample.title}`);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        padding: "12px 14px",
                        borderRadius: "var(--radius-lg)",
                        border: "1px solid var(--border)",
                        background: "var(--surface-alt)",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: "var(--accent-light)", border: "1px solid var(--border)",
                        display: "grid", placeItems: "center", fontSize: 18, flexShrink: 0,
                      }}>
                        {sample.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)",
                          lineHeight: 1.3,
                        }}>
                          {sample.title}
                        </div>
                        <div style={{
                          fontSize: 12, color: "var(--text-muted)", marginTop: 3,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {sample.text.slice(0, 80)}...
                        </div>
                        <Flex gap={6} style={{ marginTop: 6 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: "1px 8px", borderRadius: 8,
                            background: sample.length === "short" ? "rgba(16,185,129,0.1)" : sample.length === "long" ? "rgba(239,68,68,0.08)" : "rgba(59,130,246,0.1)",
                            color: sample.length === "short" ? "var(--success)" : sample.length === "long" ? "var(--error)" : "var(--info)",
                            border: `1px solid ${sample.length === "short" ? "rgba(16,185,129,0.2)" : sample.length === "long" ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.2)"}`,
                          }}>
                            {sample.length === "short" ? "Ngắn" : sample.length === "long" ? "Dài" : "TB"}
                          </span>
                          <span style={{
                            fontSize: 10, fontWeight: 600, color: "var(--text-muted)",
                          }}>
                            ~{sample.text.split(/\s+/).length} từ
                          </span>
                        </Flex>
                      </div>
                    </m.div>
                  ))
                )}
              </div>
            </m.div>
          </Flex>

          {/* ── Right: Voice & Playback Controls ── */}
          <Flex vertical gap="var(--space-4)">
            {/* Voice Options Card */}
            <m.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                background: "var(--surface)",
                borderRadius: "var(--radius-xl)",
                border: "1px solid var(--border)",
                padding: "var(--space-5)",
                boxShadow: "var(--shadow-md)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-4)",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block" }}>
                🗣️ Chọn giọng đọc
              </Text>

              {/* 3D Voice Grid */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {VOICES.map((v) => {
                  const isActive = selectedRole === v.role;
                  return (
                    <m.button
                      key={v.role}
                      whileHover={{ scale: 1.02, x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedRole(v.role)}
                      style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 14px",
                        borderRadius: "var(--radius-lg)",
                        border: isActive ? "2px solid var(--accent)" : "1px solid var(--border)",
                        background: isActive ? "var(--accent-light)" : "var(--surface-alt)",
                        cursor: "pointer",
                        transition: "all 0.25s ease",
                        textAlign: "left",
                      }}
                    >
                      <span style={{ fontSize: 24, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }}>
                        {v.flag}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Flex align="center" gap={6}>
                          <Text style={{ fontWeight: isActive ? 800 : 700, fontSize: 14, color: isActive ? "var(--accent)" : "var(--text-primary)" }}>
                            {v.name}
                          </Text>
                          <span
                            style={{
                              fontSize: 10,
                              background: v.gender === "m" ? "rgba(59, 130, 246, 0.15)" : "rgba(236, 72, 153, 0.15)",
                              color: v.gender === "m" ? "var(--info)" : "#db2777",
                              padding: "1px 6px",
                              borderRadius: 8,
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            {v.gender === "m" ? <ManOutlined /> : <WomanOutlined />}
                            {v.gender === "m" ? "Nam" : "Nữ"}
                          </span>
                        </Flex>
                        <Text
                          style={{
                            fontSize: 11,
                            color: isActive ? "var(--accent)" : "var(--text-muted)",
                            display: "block",
                            marginTop: 2,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          Giọng {v.accentLabel} • {v.label}
                        </Text>
                      </div>

                      <Tooltip title={v.description} placement="left">
                        <InfoCircleOutlined
                          style={{
                            fontSize: 14,
                            color: "var(--text-muted)",
                            opacity: 0.6,
                            cursor: "help",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Tooltip>

                      {isActive && (
                        <m.div
                          layoutId="selected-indicator"
                          style={{
                            position: "absolute",
                            right: 0,
                            top: "30%",
                            bottom: "30%",
                            width: 3,
                            background: "var(--accent)",
                            borderRadius: "4px 0 0 4px",
                          }}
                        />
                      )}
                    </m.button>
                  );
                })}
              </div>
            </m.div>

            {/* Playback Configuration Card */}
            <m.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              style={{
                background: "var(--surface)",
                borderRadius: "var(--radius-xl)",
                border: "1px solid var(--border)",
                padding: "var(--space-5)",
                boxShadow: "var(--shadow-md)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-4)",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block" }}>
                ⚙️ Cấu hình phát
              </Text>

              {/* Speed Controller */}
              <div>
                <Flex align="center" justify="space-between" style={{ marginBottom: 4 }}>
                  <Text style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>Tốc độ đọc</Text>
                  <Text style={{ fontSize: 14, fontWeight: 800, color: "var(--accent)" }}>{speed}x</Text>
                </Flex>
                <Slider
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={speed}
                  onChange={(val) => setSpeed(val)}
                  tooltip={{ formatter: (val) => `${val}x` }}
                  styles={{
                    track: { background: "var(--accent)" },
                    handle: { borderColor: "var(--accent)", width: 14, height: 14 },
                  }}
                />

                {/* Preset Quick Select Buttons */}
                <Flex justify="space-between" style={{ marginTop: 8 }} gap={6}>
                  {SPEED_PRESETS.map((preset) => (
                    <m.button
                      key={preset}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSpeed(preset)}
                      style={{
                        flex: 1,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "4px 0",
                        borderRadius: 8,
                        border: speed === preset ? "1px solid var(--accent)" : "1px solid var(--border)",
                        background: speed === preset ? "var(--accent-light)" : "var(--surface-alt)",
                        color: speed === preset ? "var(--accent)" : "var(--text-secondary)",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      {preset === 1.0 ? "Chuẩn" : `${preset}x`}
                    </m.button>
                  ))}
                </Flex>
              </div>

              <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />

              {/* Action Buttons */}
              <Flex vertical gap={8}>
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGenerate}
                  disabled={loading || !text.trim()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    padding: "16px 20px",
                    borderRadius: "var(--radius-lg)",
                    border: "none",
                    background: loading || !text.trim()
                      ? "var(--border)"
                      : "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                    color: loading || !text.trim()
                      ? "var(--text-muted)"
                      : "var(--text-on-accent)",
                    fontSize: 16,
                    fontWeight: 800,
                    cursor: loading || !text.trim() ? "not-allowed" : "pointer",
                    boxShadow: !loading && text.trim() ? "0 4px 14px var(--accent-muted)" : "none",
                    transition: "all 0.2s ease",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {loading ? (
                    <>
                      <LoadingOutlined spin />
                      Đang xử lý giọng nói...
                    </>
                  ) : (
                    <>
                      <SoundOutlined />
                      Bắt đầu nghe đọc
                    </>
                  )}
                </m.button>

                <AnimatePresence>
                  {audioUrl && (
                    <m.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ display: "flex", gap: 8, marginTop: 4 }}
                    >
                      <m.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={togglePlayback}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          padding: "12px",
                          borderRadius: "var(--radius-lg)",
                          border: "1px solid var(--border-strong)",
                          background: "var(--surface)",
                          color: "var(--text-primary)",
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {playing ? <PauseCircleOutlined style={{ color: "var(--accent)" }} /> : <PlayCircleOutlined style={{ color: "var(--sage)" }} />}
                        {playing ? "Tạm dừng" : "Tiếp tục phát"}
                      </m.button>
                      <m.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleStop}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "12px 18px",
                          borderRadius: "var(--radius-lg)",
                          border: "1px solid rgba(239, 68, 68, 0.2)",
                          background: "var(--error-bg)",
                          color: "var(--error)",
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        <UndoOutlined />
                      </m.button>
                    </m.div>
                  )}
                </AnimatePresence>
              </Flex>
            </m.div>
          </Flex>
        </div>

        {/* Dynamic Waveform Visualizer */}
        <AnimatePresence>
          {(playing || loading) && (
            <m.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              style={{
                background: "linear-gradient(90deg, var(--surface), var(--surface-alt))",
                borderRadius: "var(--radius-xl)",
                border: "2px solid var(--accent-light)",
                padding: "var(--space-4) var(--space-5)",
                boxShadow: "var(--shadow-md)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <m.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    border: "3px solid var(--accent-light)",
                    borderTopColor: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                />
                <Text style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                  {loading ? (
                    "Đang nén & tạo tệp âm thanh..."
                  ) : (
                    <span>
                      Đang đọc giọng {selectedVoice.flag} <strong style={{ color: "var(--accent)" }}>{selectedVoice.name}</strong> ({selectedVoice.label})
                    </span>
                  )}
                </Text>
              </div>

              {/* Dynamic Soundwave bars */}
              <Flex gap={3} align="flex-end" style={{ height: 36 }}>
                {Array.from({ length: 28 }).map((_, i) => (
                  <m.div
                    key={i}
                    animate={{
                      height: playing
                        ? [6, 12 + Math.random() * 24, 6, 18 + Math.random() * 18, 6]
                        : [6, 10, 6],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.7 + Math.random() * 0.5,
                      delay: i * 0.03,
                      ease: "easeInOut",
                    }}
                    style={{
                      width: 3,
                      borderRadius: 2,
                      background: playing
                        ? "linear-gradient(to top, var(--accent), var(--xp))"
                        : "var(--border-strong)",
                      opacity: playing ? 0.8 : 0.4,
                    }}
                  />
                ))}
              </Flex>
            </m.div>
          )}
        </AnimatePresence>

        {/* Feature Highlights/Guide */}
        <m.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            background: "var(--surface)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--border)",
            padding: "var(--space-5)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <Title level={5} style={{ margin: "0 0 16px 0", color: "var(--text-primary)", fontSize: 15 }}>
            🚀 Luyện phát âm & luyện nghe hiệu quả cùng Read Aloud
          </Title>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {[
              {
                title: "So sánh các giọng đọc",
                desc: "Nghe cùng một đoạn văn với accent Mỹ, Anh hoặc Úc giúp bạn dễ nhận diện sự khác biệt ngữ điệu.",
                emoji: "🌏",
              },
              {
                title: "Bộ nhớ đệm thông minh",
                desc: "Đoạn văn đã nghe sẽ được cache cả trên server và trình duyệt. Nghe lại không tốn thêm token AI!",
                emoji: "⚡",
              },
              {
                title: "Điều chỉnh tốc độ",
                desc: "Giảm tốc độ đọc xuống 0.8x để nghe chi tiết nối âm, tăng tốc lên 1.2x - 1.5x để thử thách phản xạ.",
                emoji: "🎚️",
              },
              {
                title: "Lịch sử & tái sử dụng",
                desc: "Mọi đoạn văn bạn đã nghe đều được lưu lại. Mở lại bất kỳ lúc nào mà không cần nhập lại từ đầu.",
                emoji: "📋",
              },
            ].map((card, i) => (
              <div
                key={i}
                style={{
                  background: "var(--surface-alt)",
                  padding: "14px 16px",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 8 }}>{card.emoji}</div>
                <Text strong style={{ fontSize: 13, display: "block", marginBottom: 4, color: "var(--text-primary)" }}>
                  {card.title}
                </Text>
                <Paragraph style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                  {card.desc}
                </Paragraph>
              </div>
            ))}
          </div>
        </m.div>
      </Flex>

      {/* Responsive adjustments */}
      <style>{`
        @media (max-width: 860px) {
          .read-aloud-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ── Small utility components ── */

function ToolButton({
  icon,
  label,
  onClick,
  danger = false,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  active?: boolean;
}) {
  return (
    <m.button
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        borderRadius: "var(--radius-md)",
        border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
        background: active ? "var(--accent-light)" : "var(--surface-alt)",
        color: danger ? "var(--error)" : active ? "var(--accent)" : "var(--text-secondary)",
        fontSize: 12.5,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "var(--font-body)",
        transition: "all 0.2s",
      }}
    >
      {icon}
      {label}
    </m.button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Flex align="center" gap={4}>
      <Text style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{label}:</Text>
      <Text style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-secondary)" }}>{value}</Text>
    </Flex>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "4px 12px",
        borderRadius: 999,
        border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
        background: active ? "var(--accent-muted)" : "transparent",
        color: active ? "var(--accent)" : "var(--text-muted)",
        fontSize: 11.5,
        fontWeight: active ? 700 : 500,
        cursor: "pointer",
        transition: "all 0.2s",
        fontFamily: "var(--font-body)",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}
