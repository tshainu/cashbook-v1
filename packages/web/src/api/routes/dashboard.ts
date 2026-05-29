import { Hono } from "hono";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "../database/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export function dashboard(db: LibSQLDatabase<typeof schema>) {
  return new Hono()
    .get("/", async (c) => {
      const shopId = parseInt(c.req.query("shopId") ?? "0");
      const from = c.req.query("from");
      const to = c.req.query("to");
      if (!shopId) return c.json({ error: "shopId required" }, 400);

      const fromDate = from ? new Date(from + "T00:00:00") : new Date(new Date().setHours(0, 0, 0, 0));
      const toDate = to ? new Date(to + "T23:59:59") : new Date();

      const isToday = from === to; // single-day → hourly chart

      const rows = await db.select({
        type: schema.transactions.type,
        amount: schema.transactions.amount,
        createdAt: schema.transactions.createdAt,
      }).from(schema.transactions).where(
        and(
          eq(schema.transactions.shopId, shopId),
          gte(schema.transactions.createdAt, fromDate),
          lte(schema.transactions.createdAt, toDate)
        )
      );

      const income = rows.filter(r => r.type === "sale").reduce((s, r) => s + r.amount, 0);
      const creditTotal = rows.filter(r => r.type === "credit").reduce((s, r) => s + r.amount, 0);
      const expense = rows.filter(r => r.type === "expense").reduce((s, r) => s + r.amount, 0);

      let chartLabels: string[];
      let chartSales: number[];
      let chartExpenses: number[];

      if (isToday) {
        // Hourly buckets: 0–23
        const salesByHour: number[] = Array(24).fill(0);
        const expensesByHour: number[] = Array(24).fill(0);

        rows.forEach(r => {
          const d = r.createdAt ? new Date(r.createdAt) : new Date();
          const h = d.getHours();
          if (r.type === "sale") salesByHour[h] += r.amount;
          else if (r.type === "expense") expensesByHour[h] += r.amount;
        });

        // Only show hours up to current hour (for today) to keep chart clean
        const nowHour = new Date().getHours();
        const hours = Array.from({ length: nowHour + 1 }, (_, i) => i);

        // If less than 2 hours, show full 24 anyway so chart renders
        const showHours = hours.length >= 2 ? hours : Array.from({ length: 24 }, (_, i) => i);

        chartLabels = showHours.map(h => {
          const ampm = h >= 12 ? "pm" : "am";
          const display = h % 12 === 0 ? 12 : h % 12;
          return `${display}${ampm}`;
        });
        chartSales = showHours.map(h => salesByHour[h]);
        chartExpenses = showHours.map(h => expensesByHour[h]);
      } else {
        // Daily buckets
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

        chartLabels = allDays.map(k => { const p = k.split("-"); return `${parseInt(p[1])}/${parseInt(p[2])}`; });
        chartSales = allDays.map(k => salesMap[k] ?? 0);
        chartExpenses = allDays.map(k => expenseMap[k] ?? 0);
      }

      return c.json({
        income, creditTotal, expense,
        chartLabels,
        chartSales,
        chartExpenses,
      }, 200);
    });
}
