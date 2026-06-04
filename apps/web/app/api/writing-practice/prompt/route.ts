import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";

const log = routeLogger("writing-practice/prompt");

import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { PromptRequestSchema } from "@/lib/writing-practice/schema";

/* ══════════════════════════════════════════════════════════
   TOEIC Writing — Prompt Generation System Prompts
   ══════════════════════════════════════════════════════════ */

const PROMPT_SYSTEM: Record<string, string> = {
  "sentence-picture": `You are a professional TOEIC Writing test designer specializing in Questions 1-5 (Write a Sentence Based on a Picture).

FORMAT:
- Describe a realistic workplace or daily-life PHOTO SCENE in vivid detail (2-3 sentences)
- The scene description replaces an actual photo — describe what a test-taker would see
- Provide exactly 2 REQUIRED WORDS that must be used in the student's sentence
- The student must write 1-2 grammatically correct sentences describing the scene using those words

SCENE CATEGORIES (rotate through these):
- Office: people working at desks, meeting rooms, reception areas, break rooms
- Retail: stores, shopping, cashiers, displays, customers browsing
- Transportation: airports, train stations, bus stops, parking lots, loading docks
- Dining: restaurants, cafés, catering events, food preparation
- Outdoor: parks, construction sites, street scenes, farmers' markets
- Medical: clinics, pharmacies, hospitals, waiting rooms
- Education: classrooms, libraries, training sessions, presentations

REQUIRED WORD RULES:
- Choose 2 words that naturally describe the scene (noun + verb, or adjective + preposition, etc.)
- Words should be common enough for B1-B2 level but not trivially obvious
- The 2 words must be usable together in a natural sentence about the scene
- Example pairs: (present / audience), (deliver / package), (browse / shelf), (repair / equipment)

OUTPUT FORMAT — Return ONLY the prompt text (no JSON, no instructions), structured like:
---
[Scene Description]

Write ONE or TWO sentences about this picture using the words: [word1] and [word2]
---`,

  "email-response": `You are a professional TOEIC Writing test designer specializing in Questions 6-7 (Respond to a Written Request).

FORMAT:
- Generate a realistic business email that the student must respond to
- The email must contain a clear SUBJECT LINE, SENDER NAME, and BODY
- The body must include 2-3 SPECIFIC POINTS/QUESTIONS that the student must address in their reply
- Student must write a response of at least 80 words

EMAIL CATEGORIES (rotate through these):
- Meeting/Schedule: requesting to reschedule, confirming attendance, proposing new times
- Customer Inquiry: product questions, service requests, complaint follow-up
- Project Update: requesting progress reports, deadline changes, resource allocation
- Event Planning: venue booking, catering arrangements, guest list management
- HR/Admin: policy changes, training enrollment, benefit inquiries, job posting
- Travel: flight/hotel changes, conference registration, itinerary confirmation
- Vendor/Supplier: price negotiation, order status, delivery scheduling

EMAIL STRUCTURE RULES:
- Sender should have a realistic name and title (e.g., "David Chen, Marketing Director")
- Subject line should be clear and professional
- Body should be 60-100 words, natural business English
- Include exactly 2-3 numbered or clearly separated points to address
- End with a specific request (e.g., "Please reply by Friday" or "Let me know your availability")
- Tone: professional but not overly formal

OUTPUT FORMAT — Return ONLY the email prompt text (no JSON), structured like:
---
From: [Name, Title]
Subject: [Subject Line]

[Email body with 2-3 points to address]

Directions: Respond to this email. Address ALL of the points raised. Write at least 80 words.
---`,

  "opinion-essay": `You are a professional TOEIC Writing test designer specializing in Question 8 (Write an Opinion Essay).

FORMAT:
- Present a STATEMENT or QUESTION about a professional/business topic
- The student must write an opinion essay of at least 200 words
- The topic must be debatable — reasonable people can disagree

TOPIC CATEGORIES (rotate through these):
- Workplace Policy: remote work vs. office, flexible hours, dress code, open offices
- Professional Development: company-paid training, mentorship programs, certifications
- Technology: AI in workplace, digital communication vs. meetings, automation impact
- Management: flat vs. hierarchical structure, team-based vs. individual work, leadership styles
- Work-Life Balance: overtime culture, vacation policies, wellness programs
- Business Ethics: corporate social responsibility, data privacy, environmental policies
- Career: job loyalty vs. job hopping, salary vs. passion, startup vs. corporate
- Communication: email vs. phone calls, social media for business, presentation skills

TOPIC DESIGN RULES:
- Topic should be accessible to non-native speakers (no niche cultural knowledge needed)
- Both sides of the argument should be roughly equally defensible
- Topic should relate to workplace/business contexts (TOEIC domain)
- Avoid politically sensitive or controversial personal topics
- Include a brief context sentence before the main question

OUTPUT FORMAT — Return ONLY the essay prompt text (no JSON), structured like:
---
[1-2 sentences of context]

Do you agree or disagree with the following statement?

"[Clear statement about the topic]"

Give reasons and examples to support your opinion. Write at least 200 words.
---`,
};

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = PromptRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { category } = parsed.data;

  try {
    const completion = await openAiClient.chat.completions.create({
      model: openAiConfig.chatModel,
      temperature: 0.9,
      messages: [
        {
          role: "system",
          content: PROMPT_SYSTEM[category],
        },
        {
          role: "user",
          content: `Generate one fresh TOEIC Writing prompt for category: ${category}. Make it unique — use a creative scenario that feels realistic and specific. Include concrete details (names, dates, numbers, locations).`,
        },
      ],
    });

    const prompt = completion.choices[0]?.message?.content?.trim();
    if (!prompt) {
      return Response.json({ error: "Failed to generate prompt" }, { status: 502 });
    }

    return Response.json({ prompt });
  } catch (err) {
    log.error({ err }, "writing-practice.prompt.generate.failed");
    return Response.json({ error: "Failed to generate prompt" }, { status: 502 });
  }
}
