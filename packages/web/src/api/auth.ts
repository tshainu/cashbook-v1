import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { expo } from "@better-auth/expo";
import { createDb, type Env } from "./database";
import { users, sessions, accounts, verifications } from "./database/schema";

const schema = { user: users, session: sessions, account: accounts, verification: verifications };

export function createAuth(env: Env) {
  const db = createDb(env);
  return betterAuth({
    basePath: "/api/auth",
    baseURL: env.WEBSITE_URL,
    database: drizzleAdapter(db, { provider: "sqlite", schema }),
    emailAndPassword: { enabled: true },
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: (request) => {
      const origin = request?.headers.get("origin");
      return origin ? [origin] : ["*"];
    },
    plugins: [bearer(), expo()],
  });
}

export type AuthInstance = ReturnType<typeof createAuth>;
