import app from "../../packages/web/src/api/index";

export const onRequest = async (context: EventContext<Env, string, unknown>) => {
  // Inject env vars into process.env for Drizzle/better-auth compatibility
  process.env.DATABASE_URL = context.env.DATABASE_URL;
  process.env.DATABASE_AUTH_TOKEN = context.env.DATABASE_AUTH_TOKEN;
  process.env.BETTER_AUTH_SECRET = context.env.BETTER_AUTH_SECRET;
  process.env.WEBSITE_URL = context.env.WEBSITE_URL;

  return app.fetch(context.request, context.env);
};

interface Env {
  DATABASE_URL: string;
  DATABASE_AUTH_TOKEN: string;
  BETTER_AUTH_SECRET: string;
  WEBSITE_URL: string;
}
