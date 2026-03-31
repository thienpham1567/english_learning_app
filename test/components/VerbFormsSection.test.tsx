import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VerbFormsSection } from "@/components/dictionary/VerbFormsSection";
import type { VerbForm } from "@/lib/schemas/vocabulary";

// Mock Web Speech API
beforeEach(() => {
  window.speechSynthesis = {
    speak: vi.fn(),
    cancel: vi.fn(),
  } as unknown as SpeechSynthesis;
  vi.stubGlobal("SpeechSynthesisUtterance", class {
    text = "";
    lang = "";
    onstart: (() => void) | null = null;
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(text: string) {
      this.text = text;
    }
  });
});

const REGULAR_FORMS: VerbForm[] = [
  { label: "Infinitive", form: "sustain", phoneticsUs: "/səˈsteɪn/", phoneticsUk: "/səˈsteɪn/", isIrregular: false },
  { label: "3rd Person Singular", form: "sustains", phoneticsUs: "/səˈsteɪnz/", phoneticsUk: "/səˈsteɪnz/", isIrregular: false },
  { label: "Past Simple", form: "sustained", phoneticsUs: "/səˈsteɪnd/", phoneticsUk: "/səˈsteɪnd/", isIrregular: false },
  { label: "Past Participle", form: "sustained", phoneticsUs: "/səˈsteɪnd/", phoneticsUk: "/səˈsteɪnd/", isIrregular: false },
  { label: "Present Participle", form: "sustaining", phoneticsUs: "/səˈsteɪnɪŋ/", phoneticsUk: "/səˈsteɪnɪŋ/", isIrregular: false },
];

const IRREGULAR_FORMS: VerbForm[] = [
  { label: "Infinitive", form: "go", phoneticsUs: "/ɡoʊ/", phoneticsUk: "/ɡəʊ/", isIrregular: false },
  { label: "3rd Person Singular", form: "goes", phoneticsUs: "/ɡoʊz/", phoneticsUk: "/ɡəʊz/", isIrregular: false },
  { label: "Past Simple", form: "went", phoneticsUs: "/wɛnt/", phoneticsUk: "/wɛnt/", isIrregular: true },
  { label: "Past Participle", form: "gone", phoneticsUs: "/ɡɔːn/", phoneticsUk: "/ɡɒn/", isIrregular: true },
  { label: "Present Participle", form: "going", phoneticsUs: "/ˈɡoʊɪŋ/", phoneticsUk: "/ˈɡəʊɪŋ/", isIrregular: false },
];

describe("VerbFormsSection", () => {
  it("renders all verb form labels and forms", () => {
    render(<VerbFormsSection verbForms={REGULAR_FORMS} />);
    expect(screen.getByText("Infinitive")).toBeInTheDocument();
    expect(screen.getByText("sustain")).toBeInTheDocument();
    expect(screen.getByText("Past Simple")).toBeInTheDocument();
    const sustainedElements = screen.getAllByText("sustained");
    expect(sustainedElements.length).toBe(2); // Past Simple + Past Participle
    expect(screen.getByText("Present Participle")).toBeInTheDocument();
    expect(screen.getByText("sustaining")).toBeInTheDocument();
  });

  it("renders IPA transcriptions", () => {
    render(<VerbFormsSection verbForms={REGULAR_FORMS} />);
    expect(screen.getByText("/səˈsteɪn/")).toBeInTheDocument();
    const sustainedIpa = screen.getAllByText("/səˈsteɪnd/");
    expect(sustainedIpa.length).toBe(2); // Past Simple + Past Participle
  });

  it("shows irregular badge for irregular forms", () => {
    render(<VerbFormsSection verbForms={IRREGULAR_FORMS} />);
    const badges = screen.getAllByText("Bất quy tắc");
    expect(badges).toHaveLength(2);
  });

  it("does not show irregular badge for regular forms", () => {
    render(<VerbFormsSection verbForms={REGULAR_FORMS} />);
    expect(screen.queryByText("Bất quy tắc")).not.toBeInTheDocument();
  });

  it("renders section header", () => {
    render(<VerbFormsSection verbForms={REGULAR_FORMS} />);
    expect(screen.getByText("DẠNG ĐỘNG TỪ")).toBeInTheDocument();
  });

  it("has audio buttons for each form", () => {
    render(<VerbFormsSection verbForms={REGULAR_FORMS} />);
    const audioButtons = screen.getAllByRole("button", { name: /Play pronunciation/i });
    expect(audioButtons.length).toBe(REGULAR_FORMS.length);
  });

  it("calls speechSynthesis.speak when audio button clicked", async () => {
    const user = userEvent.setup();
    render(<VerbFormsSection verbForms={REGULAR_FORMS} />);
    const audioButtons = screen.getAllByRole("button", { name: /Play pronunciation/i });
    await user.click(audioButtons[0]);
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
  });
});
