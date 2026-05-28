import { Hono } from "hono";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "../database/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

export function dashboard(db: LibSQLDatabase<typeof schema>) {
  return new Hono()
    .get("/", async (c) => {
      const shopId = parseInt(c.req.query("shopId") ?? "0");
      const from = c.req.query("from");
      const to = c.req.query("to");
      if (!shopId) return c.json({ error: "shopId required" }, 400);
      const fromDate = from ? new Date(from + "T00:00:00") : new Date(new Date().setHours(0, 0, 0, 0));
      const toDate = to ? new Date(to + "T23:59:59") : new Date();
      const rows = await db.select({
        type: schema.transactions.type,
        amount: schema.transactions.amount,
        createdAt: schema.transactions.createdAt,
      }).from(schema.transactions).where(
        and(eq(schema.transactions.shopId, shopId), gte(schema.transactions.createdAt, fromDate), lte(schema.transactions.createdAt, toDate))
      );
      const income = rows.filter(r => r.type === "sale").reduce((s, r) => s + r.amount, 0);
      const creditTotal = rows.filter(r => r.type === "credit").reduce((s, r) => s + r.amount, 0);
      const expense = rows.filter(r => r.type === "expense").reduce((s, r) => s + r.amount, 0);
      const salesMap: Record<string, number> = {};
      const expenseMap: Record<string, number> = {};
      rows.forEach(r => {
        const d = r.createdAt ? new Date(r.createdAt) : new Date();
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        if (r.type === "sale") salesMap[key] = (salesMap[key] ?? 0) + r.amount;
        else if (r.type === "expense") expenseMap[key] = (expenseMap[key] ?? 0) + r.amount;
      });
      const allDays: string[] = [];
      const cur = new Date(fromDate); cur.setHours(0, 0, 0, 0);
      const end = new Date(toDate); end.setHours(0, 0, 0, 0);
      const totalDays = Math.round((end.getTime() - cur.getTime()) / 86400000) + 1;
      for (let i = 0; i < Math.min(totalDays, 90); i++) {
        const d = new Date(cur); d.setDate(cur.getDate() + i);
        allDays.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
      }
      return c.json({
        income, creditTotal, expense,
        chartLabels: allDays.map(k => { const p = k.split("-"); return `${parseInt(p[1])}/${parseInt(p[2])}`; }),
        chartSales: allDays.map(k => salesMap[k] ?? 0),
        chartExpenses: allDays.map(k => expenseMap[k] ?? 0),
      }, 200);
    });
}
