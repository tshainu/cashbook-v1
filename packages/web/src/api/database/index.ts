import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

export type Env = {
  DATABASE_URL: string;
  DATABASE_AUTH_TOKEN?: string;
  BETTER_AUTH_SECRET: string;
  WEBSITE_URL: string;
};

export function createDb(env: Env) {
  const client = createClient({
    url: env.DATABASE_URL,
    authToken: env.DATABASE_AUTH_TOKEN,
  });
  return drizzle(client, { schema });
}

// Fallback for local dev using process.env
export const db = createDb({
  DATABASE_URL: process.env.DATABASE_URL!,
  DATABASE_AUTH_TOKEN: process.env.DATABASE_AUTH_TOKEN,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET!,
  WEBSITE_URL: process.env.WEBSITE_URL!,
});
