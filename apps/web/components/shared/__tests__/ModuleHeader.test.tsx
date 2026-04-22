import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ModuleHeader } from "../ModuleHeader";

describe("ModuleHeader", () => {
	it("renders title and icon", () => {
		render(
			<ModuleHeader
				icon={<span data-testid="icon">🔥</span>}
				gradient="linear-gradient(135deg, #9AB17A, #7a9660)"
				title="Daily Challenge"
			/>,
		);

		expect(screen.getByText("Daily Challenge")).toBeDefined();
		expect(screen.getByTestId("icon")).toBeDefined();
	});

	it("renders subtitle when provided", () => {
		render(
			<ModuleHeader
				icon={<span>📝</span>}
				gradient="linear-gradient(135deg, #9AB17A, #7a9660)"
				title="Writing Practice"
				subtitle="Improve your IELTS score"
			/>,
		);

		expect(screen.getByText("Writing Practice")).toBeDefined();
		expect(screen.getByText("Improve your IELTS score")).toBeDefined();
	});

	it("renders without subtitle", () => {
		render(
			<ModuleHeader
				icon={<span>📚</span>}
				gradient="linear-gradient(135deg, #9AB17A, #7a9660)"
				title="Flashcards"
			/>,
		);

		expect(screen.getByRole("heading", { name: "Flashcards" })).toBeDefined();
		expect(screen.queryByText("Improve your IELTS score")).toBeNull();
	});

	it("renders action slot when provided", () => {
		render(
			<ModuleHeader
				icon={<span>🎮</span>}
				gradient="linear-gradient(135deg, #9AB17A, #7a9660)"
				title="Quiz"
				action={<button type="button">Start</button>}
			/>,
		);

		expect(screen.getByText("Quiz")).toBeDefined();
		expect(screen.getByRole("button", { name: "Start" })).toBeDefined();
	});

	it("renders without action slot", () => {
		render(
			<ModuleHeader
				icon={<span>📖</span>}
				gradient="linear-gradient(135deg, #9AB17A, #7a9660)"
				title="Dictionary"
			/>,
		);

		expect(screen.getByText("Dictionary")).toBeDefined();
		// No action button rendered
		expect(screen.queryByRole("button")).toBeNull();
	});
});
