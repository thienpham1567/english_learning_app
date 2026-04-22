import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");

describe("design tokens", () => {
  it("defines core aliases used by existing pages", () => {
    for (const token of ["--card-bg", "--text", "--radius-md", "--surface-alt"]) {
      expect(css).toContain(token);
    }
  });

  it("defines semantic soft background tokens", () => {
    for (const token of ["--error-bg", "--success-bg", "--warning-bg", "--info-bg"]) {
      expect(css).toContain(token);
    }
  });

  it("defines module accent tokens for page families", () => {
    for (const token of [
      "--module-grammar",
      "--module-listening",
      "--module-writing",
      "--module-reading",
      "--module-vocabulary",
      "--module-speaking",
      "--module-review",
      "--module-assessment",
    ]) {
      expect(css).toContain(token);
    }
  });
});
