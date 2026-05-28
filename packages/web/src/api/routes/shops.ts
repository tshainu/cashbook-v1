import { Hono } from "hono";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "../database/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../database/password";

export function shops(db: LibSQLDatabase<typeof schema>) {
  return new Hono()
    .get("/", async (c) => {
      const all = await db.select().from(schema.shops).orderBy(schema.shops.id);
      return c.json({ shops: all }, 200);
    })
    .post("/", async (c) => {
      const body = await c.req.json();
      const { name, shopCode, address, contactNumber, ownerName, password } = body;

      // 1. Create the shop
      const [shop] = await db.insert(schema.shops).values({
        name,
        shopCode,
        address: address || null,
        contactNumber: contactNumber || null,
        ownerName: ownerName || null,
      }).returning();

      // 2. Create admin user for this shop
      const userId = crypto.randomUUID();
      const email = `admin@${shopCode.toLowerCase()}.local`;
      const now = new Date();

      await db.insert(schema.users).values({
        id: userId,
        shopId: shop.id,
        name: ownerName || "Admin",
        username: "admin",
        email,
        role: "admin",
        createdAt: now,
        updatedAt: now,
      });

      // 3. Create account (credential) for that user
      const hashed = await hashPassword(password);
      await db.insert(schema.accounts).values({
        id: crypto.randomUUID(),
        accountId: userId,
        providerId: "credential",
        userId,
        password: hashed,
        createdAt: now,
        updatedAt: now,
      });

      return c.json({ shop }, 201);
    })
    .put("/:id", async (c) => {
      const id = parseInt(c.req.param("id"));
      const body = await c.req.json();
      const [shop] = await db.update(schema.shops)
        .set({
          name: body.name,
          shopCode: body.shopCode,
          address: body.address || null,
          contactNumber: body.contactNumber || null,
          ownerName: body.ownerName || null,
        })
        .where(eq(schema.shops.id, id))
        .returning();
      return c.json({ shop }, 200);
    })
    .delete("/:id", async (c) => {
      const id = parseInt(c.req.param("id"));
      await db.delete(schema.shops).where(eq(schema.shops.id, id));
      return c.json({ success: true }, 200);
    });
}
