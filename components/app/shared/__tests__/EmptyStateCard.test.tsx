import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EmptyStateCard } from "../EmptyStateCard";

describe("EmptyStateCard", () => {
	it("renders headline and icon", () => {
		render(
			<EmptyStateCard
				icon={<span data-testid="empty-icon">📚</span>}
				headline="Chưa có từ vựng"
			/>,
		);

		expect(screen.getByText("Chưa có từ vựng")).toBeDefined();
		expect(screen.getByTestId("empty-icon")).toBeDefined();
	});

	it("renders description when provided", () => {
		render(
			<EmptyStateCard
				icon={<span>📚</span>}
				headline="Chưa có từ vựng"
				description="Hãy tra từ đầu tiên để bắt đầu!"
			/>,
		);

		expect(screen.getByText("Hãy tra từ đầu tiên để bắt đầu!")).toBeDefined();
	});

	it("renders CTA button when both ctaLabel and onCtaClick provided", () => {
		const onCtaClick = vi.fn();

		render(
			<EmptyStateCard
				icon={<span>📚</span>}
				headline="Chưa có từ vựng"
				ctaLabel="Bắt đầu học ngay!"
				onCtaClick={onCtaClick}
			/>,
		);

		const button = screen.getByRole("button", { name: "Bắt đầu học ngay!" });
		expect(button).toBeDefined();
	});

	it("CTA click triggers callback", () => {
		const onCtaClick = vi.fn();

		render(
			<EmptyStateCard
				icon={<span>📚</span>}
				headline="Chưa có từ vựng"
				ctaLabel="Bắt đầu"
				onCtaClick={onCtaClick}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Bắt đầu" }));
		expect(onCtaClick).toHaveBeenCalledTimes(1);
	});

	it("renders without optional props (no description, no CTA)", () => {
		render(
			<EmptyStateCard
				icon={<span>📚</span>}
				headline="Nothing here"
			/>,
		);

		expect(screen.getByText("Nothing here")).toBeDefined();
		expect(screen.queryByRole("button")).toBeNull();
	});

	it("does not render CTA if only ctaLabel is provided without onCtaClick", () => {
		render(
			<EmptyStateCard
				icon={<span>📚</span>}
				headline="Nothing here"
				ctaLabel="Click me"
			/>,
		);

		// Button should not render without onCtaClick
		expect(screen.queryByRole("button")).toBeNull();
	});
});
