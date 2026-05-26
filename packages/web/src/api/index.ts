import { Hono } from "hono";
import { cors } from "hono/cors";
import { createAuth } from "./auth";
import { createDb, type Env } from "./database";
import { authMiddleware } from "./middleware/auth";
import { shops } from "./routes/shops";
import { staff } from "./routes/staff";
import { items } from "./routes/items";
import { transactions } from "./routes/transactions";
import { mobileAuth } from "./routes/mobile-auth";
import { dashboard } from "./routes/dashboard";
import { reports } from "./routes/reports";

export function createApp(env: Env) {
  const db = createDb(env);
  const auth = createAuth(env);

  const app = new Hono()
    .use(cors({
      origin: (origin) => origin ?? "*",
      credentials: true,
      exposeHeaders: ["set-auth-token"],
    }))
    .on(["GET", "POST"], "/api/auth/*", async (c) => {
      try {
        const res = await auth.handler(c.req.raw);
        // Surface auth errors in dev/debug
        if (res.status >= 500) {
          const clone = res.clone();
          const text = await clone.text().catch(() => "");
          console.error("[auth error]", res.status, text);
          return new Response(
            JSON.stringify({ authError: text || "internal auth error", status: res.status }),
            { status: res.status, headers: { "Content-Type": "application/json" } }
          );
        }
        return res;
      } catch (err) {
        const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
        console.error("[auth throw]", msg);
        return new Response(JSON.stringify({ authThrow: msg }), {
          status: 500, headers: { "Content-Type": "application/json" },
        });
      }
    })
    .basePath("api")
    .use("*", authMiddleware(auth))
    .get("/health", (c) => c.json({ status: "ok" }, 200))
    .route("/shops", shops(db))
    .route("/staff", staff(db, auth))
    .route("/items", items(db))
    .route("/transactions", transactions(db))
    .route("/dashboard", dashboard(db))
    .route("/reports", reports(db))
    .route("/", mobileAuth(db, auth));

  return app;
}

export type AppType = ReturnType<typeof createApp>;
