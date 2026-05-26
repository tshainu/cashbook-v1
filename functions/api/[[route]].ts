import { createApp } from "../../packages/web/src/api/index";

interface Env {
  DATABASE_URL: string;
  DATABASE_AUTH_TOKEN: string;
  BETTER_AUTH_SECRET: string;
  WEBSITE_URL: string;
}

export const onRequest = async (context: EventContext<Env, string, unknown>) => {
  try {
    const app = createApp({
      DATABASE_URL: context.env.DATABASE_URL,
      DATABASE_AUTH_TOKEN: context.env.DATABASE_AUTH_TOKEN,
      BETTER_AUTH_SECRET: context.env.BETTER_AUTH_SECRET,
      WEBSITE_URL: context.env.WEBSITE_URL,
    });
    return await app.fetch(context.request, context.env);
  } catch (err) {
    const msg = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
    console.error("[CF Worker Error]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
