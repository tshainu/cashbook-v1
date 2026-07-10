import { Hono } from "hono";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "../database/schema";
import { eq, sql, and } from "drizzle-orm";
import { hashPassword } from "../database/password";

export function shops(db: LibSQLDatabase<typeof schema>) {
  return new Hono()
    .get("/", async (c) => {
      const all = await db.select().from(schema.shops).orderBy(schema.shops.id);
      return c.json({ shops: all }, 200);
    })
    .get("/stats", async (c) => {
      const all = await db.select().from(schema.shops);
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const total = all.length;
      const suspended = all.filter(s => s.suspended).length;
      const active = total - suspended;
      const thisMonth = all.filter(s => s.createdAt && new Date(s.createdAt) >= startOfMonth).length;
      const thisYear = all.filter(s => s.createdAt && new Date(s.createdAt) >= startOfYear).length;
      return c.json({ total, active, suspended, thisMonth, thisYear }, 200);
    })
    .post("/", async (c) => {
      const body = await c.req.json();
      const { name, shopCode, address, contactNumber, ownerName, password } = body;

      const [shop] = await db.insert(schema.shops).values({
        name,
        shopCode,
        address: address || null,
        contactNumber: contactNumber || null,
        ownerName: ownerName || null,
        suspended: false,
      }).returning();

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
      
      // Update shop details
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

      // Update password if provided
      if (body.password) {
        // Find the admin user for this shop
        const [adminUser] = await db.select()
          .from(schema.users)
          .where(and(eq(schema.users.shopId, id), eq(schema.users.role, "admin")));
        
        if (adminUser) {
          const hashed = await hashPassword(body.password);
          await db.update(schema.accounts)
            .set({ password: hashed, updatedAt: new Date() })
            .where(and(eq(schema.accounts.userId, adminUser.id), eq(schema.accounts.providerId, "credential")));
          console.log(`[UPDATE] Password updated for shop admin: ${adminUser.email}`);
        }
      }

      return c.json({ shop }, 200);
    })
    .patch("/:id/suspend", async (c) => {
      const id = parseInt(c.req.param("id"));
      const body = await c.req.json();
      const [shop] = await db.update(schema.shops)
        .set({ suspended: body.suspended })
        .where(eq(schema.shops.id, id))
        .returning();
      return c.json({ shop }, 200);
    })
    .delete("/:id", async (c) => {
      const paramId = c.req.param("id");
      console.log(`[DELETE] Received request to delete shop with param: ${paramId}`);
      let id: number;

      if (isNaN(Number(paramId))) {
        const [shop] = await db.select().from(schema.shops).where(eq(schema.shops.shopCode, paramId));
        if (!shop) {
          console.log(`[DELETE] Shop with code ${paramId} not found.`);
          return c.json({ message: "Shop not found" }, 404);
        }
        id = shop.id;
        console.log(`[DELETE] Resolved shopCode ${paramId} to ID: ${id}`);
      } else {
        id = parseInt(paramId);
        console.log(`[DELETE] Using numeric ID: ${id}`);
      }

      try {
        console.log(`[DELETE] Starting cleanup for shop ID: ${id}`);
        await db.delete(schema.transactions).where(eq(schema.transactions.shopId, id));
        console.log(`[DELETE] Transactions deleted.`);
        await db.delete(schema.items).where(eq(schema.items.shopId, id));
        console.log(`[DELETE] Items deleted.`);
        await db.delete(schema.users).where(eq(schema.users.shopId, id));
        console.log(`[DELETE] Users deleted.`);
        await db.delete(schema.shops).where(eq(schema.shops.id, id));
        console.log(`[DELETE] Shop deleted successfully.`);
        return c.json({ success: true }, 200);
      } catch (error: any) {
        console.error("[DELETE] Fatal error:", error);
        return c.json({ message: "Failed to delete shop", error: error.message }, 500);
      }
    });
}
