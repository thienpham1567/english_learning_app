import { renderToStaticMarkup } from "react-dom/server";

import RootLayout from "@/app/layout";

vi.mock("next/font/google", () => ({
  Source_Sans_3: () => ({ variable: "font-body" }),
  Fraunces: () => ({ variable: "font-display" }),
  JetBrains_Mono: () => ({ variable: "font-mono" }),
}));

describe("RootLayout", () => {
  it("keeps the body typography baseline on the root shell", () => {
    const markup = renderToStaticMarkup(
      <RootLayout>
        <div>Xin chao</div>
      </RootLayout>,
    );

    expect(markup).toContain("text-[15px]");
    expect(markup).toContain("leading-[1.6]");
  });
});
