import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VerbFormsSection } from "@/components/dictionary/VerbFormsSection";
import type { VerbForm } from "@/lib/schemas/vocabulary";

beforeEach(() => {
  window.speechSynthesis = {
    speak: vi.fn(),
    cancel: vi.fn(),
  } as unknown as SpeechSynthesis;
  vi.stubGlobal(
    "SpeechSynthesisUtterance",
    class {
      text = "";
      lang = "";
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    },
  );
});

const REGULAR_FORMS: VerbForm[] = [
  {
    label: "Infinitive",
    form: "sustain",
    phoneticsUs: "/səˈsteɪn/",
    phoneticsUk: "/səˈsteɪn/",
    isIrregular: false,
  },
  {
    label: "3rd Person Singular",
    form: "sustains",
    phoneticsUs: "/səˈsteɪnz/",
    phoneticsUk: "/səˈsteɪnz/",
    isIrregular: false,
  },
  {
    label: "Past Simple",
    form: "sustained",
    phoneticsUs: "/səˈsteɪnd/",
    phoneticsUk: "/səˈsteɪnd/",
    isIrregular: false,
  },
  {
    label: "Past Participle",
    form: "sustained",
    phoneticsUs: "/səˈsteɪnd/",
    phoneticsUk: "/səˈsteɪnd/",
    isIrregular: false,
  },
  {
    label: "Present Participle",
    form: "sustaining",
    phoneticsUs: "/səˈsteɪnɪŋ/",
    phoneticsUk: "/səˈsteɪnɪŋ/",
    isIrregular: false,
  },
];

const IRREGULAR_FORMS: VerbForm[] = [
  {
    label: "Infinitive",
    form: "go",
    phoneticsUs: "/ɡoʊ/",
    phoneticsUk: "/ɡəʊ/",
    isIrregular: false,
  },
  {
    label: "3rd Person Singular",
    form: "goes",
    phoneticsUs: "/ɡoʊz/",
    phoneticsUk: "/ɡəʊz/",
    isIrregular: false,
  },
  {
    label: "Past Simple",
    form: "went",
    phoneticsUs: "/wɛnt/",
    phoneticsUk: "/wɛnt/",
    isIrregular: true,
  },
  {
    label: "Past Participle",
    form: "gone",
    phoneticsUs: "/ɡɔːn/",
    phoneticsUk: "/ɡɒn/",
    isIrregular: true,
  },
  {
    label: "Present Participle",
    form: "going",
    phoneticsUs: "/ˈɡoʊɪŋ/",
    phoneticsUk: "/ˈɡəʊɪŋ/",
    isIrregular: false,
  },
];

async function expandAccordion() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: /DẠNG ĐỘNG TỪ/i }));
}

describe("VerbFormsSection", () => {
  it("renders section header as a button with the title and item count", () => {
    render(<VerbFormsSection verbForms={REGULAR_FORMS} />);
    expect(screen.getByRole("button", { name: /DẠNG ĐỘNG TỪ/i })).toBeInTheDocument();
    expect(screen.getByText(/5 dạng/)).toBeInTheDocument();
  });

  it("renders collapsed by default — form labels are not visible", () => {
    render(<VerbFormsSection verbForms={REGULAR_FORMS} />);
    expect(screen.queryByText("Infinitive")).not.toBeInTheDocument();
    expect(screen.queryByText("sustain")).not.toBeInTheDocument();
  });

  it("expands to show content when the header button is clicked", async () => {
    render(<VerbFormsSection verbForms={REGULAR_FORMS} />);
    await expandAccordion();
    expect(await screen.findByText("Infinitive")).toBeInTheDocument();
    expect(screen.getByText("sustain")).toBeInTheDocument();
  });

  it("collapses again when the header button is clicked a second time", async () => {
    render(<VerbFormsSection verbForms={REGULAR_FORMS} />);
    await expandAccordion();
    await screen.findByText("Infinitive");
    await expandAccordion();
    expect(screen.queryByText("Infinitive")).not.toBeInTheDocument();
  });

  it("renders all verb form labels and forms when expanded", async () => {
    render(<VerbFormsSection verbForms={REGULAR_FORMS} />);
    await expandAccordion();
    expect(await screen.findByText("Infinitive")).toBeInTheDocument();
    expect(screen.getByText("sustain")).toBeInTheDocument();
    expect(screen.getByText("Past Simple")).toBeInTheDocument();
    const sustainedElements = screen.getAllByText("sustained");
    expect(sustainedElements.length).toBe(2);
    expect(screen.getByText("Present Participle")).toBeInTheDocument();
    expect(screen.getByText("sustaining")).toBeInTheDocument();
  });

  it("renders IPA transcriptions when expanded", async () => {
    render(<VerbFormsSection verbForms={REGULAR_FORMS} />);
    await expandAccordion();
    await screen.findByText("Infinitive");
    expect(screen.getByText((_, el) => el?.textContent === "🇺🇸 /səˈsteɪn/")).toBeInTheDocument();
    const sustainedIpa = screen.getAllByText((_, el) => el?.textContent === "🇺🇸 /səˈsteɪnd/");
    expect(sustainedIpa.length).toBe(2);
  });

  it("shows irregular badge for irregular forms when expanded", async () => {
    render(<VerbFormsSection verbForms={IRREGULAR_FORMS} />);
    await expandAccordion();
    const badges = await screen.findAllByText("Bất quy tắc");
    expect(badges).toHaveLength(2);
  });

  it("does not show irregular badge for regular forms when expanded", async () => {
    render(<VerbFormsSection verbForms={REGULAR_FORMS} />);
    await expandAccordion();
    await screen.findByText("Infinitive");
    expect(screen.queryByText("Bất quy tắc")).not.toBeInTheDocument();
  });

  it("has audio buttons for each form when expanded", async () => {
    render(<VerbFormsSection verbForms={REGULAR_FORMS} />);
    await expandAccordion();
    const audioButtons = await screen.findAllByRole("button", {
      name: /Play pronunciation/i,
    });
    expect(audioButtons.length).toBe(REGULAR_FORMS.length);
  });

  it("calls speechSynthesis.speak when audio button clicked", async () => {
    const user = userEvent.setup();
    render(<VerbFormsSection verbForms={REGULAR_FORMS} />);
    await expandAccordion();
    const audioButtons = await screen.findAllByRole("button", {
      name: /Play pronunciation/i,
    });
    await user.click(audioButtons[0]);
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
  });
});
