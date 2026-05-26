import { createApp } from "../../packages/web/src/api/index";
import { createClient } from "@libsql/client/web";

interface Env {
  DATABASE_URL: string;
  DATABASE_AUTH_TOKEN: string;
  BETTER_AUTH_SECRET: string;
  WEBSITE_URL: string;
}

export const onRequest = async (context: EventContext<Env, string, unknown>) => {
  const env: Env = {
    DATABASE_URL: context.env.DATABASE_URL,
    DATABASE_AUTH_TOKEN: context.env.DATABASE_AUTH_TOKEN,
    BETTER_AUTH_SECRET: context.env.BETTER_AUTH_SECRET,
    WEBSITE_URL: context.env.WEBSITE_URL,
  };

  const pathname = new URL(context.request.url).pathname;

  // Debug endpoint
  if (pathname === "/api/debug") {
    let dbTest: unknown = null;
    try {
      const client = createClient({
        url: env.DATABASE_URL,
        authToken: env.DATABASE_AUTH_TOKEN,
      });
      const result = await client.execute("SELECT email FROM users LIMIT 2");
      dbTest = { ok: true, rows: result.rows };
    } catch (err) {
      dbTest = { err: err instanceof Error ? `${err.name}: ${err.message}\n${err.stack}` : String(err) };
    }
    return new Response(JSON.stringify({
      DATABASE_URL: env.DATABASE_URL ? env.DATABASE_URL.substring(0, 35) + "..." : "MISSING",
      WEBSITE_URL: env.WEBSITE_URL || "MISSING",
      BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET ? "SET" : "MISSING",
      dbTest,
    }), { headers: { "Content-Type": "application/json" } });
  }

  try {
    const app = createApp(env);
    return await app.fetch(context.request, context.env);
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}\n${err.stack}` : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
