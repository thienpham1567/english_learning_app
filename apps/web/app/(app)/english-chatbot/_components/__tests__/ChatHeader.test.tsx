import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChatHeader } from "@/app/(app)/english-chatbot/_components/ChatHeader";
import { renderUi } from "@/test/render";

describe("ChatHeader", () => {
  it("renders the active persona name", () => {
    renderUi(<ChatHeader personaId="simon" />);
    expect(screen.getByText("Simon Hosking — Native Fluency")).toBeInTheDocument();
  });

  it("renders christine when personaId is christine", () => {
    renderUi(<ChatHeader personaId="christine" />);
    expect(screen.getByText("Christine Ho — IELTS Master")).toBeInTheDocument();
  });

  it("renders an svg avatar", () => {
    const { container } = renderUi(<ChatHeader personaId="eddie" />);
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
