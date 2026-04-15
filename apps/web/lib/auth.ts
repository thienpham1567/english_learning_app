import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

import { pool } from "@repo/database";

function createAuth() {
  return betterAuth({
    database: pool,
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
    plugins: [nextCookies()],
  });
}

type AuthInstance = ReturnType<typeof createAuth>;

let authInstance: AuthInstance | null = null;

function getAuthInstance() {
  if (!authInstance) {
    authInstance = createAuth();
  }

  return authInstance;
}

export const auth = new Proxy({} as AuthInstance, {
  get(_target, prop) {
    const instance = getAuthInstance();
    const value = instance[prop as keyof AuthInstance];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
