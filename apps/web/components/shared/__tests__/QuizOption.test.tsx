import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

import { QuizOption } from "@/components/shared/QuizOption";
import { renderUi } from "@/test/render";

describe("QuizOption", () => {
  it("renders label and prefix", () => {
    renderUi(<QuizOption prefix="A" label="Answer one" state="idle" onSelect={() => {}} />);

    expect(screen.getByRole("button", { name: /A. Answer one/ })).toBeInTheDocument();
  });

  it("calls onSelect when clicked", () => {
    const onSelect = vi.fn();
    renderUi(<QuizOption prefix="B" label="Answer two" state="idle" onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("marks selected option with aria-pressed", () => {
    renderUi(<QuizOption prefix="C" label="Answer three" state="selected" onSelect={() => {}} />);

    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("disables interaction when disabled", () => {
    renderUi(<QuizOption prefix="D" label="Answer four" state="idle" disabled onSelect={() => {}} />);

    expect(screen.getByRole("button")).toBeDisabled();
  });
});
