interface Env {
  DATABASE_URL: string;
  DATABASE_AUTH_TOKEN: string;
  BETTER_AUTH_SECRET: string;
  WEBSITE_URL: string;
}

let _app: ReturnType<typeof import("../../packages/web/src/api/index").createApp> | null = null;
let _initError: string | null = null;

async function getApp(env: Env) {
  if (_app) return _app;
  try {
    const { createApp } = await import("../../packages/web/src/api/index");
    _app = createApp(env);
    return _app;
  } catch (err) {
    _initError = err instanceof Error ? `${err.name}: ${err.message}\n${err.stack}` : String(err);
    throw err;
  }
}

export const onRequest = async (context: EventContext<Env, string, unknown>) => {
  const env: Env = {
    DATABASE_URL: context.env.DATABASE_URL,
    DATABASE_AUTH_TOKEN: context.env.DATABASE_AUTH_TOKEN,
    BETTER_AUTH_SECRET: context.env.BETTER_AUTH_SECRET,
    WEBSITE_URL: context.env.WEBSITE_URL,
  };

  // Debug endpoint
  const pathname = new URL(context.request.url).pathname;
  if (pathname === "/api/debug") {
    let dbTest: unknown = null;
    try {
      const { createDb } = await import("../../packages/web/src/api/database/index");
      const db = createDb(env);
      // Test raw query
      const result = await db.execute("SELECT email FROM users LIMIT 1");
      dbTest = { ok: true, rows: result.rows };
    } catch (err) {
      dbTest = { err: err instanceof Error ? err.message : String(err) };
    }
    return new Response(JSON.stringify({
      initError: _initError,
      envKeys: Object.keys(context.env),
      DATABASE_URL: env.DATABASE_URL ? env.DATABASE_URL.substring(0, 30) + "..." : "MISSING",
      WEBSITE_URL: env.WEBSITE_URL || "MISSING",
      BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET ? "SET" : "MISSING",
      dbTest,
    }), { headers: { "Content-Type": "application/json" } });
  }

  try {
    const app = await getApp(env);
    return await app.fetch(context.request, context.env);
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}\n${err.stack}` : String(err);
    return new Response(JSON.stringify({ error: msg, initError: _initError }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
