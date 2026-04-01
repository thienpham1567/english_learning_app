import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VocabularyStatsBar } from "../VocabularyStatsBar";

const entries = [
  { level: "B1", saved: true },
  { level: "B1", saved: false },
  { level: "A2", saved: true },
  { level: null, saved: false },
];

describe("VocabularyStatsBar", () => {
  it("shows total entry count", () => {
    render(<VocabularyStatsBar entries={entries} />);
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("shows saved count", () => {
    render(<VocabularyStatsBar entries={entries} />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows level pills only for levels with entries", () => {
    render(<VocabularyStatsBar entries={entries} />);
    expect(screen.getByText("B1 2")).toBeInTheDocument();
    expect(screen.getByText("A2 1")).toBeInTheDocument();
    expect(screen.queryByText(/C1/)).not.toBeInTheDocument();
  });
});
