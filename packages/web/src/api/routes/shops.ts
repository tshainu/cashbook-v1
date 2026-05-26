import { Hono } from "hono";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "../database/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

export function shops(db: LibSQLDatabase<typeof schema>) {
  return new Hono()
    .get("/", requireAuth, async (c) => {
      const all = await db.select().from(schema.shops).orderBy(schema.shops.id);
      return c.json({ shops: all }, 200);
    })
    .post("/", requireAuth, async (c) => {
      const body = await c.req.json();
      const [shop] = await db.insert(schema.shops).values({
        name: body.name,
        shopCode: body.shopCode,
      }).returning();
      return c.json({ shop }, 201);
    })
    .put("/:id", requireAuth, async (c) => {
      const id = parseInt(c.req.param("id"));
      const body = await c.req.json();
      const [shop] = await db.update(schema.shops).set({ name: body.name, shopCode: body.shopCode })
        .where(eq(schema.shops.id, id)).returning();
      return c.json({ shop }, 200);
    })
    .delete("/:id", requireAuth, async (c) => {
      const id = parseInt(c.req.param("id"));
      await db.delete(schema.shops).where(eq(schema.shops.id, id));
      return c.json({ success: true }, 200);
    });
}
