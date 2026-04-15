import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressSegments } from "../ProgressSegments";

describe("ProgressSegments", () => {
	it("renders correct number of segments", () => {
		const { container } = render(
			<ProgressSegments current={2} total={5} />,
		);

		const segments = container.querySelectorAll("[data-segment]");
		expect(segments.length).toBe(5);
	});

	it("marks completed, current, and remaining segments correctly", () => {
		const { container } = render(
			<ProgressSegments current={2} total={5} />,
		);

		const segments = container.querySelectorAll("[data-segment]");

		// First 2 segments completed
		expect(segments[0].getAttribute("data-segment")).toBe("completed");
		expect(segments[1].getAttribute("data-segment")).toBe("completed");

		// Third segment is current
		expect(segments[2].getAttribute("data-segment")).toBe("current");

		// Last 2 remaining
		expect(segments[3].getAttribute("data-segment")).toBe("remaining");
		expect(segments[4].getAttribute("data-segment")).toBe("remaining");
	});

	it("has correct ARIA attributes", () => {
		render(<ProgressSegments current={3} total={10} />);

		const progressbar = screen.getByRole("progressbar");
		expect(progressbar.getAttribute("aria-valuenow")).toBe("3");
		expect(progressbar.getAttribute("aria-valuemin")).toBe("0");
		expect(progressbar.getAttribute("aria-valuemax")).toBe("10");
	});

	it("shows label when showLabels is true", () => {
		render(<ProgressSegments current={2} total={5} showLabels />);

		expect(screen.getByText("2 of 5")).toBeDefined();
	});

	it("does not show label when showLabels is false", () => {
		render(<ProgressSegments current={2} total={5} />);

		expect(screen.queryByText("2 of 5")).toBeNull();
	});

	it("handles edge case: current equals total (all completed)", () => {
		const { container } = render(
			<ProgressSegments current={3} total={3} />,
		);

		const segments = container.querySelectorAll("[data-segment]");
		// All 3 should be completed
		for (const seg of segments) {
			expect(seg.getAttribute("data-segment")).toBe("completed");
		}
	});

	it("handles edge case: current is 0 (none completed)", () => {
		const { container } = render(
			<ProgressSegments current={0} total={4} />,
		);

		const segments = container.querySelectorAll("[data-segment]");
		expect(segments[0].getAttribute("data-segment")).toBe("current");
		expect(segments[1].getAttribute("data-segment")).toBe("remaining");
	});
});
