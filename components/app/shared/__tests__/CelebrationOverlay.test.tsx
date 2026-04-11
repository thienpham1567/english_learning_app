import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { CelebrationOverlay } from "../CelebrationOverlay";

describe("CelebrationOverlay", () => {
  it("renders nothing when visible=false", () => {
    const { container } = render(
      <CelebrationOverlay tier="small" visible={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders small tier with border-flash overlay", () => {
    const { container } = render(
      <CelebrationOverlay tier="small" visible />,
    );
    const el = container.querySelector("[data-tier='small']");
    expect(el).not.toBeNull();
  });

  it("renders medium tier with content slot", () => {
    render(
      <CelebrationOverlay tier="medium" visible>
        <p>Well done!</p>
      </CelebrationOverlay>,
    );
    const el = document.querySelector("[data-tier='medium']");
    expect(el).not.toBeNull();
    expect(screen.getByText("Well done!")).toBeDefined();
  });

  it("renders big tier with confetti particles and content", () => {
    render(
      <CelebrationOverlay tier="big" visible>
        <p>Amazing!</p>
      </CelebrationOverlay>,
    );
    const el = document.querySelector("[data-tier='big']");
    expect(el).not.toBeNull();
    expect(screen.getByText("Amazing!")).toBeDefined();
    // Confetti particles should be present (aria-hidden)
    const particles = document.querySelectorAll("[aria-hidden='true']");
    expect(particles.length).toBeGreaterThan(0);
  });

  it("calls onComplete when small tier mounts (after timeout)", async () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    render(
      <CelebrationOverlay tier="small" visible onComplete={onComplete} />,
    );
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
