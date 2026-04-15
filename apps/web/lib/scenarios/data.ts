/** Scenario step types */
export type StepType = "vocabulary" | "listening" | "speaking" | "reading" | "writing";

/** A single step in a scenario */
export interface ScenarioStep {
  title: string;
  type: StepType;
  icon: string;
  description: string;
  content: VocabContent | ListeningContent | SpeakingContent | ReadingContent | WritingContent;
  xp: number;
}

export interface VocabContent {
  type: "vocabulary";
  words: Array<{ word: string; translation: string; example: string }>;
}

export interface ListeningContent {
  type: "listening";
  dialogue: string;
  questions: Array<{ question: string; options: string[]; correctIndex: number }>;
}

export interface SpeakingContent {
  type: "speaking";
  situation: string;
  prompts: string[];
  sampleResponses: string[];
}

export interface ReadingContent {
  type: "reading";
  passage: string;
  questions: Array<{ question: string; options: string[]; correctIndex: number }>;
}

export interface WritingContent {
  type: "writing";
  prompt: string;
  hints: string[];
  sampleAnswer: string;
}

/** Full scenario definition */
export interface Scenario {
  id: string;
  title: string;
  emoji: string;
  description: string;
  level: string;
  estimatedMinutes: number;
  steps: ScenarioStep[];
  bonusXp: number;
}

// ── Scenario Definitions ──

export const SCENARIOS: Scenario[] = [
  {
    id: "airport",
    title: "At the Airport",
    emoji: "✈️",
    description: "Học tiếng Anh qua tình huống tại sân bay: check-in, thông báo chuyến bay, và thay đổi vé.",
    level: "B1",
    estimatedMinutes: 20,
    bonusXp: 50,
    steps: [
      {
        title: "Từ vựng sân bay",
        type: "vocabulary",
        icon: "📚",
        description: "Học 10 từ vựng liên quan đến sân bay",
        xp: 15,
        content: {
          type: "vocabulary",
          words: [
            { word: "boarding pass", translation: "thẻ lên máy bay", example: "Please show your boarding pass at the gate." },
            { word: "departure", translation: "khởi hành", example: "The departure time is 3:00 PM." },
            { word: "arrival", translation: "đến nơi", example: "The arrival terminal is on the left." },
            { word: "customs", translation: "hải quan", example: "You need to go through customs after landing." },
            { word: "terminal", translation: "nhà ga", example: "Your flight departs from Terminal 2." },
            { word: "luggage", translation: "hành lý", example: "Please collect your luggage at carousel 5." },
            { word: "check-in", translation: "làm thủ tục", example: "Online check-in opens 24 hours before departure." },
            { word: "gate", translation: "cổng ra máy bay", example: "Boarding will begin at Gate 12." },
            { word: "passport", translation: "hộ chiếu", example: "Don't forget to bring your passport." },
            { word: "delay", translation: "trễ/hoãn", example: "The flight has been delayed by 2 hours." },
          ],
        },
      },
      {
        title: "Nghe thông báo sân bay",
        type: "listening",
        icon: "🎧",
        description: "Nghe và hiểu thông báo tại sân bay",
        xp: 20,
        content: {
          type: "listening",
          dialogue: "Attention passengers on flight VN123 to Ho Chi Minh City. Due to weather conditions, your flight has been delayed. The new departure time is 5:30 PM from Gate 15. Please proceed to the lounge area. We apologize for the inconvenience.",
          questions: [
            { question: "What is the flight number?", options: ["VN321", "VN123", "VN132", "VN213"], correctIndex: 1 },
            { question: "Why is the flight delayed?", options: ["Technical issues", "Weather conditions", "Staff shortage", "Security check"], correctIndex: 1 },
            { question: "What is the new departure time?", options: ["3:30 PM", "4:30 PM", "5:30 PM", "6:30 PM"], correctIndex: 2 },
            { question: "Which gate should passengers go to?", options: ["Gate 12", "Gate 13", "Gate 14", "Gate 15"], correctIndex: 3 },
          ],
        },
      },
      {
        title: "Hội thoại check-in",
        type: "speaking",
        icon: "🗣️",
        description: "Thực hành hội thoại làm thủ tục check-in",
        xp: 20,
        content: {
          type: "speaking",
          situation: "You are at the airport check-in counter. The agent asks you standard questions.",
          prompts: [
            "Agent: Good morning. May I see your passport and booking confirmation?",
            "Agent: Would you like a window or aisle seat?",
            "Agent: Do you have any luggage to check in?",
            "Agent: Here's your boarding pass. Your flight departs from Gate 8 at 2:15 PM.",
          ],
          sampleResponses: [
            "Good morning. Here you are. My name is [Name] and I'm flying to London.",
            "I'd prefer a window seat, please.",
            "Yes, I have one suitcase to check in. And I'll keep this backpack as carry-on.",
            "Thank you very much. Gate 8 at 2:15, got it.",
          ],
        },
      },
      {
        title: "Đọc thông tin chuyến bay",
        type: "reading",
        icon: "📖",
        description: "Đọc hiểu thông tin trên vé và bảng thông báo",
        xp: 20,
        content: {
          type: "reading",
          passage: `BOARDING PASS
━━━━━━━━━━━━━━━━━━━━━━━━
Passenger: NGUYEN VAN A
Flight: VN456
From: HAN (Hanoi) → SGN (Ho Chi Minh City)
Date: 15 Apr 2026
Departure: 14:30  |  Gate: B7
Seat: 12A (Window)  |  Class: Economy
Boarding closes: 14:10
━━━━━━━━━━━━━━━━━━━━━━━━
Note: Passengers must be at the gate at least 20 minutes before departure.`,
          questions: [
            { question: "What is the passenger's destination?", options: ["Hanoi", "Ho Chi Minh City", "Da Nang", "Hue"], correctIndex: 1 },
            { question: "What type of seat does the passenger have?", options: ["Aisle", "Middle", "Window", "Business"], correctIndex: 2 },
            { question: "By what time must the passenger be at the gate?", options: ["14:00", "14:10", "14:20", "14:30"], correctIndex: 1 },
          ],
        },
      },
      {
        title: "Viết email đổi chuyến bay",
        type: "writing",
        icon: "✍️",
        description: "Viết email yêu cầu thay đổi chuyến bay",
        xp: 25,
        content: {
          type: "writing",
          prompt: "Write an email to the airline requesting to change your flight from April 15 to April 17 due to a family emergency. Include your booking reference (VN456) and request a window seat.",
          hints: [
            "Start with a polite greeting",
            "State your booking reference",
            "Explain the reason clearly",
            "Make your specific request",
            "End with a polite closing",
          ],
          sampleAnswer: "Dear Customer Service,\n\nI am writing to request a change to my flight booking (reference: VN456), currently scheduled for April 15. Due to an unexpected family emergency, I need to reschedule my flight to April 17.\n\nI would also like to request a window seat if possible.\n\nI understand there may be a rebooking fee and I am happy to cover any additional costs.\n\nThank you for your assistance.\n\nBest regards,\nNguyen Van A",
        },
      },
    ],
  },
  {
    id: "job-interview",
    title: "Job Interview",
    emoji: "💼",
    description: "Chuẩn bị cho buổi phỏng vấn xin việc bằng tiếng Anh.",
    level: "B2",
    estimatedMinutes: 20,
    bonusXp: 50,
    steps: [
      {
        title: "Từ vựng phỏng vấn",
        type: "vocabulary",
        icon: "📚",
        description: "Từ vựng quan trọng trong phỏng vấn",
        xp: 15,
        content: {
          type: "vocabulary",
          words: [
            { word: "resume", translation: "sơ yếu lý lịch", example: "Please send your resume to HR." },
            { word: "qualifications", translation: "bằng cấp/trình độ", example: "What qualifications do you have?" },
            { word: "salary", translation: "lương", example: "What are your salary expectations?" },
            { word: "strengths", translation: "điểm mạnh", example: "Tell me about your strengths." },
            { word: "experience", translation: "kinh nghiệm", example: "I have 3 years of experience in marketing." },
            { word: "deadline", translation: "hạn chót", example: "I always meet my deadlines." },
            { word: "teamwork", translation: "làm việc nhóm", example: "Teamwork is essential in this role." },
            { word: "promotion", translation: "thăng chức", example: "She received a promotion after 2 years." },
            { word: "reference", translation: "người giới thiệu", example: "Can you provide two references?" },
            { word: "internship", translation: "thực tập", example: "I completed an internship at Google." },
          ],
        },
      },
      {
        title: "Nghe câu hỏi phỏng vấn",
        type: "listening",
        icon: "🎧",
        description: "Nghe và hiểu các câu hỏi phỏng vấn phổ biến",
        xp: 20,
        content: {
          type: "listening",
          dialogue: "Interviewer: Thank you for coming today. Let's start with your background. Can you tell me about yourself and why you're interested in this position? We're looking for someone with strong analytical skills and experience in data management. The role involves working with a team of five people and reporting directly to the department head.",
          questions: [
            { question: "What skills are they looking for?", options: ["Creative skills", "Analytical skills", "Physical skills", "Musical skills"], correctIndex: 1 },
            { question: "How many people are on the team?", options: ["Three", "Four", "Five", "Six"], correctIndex: 2 },
            { question: "Who does the role report to?", options: ["The CEO", "The team leader", "The department head", "The HR manager"], correctIndex: 2 },
          ],
        },
      },
      {
        title: "Trả lời phỏng vấn",
        type: "speaking",
        icon: "🗣️",
        description: "Thực hành trả lời câu hỏi phỏng vấn",
        xp: 20,
        content: {
          type: "speaking",
          situation: "You are in a job interview for a marketing position.",
          prompts: [
            "Tell me about yourself.",
            "Why do you want to work for our company?",
            "What is your greatest strength?",
            "Where do you see yourself in 5 years?",
          ],
          sampleResponses: [
            "I'm a marketing graduate with 2 years of experience in digital advertising. I'm passionate about creating engaging campaigns.",
            "I admire your company's innovative approach and commitment to sustainability. I believe my skills align well with your goals.",
            "My greatest strength is analytical thinking. I can turn complex data into actionable insights.",
            "In 5 years, I hope to be leading a marketing team and driving strategic campaigns for major brands.",
          ],
        },
      },
      {
        title: "Đọc mô tả công việc",
        type: "reading",
        icon: "📖",
        description: "Đọc hiểu mô tả công việc",
        xp: 20,
        content: {
          type: "reading",
          passage: `JOB DESCRIPTION: Marketing Coordinator
━━━━━━━━━━━━━━━━━━━━━━━━
Requirements:
- Bachelor's degree in Marketing or related field
- 2+ years of experience in digital marketing
- Proficient in Google Analytics and social media platforms
- Strong written and verbal communication skills

Responsibilities:
- Plan and execute marketing campaigns
- Analyze campaign performance and prepare reports
- Collaborate with the design team on creative assets
- Manage social media accounts and content calendar

Benefits: Health insurance, 15 days annual leave, flexible working hours`,
          questions: [
            { question: "How many years of experience are required?", options: ["1+ years", "2+ years", "3+ years", "5+ years"], correctIndex: 1 },
            { question: "Which tool should candidates know?", options: ["Photoshop", "Excel", "Google Analytics", "AutoCAD"], correctIndex: 2 },
            { question: "How many days of annual leave?", options: ["10", "12", "15", "20"], correctIndex: 2 },
          ],
        },
      },
      {
        title: "Viết email cảm ơn",
        type: "writing",
        icon: "✍️",
        description: "Viết email cảm ơn sau phỏng vấn",
        xp: 25,
        content: {
          type: "writing",
          prompt: "Write a thank-you email to the interviewer (Mr. Johnson) after your interview for the Marketing Coordinator position.",
          hints: ["Thank them for their time", "Mention something specific from the interview", "Reaffirm your interest", "Keep it professional and brief"],
          sampleAnswer: "Dear Mr. Johnson,\n\nThank you for taking the time to meet with me today. I really enjoyed learning about the marketing team's upcoming campaigns.\n\nOur conversation reinforced my enthusiasm for the Marketing Coordinator role. I'm confident that my experience in digital marketing would be a valuable asset to your team.\n\nPlease don't hesitate to reach out if you need any additional information.\n\nBest regards,\n[Your Name]",
        },
      },
    ],
  },
  {
    id: "restaurant",
    title: "Restaurant",
    emoji: "🍽️",
    description: "Thực hành tiếng Anh khi đi nhà hàng: gọi món, phàn nàn, và trò chuyện.",
    level: "A2",
    estimatedMinutes: 15,
    bonusXp: 40,
    steps: [
      {
        title: "Từ vựng nhà hàng",
        type: "vocabulary",
        icon: "📚",
        description: "Từ vựng cần thiết khi đi nhà hàng",
        xp: 15,
        content: {
          type: "vocabulary",
          words: [
            { word: "appetizer", translation: "món khai vị", example: "Would you like an appetizer to start?" },
            { word: "main course", translation: "món chính", example: "For the main course, I'll have the steak." },
            { word: "dessert", translation: "tráng miệng", example: "What desserts do you have?" },
            { word: "bill", translation: "hóa đơn", example: "Can I have the bill, please?" },
            { word: "reservation", translation: "đặt bàn", example: "I have a reservation for two at 7 PM." },
            { word: "menu", translation: "thực đơn", example: "Could we see the menu, please?" },
            { word: "tip", translation: "tiền boa", example: "It's customary to leave a 15% tip." },
            { word: "waiter", translation: "phục vụ", example: "The waiter was very friendly." },
            { word: "allergic", translation: "dị ứng", example: "I'm allergic to peanuts." },
            { word: "recommend", translation: "gợi ý", example: "What do you recommend?" },
          ],
        },
      },
      {
        title: "Nghe đặt bàn",
        type: "listening",
        icon: "🎧",
        description: "Nghe cuộc gọi đặt bàn",
        xp: 15,
        content: {
          type: "listening",
          dialogue: "Host: Good evening, Bella Italia, how can I help you? Caller: Hi, I'd like to make a reservation for this Saturday. Host: Of course. How many guests? Caller: Four, please. Host: What time would you prefer? Caller: Around 7:30 PM. Host: Perfect. I have a table for four at 7:30. May I have your name? Caller: It's Sarah Williams.",
          questions: [
            { question: "When is the reservation for?", options: ["Friday", "Saturday", "Sunday", "Today"], correctIndex: 1 },
            { question: "How many guests?", options: ["Two", "Three", "Four", "Five"], correctIndex: 2 },
            { question: "What time?", options: ["7:00 PM", "7:15 PM", "7:30 PM", "8:00 PM"], correctIndex: 2 },
          ],
        },
      },
      {
        title: "Gọi món",
        type: "speaking",
        icon: "🗣️",
        description: "Thực hành gọi món tại nhà hàng",
        xp: 15,
        content: {
          type: "speaking",
          situation: "You are at a restaurant and the waiter is taking your order.",
          prompts: [
            "Waiter: Are you ready to order?",
            "Waiter: Would you like any sides with that?",
            "Waiter: And to drink?",
            "Waiter: Would you like to see the dessert menu?",
          ],
          sampleResponses: [
            "Yes, I'd like the grilled salmon, please.",
            "Yes, I'll have a garden salad and some fries.",
            "I'll have a glass of white wine, please.",
            "Yes, please. What do you recommend?",
          ],
        },
      },
      {
        title: "Đọc thực đơn",
        type: "reading",
        icon: "📖",
        description: "Đọc hiểu thực đơn nhà hàng",
        xp: 15,
        content: {
          type: "reading",
          passage: `🍽️ BELLA ITALIA — MENU
━━━━━━━━━━━━━━━━━━━━━━━━
APPETIZERS
• Bruschetta .......................... $8
• Caesar Salad ...................... $10
• Soup of the Day .................. $7

MAIN COURSES
• Grilled Salmon ................... $22 (GF)
• Margherita Pizza ................ $16
• Pasta Carbonara ................ $18
• Chicken Parmesan .............. $20

(GF) = Gluten-Free | (V) = Vegetarian
Service charge: 10% | No outside food`,
          questions: [
            { question: "Which dish is gluten-free?", options: ["Pizza", "Pasta", "Salmon", "Caesar Salad"], correctIndex: 2 },
            { question: "How much is the Pasta Carbonara?", options: ["$16", "$18", "$20", "$22"], correctIndex: 1 },
            { question: "What is the service charge?", options: ["5%", "10%", "15%", "No charge"], correctIndex: 1 },
          ],
        },
      },
      {
        title: "Viết đánh giá nhà hàng",
        type: "writing",
        icon: "✍️",
        description: "Viết đánh giá nhà hàng trực tuyến",
        xp: 20,
        content: {
          type: "writing",
          prompt: "Write a short restaurant review for Bella Italia. Mention the food quality, service, and atmosphere. Give it a rating out of 5 stars.",
          hints: ["Start with overall impression", "Mention specific dishes", "Comment on service", "Give a recommendation"],
          sampleAnswer: "⭐⭐⭐⭐ (4/5)\n\nBella Italia offers a wonderful dining experience. The Grilled Salmon was perfectly cooked and the Caesar Salad was fresh and flavorful. Our waiter was attentive and friendly. The atmosphere was cozy with nice Italian music. The only downside was the wait time for the main course (about 25 minutes). Overall, I'd definitely recommend it for a nice dinner out!",
        },
      },
    ],
  },
  {
    id: "doctor-visit",
    title: "Doctor Visit",
    emoji: "🏥",
    description: "Học cách giao tiếp với bác sĩ bằng tiếng Anh: mô tả triệu chứng và hiểu chỉ dẫn.",
    level: "B1",
    estimatedMinutes: 18,
    bonusXp: 45,
    steps: [
      {
        title: "Từ vựng y tế",
        type: "vocabulary",
        icon: "📚",
        description: "Từ vựng quan trọng khi đi khám bệnh",
        xp: 15,
        content: {
          type: "vocabulary",
          words: [
            { word: "symptom", translation: "triệu chứng", example: "What symptoms are you experiencing?" },
            { word: "prescription", translation: "đơn thuốc", example: "The doctor gave me a prescription for antibiotics." },
            { word: "fever", translation: "sốt", example: "I've had a fever for two days." },
            { word: "headache", translation: "đau đầu", example: "I have a terrible headache." },
            { word: "allergy", translation: "dị ứng", example: "Do you have any allergies?" },
            { word: "appointment", translation: "cuộc hẹn", example: "I'd like to make an appointment." },
            { word: "diagnosis", translation: "chẩn đoán", example: "The diagnosis was a mild infection." },
            { word: "treatment", translation: "điều trị", example: "What treatment do you recommend?" },
            { word: "insurance", translation: "bảo hiểm", example: "Do you have health insurance?" },
            { word: "pharmacy", translation: "nhà thuốc", example: "You can get the medicine at the pharmacy." },
          ],
        },
      },
      {
        title: "Nghe hướng dẫn bác sĩ",
        type: "listening",
        icon: "🎧",
        description: "Nghe và hiểu hướng dẫn từ bác sĩ",
        xp: 20,
        content: {
          type: "listening",
          dialogue: "Doctor: Based on your symptoms, it appears you have a mild upper respiratory infection. I'm going to prescribe an antibiotic — take one tablet twice a day after meals for seven days. Make sure to drink plenty of water and get adequate rest. If your symptoms don't improve within three days, please come back for a follow-up visit.",
          questions: [
            { question: "What is the diagnosis?", options: ["Flu", "Upper respiratory infection", "Stomach bug", "Allergy"], correctIndex: 1 },
            { question: "How often should the medicine be taken?", options: ["Once a day", "Twice a day", "Three times a day", "Four times a day"], correctIndex: 1 },
            { question: "For how many days?", options: ["3 days", "5 days", "7 days", "10 days"], correctIndex: 2 },
            { question: "When should the patient return?", options: ["After 1 day", "After 3 days if no improvement", "After 7 days", "Next month"], correctIndex: 1 },
          ],
        },
      },
      {
        title: "Mô tả triệu chứng",
        type: "speaking",
        icon: "🗣️",
        description: "Thực hành mô tả triệu chứng cho bác sĩ",
        xp: 20,
        content: {
          type: "speaking",
          situation: "You've been feeling unwell and are visiting the doctor.",
          prompts: [
            "Doctor: What seems to be the problem?",
            "Doctor: How long have you had these symptoms?",
            "Doctor: Are you taking any medication?",
            "Doctor: Are you allergic to anything?",
          ],
          sampleResponses: [
            "I've been having a bad cough and a runny nose. I also feel very tired.",
            "It started about three days ago and it's been getting worse.",
            "No, I'm not taking any medication at the moment.",
            "Yes, I'm allergic to penicillin.",
          ],
        },
      },
      {
        title: "Đọc tờ hướng dẫn thuốc",
        type: "reading",
        icon: "📖",
        description: "Đọc hiểu hướng dẫn sử dụng thuốc",
        xp: 15,
        content: {
          type: "reading",
          passage: `💊 AMOXICILLIN 500mg
━━━━━━━━━━━━━━━━━━━━━━━━
Dosage: Take 1 capsule 3 times daily
Duration: Continue for 7 days even if symptoms improve
Take with food to reduce stomach upset

⚠️ WARNINGS:
- Do NOT take if allergic to penicillin
- May cause drowsiness — avoid driving
- Do not consume alcohol while taking this medicine
- Keep out of reach of children

Side effects: Nausea, diarrhea, rash
If severe reaction occurs, seek immediate medical attention`,
          questions: [
            { question: "How many capsules per day?", options: ["1", "2", "3", "4"], correctIndex: 2 },
            { question: "Who should NOT take this medicine?", options: ["Children", "Elderly", "People allergic to penicillin", "Pregnant women"], correctIndex: 2 },
            { question: "What should you avoid while taking this medicine?", options: ["Coffee", "Water", "Alcohol", "Milk"], correctIndex: 2 },
          ],
        },
      },
      {
        title: "Viết tin nhắn xin nghỉ",
        type: "writing",
        icon: "✍️",
        description: "Viết tin nhắn cho quản lý xin nghỉ ốm",
        xp: 20,
        content: {
          type: "writing",
          prompt: "Write a message to your manager explaining that you need to take 2 days off due to illness. The doctor recommended rest.",
          hints: ["Keep it brief and professional", "Mention the doctor's advice", "State how many days off", "Offer to catch up on work"],
          sampleAnswer: "Hi [Manager],\n\nI'm writing to let you know that I'm not feeling well and visited the doctor this morning. I've been diagnosed with a respiratory infection and the doctor recommended 2 days of rest.\n\nI'll be off today and tomorrow, and plan to return on Thursday. I'll make sure to catch up on any urgent tasks when I'm back.\n\nPlease let me know if there's anything critical I need to hand over.\n\nThank you for understanding.\n[Your Name]",
        },
      },
    ],
  },
];

/** Get a scenario by ID */
export function getScenarioById(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
