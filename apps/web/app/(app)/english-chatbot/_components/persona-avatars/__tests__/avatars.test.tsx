import { describe, expect, it } from "vitest";

import { SimonAvatar } from "@/app/(app)/english-chatbot/_components/persona-avatars/SimonAvatar";
import { ChristineAvatar } from "@/app/(app)/english-chatbot/_components/persona-avatars/ChristineAvatar";
import { EddieAvatar } from "@/app/(app)/english-chatbot/_components/persona-avatars/EddieAvatar";
import { renderUi } from "@/test/render";

describe("Persona avatars", () => {
  it("SimonAvatar renders an svg", () => {
    const { container } = renderUi(<SimonAvatar />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("SimonAvatar respects size prop", () => {
    const { container } = renderUi(<SimonAvatar size={48} />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("width")).toBe("48");
    expect(svg.getAttribute("height")).toBe("48");
  });

  it("ChristineAvatar renders an svg", () => {
    const { container } = renderUi(<ChristineAvatar />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("ChristineAvatar respects size prop", () => {
    const { container } = renderUi(<ChristineAvatar size={48} />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("width")).toBe("48");
    expect(svg.getAttribute("height")).toBe("48");
  });

  it("EddieAvatar renders an svg", () => {
    const { container } = renderUi(<EddieAvatar />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("EddieAvatar respects size prop", () => {
    const { container } = renderUi(<EddieAvatar size={48} />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("width")).toBe("48");
    expect(svg.getAttribute("height")).toBe("48");
  });
});
