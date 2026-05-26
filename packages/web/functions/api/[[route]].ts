import app from "../../src/api/index";

export const onRequest = async (context: EventContext<Env, string, unknown>) => {
  return app.fetch(context.request, context.env);
};

interface Env {
  DATABASE_URL: string;
  DATABASE_AUTH_TOKEN: string;
  BETTER_AUTH_SECRET: string;
  WEBSITE_URL: string;
}
