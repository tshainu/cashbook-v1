import { drizzle } from "drizzle-orm/libsql/web";
import { createClient } from "@libsql/client/web";
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
