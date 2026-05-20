import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./auth";
import { authMiddleware } from "./middleware/auth";
import { shops } from "./routes/shops";
import { staff } from "./routes/staff";
import { items } from "./routes/items";
import { transactions } from "./routes/transactions";
import { mobileAuth } from "./routes/mobile-auth";
import { dashboard } from "./routes/dashboard";
import { reports } from "./routes/reports";

const app = new Hono()
  .use(cors({
    origin: (origin) => origin ?? "*",
    credentials: true,
    exposeHeaders: ["set-auth-token"],
  }))
  .on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw))
  .basePath("api")
  .use("*", authMiddleware)
  .get("/health", (c) => c.json({ status: "ok" }, 200))
  .route("/shops", shops)
  .route("/staff", staff)
  .route("/items", items)
  .route("/transactions", transactions)
  .route("/dashboard", dashboard)
  .route("/reports", reports)
  .route("/", mobileAuth);

export type AppType = typeof app;
export default app;
