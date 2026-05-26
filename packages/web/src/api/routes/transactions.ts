import { Hono } from "hono";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "../database/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

function getPeriodDates(period: string) {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  switch (period) {
    case "today": return { from: startOfDay(now), to: now };
    case "yesterday": {
      const y = new Date(now); y.setDate(y.getDate() - 1);
      return { from: startOfDay(y), to: new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59) };
    }
    case "week": { const d = new Date(now); d.setDate(d.getDate() - 6); return { from: startOfDay(d), to: now }; }
    case "month": return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
    case "lastmonth": return { from: new Date(now.getFullYear(), now.getMonth() - 1, 1), to: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59) };
    case "year": return { from: new Date(now.getFullYear(), 0, 1), to: now };
    default: return { from: startOfDay(now), to: now };
  }
}

export function transactions(db: LibSQLDatabase<typeof schema>) {
  return new Hono()
    .get("/", requireAuth, async (c) => {
      const shopId = parseInt(c.req.query("shopId") ?? "0");
      const userId = c.req.query("userId");
      const period = c.req.query("period") ?? "today";
      const type = c.req.query("type");
      const { from, to } = getPeriodDates(period);
      const conditions = [
        shopId ? eq(schema.transactions.shopId, shopId) : undefined,
        userId ? eq(schema.transactions.userId, userId) : undefined,
        type ? eq(schema.transactions.type, type) : undefined,
        gte(schema.transactions.createdAt, from),
        lte(schema.transactions.createdAt, to),
      ].filter(Boolean) as any[];
      const rows = await db.select({
        id: schema.transactions.id,
        shopId: schema.transactions.shopId,
        userId: schema.transactions.userId,
        itemId: schema.transactions.itemId,
        itemName: schema.transactions.itemName,
        amount: schema.transactions.amount,
        type: schema.transactions.type,
        customerName: schema.transactions.customerName,
        customerPhone: schema.transactions.customerPhone,
        promiseDate: schema.transactions.promiseDate,
        creditSettled: schema.transactions.creditSettled,
        createdAt: schema.transactions.createdAt,
        userName: schema.users.name,
      }).from(schema.transactions)
        .leftJoin(schema.users, eq(schema.transactions.userId, schema.users.id))
        .where(and(...conditions))
        .orderBy(desc(schema.transactions.createdAt));
      const totalSales = rows.filter(r => r.type === "sale" || r.type === "credit").reduce((s, r) => s + r.amount, 0);
      const totalExpenses = rows.filter(r => r.type === "expense").reduce((s, r) => s + r.amount, 0);
      return c.json({ transactions: rows, totalSales, totalExpenses }, 200);
    })
    .post("/", requireAuth, async (c) => {
      const user = c.get("user");
      const body = await c.req.json();
      const [tx] = await db.insert(schema.transactions).values({
        shopId: body.shopId,
        userId: user!.id,
        itemId: body.itemId ?? null,
        itemName: body.itemName,
        amount: body.amount,
        type: body.type,
        customerName: body.customerName ?? null,
        customerPhone: body.customerPhone ?? null,
        promiseDate: body.promiseDate ? new Date(body.promiseDate) : null,
        creditSettled: false,
      }).returning();
      return c.json({ transaction: tx }, 201);
    })
    .patch("/:id/settle", requireAuth, async (c) => {
      const id = parseInt(c.req.param("id"));
      const [tx] = await db.update(schema.transactions).set({ creditSettled: true }).where(eq(schema.transactions.id, id)).returning();
      return c.json({ transaction: tx }, 200);
    })
    .delete("/:id", requireAuth, async (c) => {
      const id = parseInt(c.req.param("id"));
      await db.delete(schema.transactions).where(eq(schema.transactions.id, id));
      return c.json({ success: true }, 200);
    });
}
