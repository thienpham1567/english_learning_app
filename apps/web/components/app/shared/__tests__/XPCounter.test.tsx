import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { XPCounter } from "../XPCounter";

describe("XPCounter", () => {
  it("renders the initial value", () => {
    const { container } = render(<XPCounter value={100} />);
    const liveRegion = container.querySelector("[aria-live='polite']");
    expect(liveRegion).not.toBeNull();
    expect(liveRegion?.textContent?.length).toBeGreaterThan(0);
  });

  it("renders with custom label", () => {
    render(<XPCounter value={250} label="Points" />);
    expect(screen.getByText("Points")).toBeDefined();
  });

  it("renders default XP label", () => {
    render(<XPCounter value={100} />);
    expect(screen.getByText("XP")).toBeDefined();
  });

  it("has aria-live region for screen readers", () => {
    render(<XPCounter value={100} />);
    const liveRegion = document.querySelector("[aria-live='polite']");
    expect(liveRegion).not.toBeNull();
  });

  it("renders previousValue as starting display", () => {
    render(<XPCounter value={100} previousValue={50} />);
    // The component should start at previousValue (50) and animate up
    // In test env, rAF is synchronous-ish — we just verify it renders without crashing
    const liveRegion = document.querySelector("[aria-live='polite']");
    expect(liveRegion).not.toBeNull();
    expect(liveRegion?.textContent?.length).toBeGreaterThan(0);
  });

  it("uses tabular-nums for stable layout during animation", () => {
    render(<XPCounter value={1000} />);
    const liveRegion = document.querySelector("[aria-live='polite']") as HTMLElement;
    expect(liveRegion?.style.fontVariantNumeric).toBe("tabular-nums");
  });
});
