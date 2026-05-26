import { Hono } from "hono";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "../database/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

export function reports(db: LibSQLDatabase<typeof schema>) {
  return new Hono()
    .get("/summary", requireAuth, async (c) => {
      const shopId = parseInt(c.req.query("shopId") ?? "0");
      const from = c.req.query("from");
      const to = c.req.query("to");
      const type = c.req.query("type");
      if (!shopId) return c.json({ error: "shopId required" }, 400);
      const fromDate = from ? new Date(from + "T00:00:00") : new Date(new Date().setHours(0, 0, 0, 0));
      const toDate = to ? new Date(to + "T23:59:59") : new Date();
      const rows = await db.select({
        id: schema.transactions.id,
        type: schema.transactions.type,
        amount: schema.transactions.amount,
        itemName: schema.transactions.itemName,
        customerName: schema.transactions.customerName,
        customerPhone: schema.transactions.customerPhone,
        creditSettled: schema.transactions.creditSettled,
        promiseDate: schema.transactions.promiseDate,
        createdAt: schema.transactions.createdAt,
      }).from(schema.transactions).where(
        and(
          eq(schema.transactions.shopId, shopId),
          gte(schema.transactions.createdAt, fromDate),
          lte(schema.transactions.createdAt, toDate),
          ...(type ? [eq(schema.transactions.type, type)] : [])
        )
      ).orderBy(desc(schema.transactions.createdAt));
      const totalSales = rows.filter(r => r.type === "sale").reduce((s, r) => s + r.amount, 0);
      const totalExpenses = rows.filter(r => r.type === "expense").reduce((s, r) => s + r.amount, 0);
      const totalCredit = rows.filter(r => r.type === "credit").reduce((s, r) => s + r.amount, 0);
      const totalCreditSettled = rows.filter(r => r.type === "credit" && r.creditSettled).reduce((s, r) => s + r.amount, 0);
      const totalCreditPending = rows.filter(r => r.type === "credit" && !r.creditSettled).reduce((s, r) => s + r.amount, 0);
      const categoryMap: Record<string, { name: string; total: number; count: number; type: string }> = {};
      rows.forEach(r => {
        const key = `${r.type}::${r.itemName}`;
        if (!categoryMap[key]) categoryMap[key] = { name: r.itemName, total: 0, count: 0, type: r.type };
        categoryMap[key].total += r.amount;
        categoryMap[key].count += 1;
      });
      return c.json({
        totalSales, totalExpenses, totalCredit, totalCreditSettled, totalCreditPending,
        netProfit: totalSales + totalCredit - totalExpenses,
        transactionCount: rows.length,
        categories: Object.values(categoryMap).sort((a, b) => b.total - a.total),
        transactions: rows,
      }, 200);
    });
}
