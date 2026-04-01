import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PersonaSwitcher } from "@/components/app/english-chatbot/PersonaSwitcher";
import { renderUi } from "@/test/render";

describe("PersonaSwitcher", () => {
  it("renders a button with the active persona avatar", () => {
    const { container } = renderUi(<PersonaSwitcher value="simon" onChange={vi.fn()} />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("opens dropdown and shows all persona labels on click", async () => {
    const user = userEvent.setup();
    renderUi(<PersonaSwitcher value="simon" onChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /persona/i }));

    expect(screen.getByText("Simon Hosking — Native Fluency")).toBeInTheDocument();
    expect(screen.getByText("Christine Ho — IELTS Master")).toBeInTheDocument();
    expect(screen.getByText("Eddie Oliver — TOEIC Master")).toBeInTheDocument();
  });

  it("calls onChange with the selected persona id", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderUi(<PersonaSwitcher value="simon" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /persona/i }));
    await user.click(screen.getByText("Christine Ho — IELTS Master"));

    expect(onChange).toHaveBeenCalledWith("christine");
  });

  it("closes the dropdown after selecting a persona", async () => {
    const user = userEvent.setup();
    renderUi(<PersonaSwitcher value="simon" onChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /persona/i }));
    expect(screen.getByText("Christine Ho — IELTS Master")).toBeInTheDocument();

    await user.click(screen.getByText("Christine Ho — IELTS Master"));
    await waitFor(() =>
      expect(screen.queryByText("Christine Ho — IELTS Master")).not.toBeInTheDocument()
    );
  });

  it("button is disabled when disabled prop is true", () => {
    renderUi(<PersonaSwitcher value="simon" onChange={vi.fn()} disabled />);
    expect(screen.getByRole("button", { name: /persona/i })).toBeDisabled();
  });
});
