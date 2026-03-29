import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const authMocks = vi.hoisted(() => ({
  getSessionCookie: vi.fn(),
}));

vi.mock("better-auth/cookies", () => ({
  getSessionCookie: authMocks.getSessionCookie,
}));

import { middleware } from "@/middleware";

describe("middleware", () => {
  beforeEach(() => {
    authMocks.getSessionCookie.mockReset();
  });

  it("allows public asset requests without redirecting to sign-in", () => {
    authMocks.getSessionCookie.mockReturnValue(null);

    const response = middleware(new NextRequest("http://localhost:3000/english-logo-app.svg"));

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("redirects protected app routes to sign-in when there is no session", () => {
    authMocks.getSessionCookie.mockReturnValue(null);

    const response = middleware(new NextRequest("http://localhost:3000/english-chatbot"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/sign-in");
  });
});
