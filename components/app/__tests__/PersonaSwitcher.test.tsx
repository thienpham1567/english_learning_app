import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PersonaSwitcher } from "@/components/app/PersonaSwitcher";
import { renderUi } from "@/test/render";

describe("PersonaSwitcher", () => {
  it("renders the current persona label", () => {
    renderUi(<PersonaSwitcher value="simon" onChange={vi.fn()} />);
    expect(screen.getByText("Simon Hosking — Native Fluency")).toBeInTheDocument();
  });

  it("renders christine label when value is christine", () => {
    renderUi(<PersonaSwitcher value="christine" onChange={vi.fn()} />);
    expect(screen.getByText("Christine Ho — IELTS Master")).toBeInTheDocument();
  });

  it("is disabled when the disabled prop is true", () => {
    renderUi(<PersonaSwitcher value="simon" onChange={vi.fn()} disabled />);
    expect(document.querySelector(".ant-select-disabled")).not.toBeNull();
  });
});
