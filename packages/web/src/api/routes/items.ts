import { Hono } from "hono";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "../database/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

export function items(db: LibSQLDatabase<typeof schema>) {
  return new Hono()
    .get("/", async (c) => {
      const shopId = parseInt(c.req.query("shopId") ?? "0");
      const type = c.req.query("type");
      const all = await db.select().from(schema.items).where(
        shopId && type
          ? and(eq(schema.items.shopId, shopId), eq(schema.items.type, type))
          : shopId
          ? eq(schema.items.shopId, shopId)
          : type
          ? eq(schema.items.type, type)
          : undefined
      );
      return c.json({ items: all }, 200);
    })
    .post("/", async (c) => {
      const body = await c.req.json();
      const [item] = await db.insert(schema.items).values({
        shopId: body.shopId,
        name: body.name,
        defaultPrice: body.defaultPrice,
        type: body.type ?? "sale",
        isActive: true,
      }).returning();
      return c.json({ item }, 201);
    })
    .put("/:id", async (c) => {
      const id = parseInt(c.req.param("id"));
      const body = await c.req.json();
      const [item] = await db.update(schema.items).set({
        name: body.name,
        defaultPrice: body.defaultPrice,
        type: body.type,
        isActive: body.isActive,
      }).where(eq(schema.items.id, id)).returning();
      return c.json({ item }, 200);
    })
    .delete("/:id", async (c) => {
      const id = parseInt(c.req.param("id"));
      await db.delete(schema.items).where(eq(schema.items.id, id));
      return c.json({ success: true }, 200);
    });
}
