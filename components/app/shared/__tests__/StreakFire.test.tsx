import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StreakFire } from "../StreakFire";

describe("StreakFire", () => {
  it("renders with small size for streak < 7", () => {
    const { container } = render(<StreakFire streak={1} />);
    const el = container.querySelector("[data-streak-size='small']");
    expect(el).not.toBeNull();
  });

  it("renders with medium size for streak 7-29", () => {
    const { container } = render(<StreakFire streak={7} />);
    const el = container.querySelector("[data-streak-size='medium']");
    expect(el).not.toBeNull();
  });

  it("renders with large size for streak >= 30", () => {
    const { container } = render(<StreakFire streak={30} />);
    const el = container.querySelector("[data-streak-size='large']");
    expect(el).not.toBeNull();
  });

  it("shows streak count by default", () => {
    render(<StreakFire streak={5} />);
    expect(screen.getByText("5")).toBeDefined();
  });

  it("hides streak count when showCount=false", () => {
    render(<StreakFire streak={5} showCount={false} />);
    expect(screen.queryByText("5")).toBeNull();
  });

  it("does not show count for streak=0", () => {
    render(<StreakFire streak={0} />);
    expect(screen.queryByText("0")).toBeNull();
  });

  it("renders extra flame particles for large size", () => {
    const { container } = render(<StreakFire streak={30} />);
    // Should have aria-hidden particles (2 extra for large)
    const particles = container.querySelectorAll("[aria-hidden='true']");
    expect(particles.length).toBe(2);
  });
});
