import { Hono } from "hono";
import { cors } from "hono/cors";
import { createAuth, auth as devAuth } from "./auth";
import { createDb, db as devDb, type Env } from "./database";
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
    .on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw))
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

// Dev fallback — uses process.env
const app = createApp({
  DATABASE_URL: process.env.DATABASE_URL!,
  DATABASE_AUTH_TOKEN: process.env.DATABASE_AUTH_TOKEN,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET!,
  WEBSITE_URL: process.env.WEBSITE_URL!,
});

export type AppType = typeof app;
export default app;
