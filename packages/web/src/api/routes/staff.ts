import { Hono } from "hono";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "../database/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import type { AuthInstance } from "../auth";
import { hashPassword } from "../database/password";

export function staff(db: LibSQLDatabase<typeof schema>, auth: AuthInstance) {
  return new Hono()
    .get("/", requireAuth, async (c) => {
      const shopId = parseInt(c.req.query("shopId") ?? "0");
      const query = db.select({
        id: schema.users.id,
        name: schema.users.name,
        username: schema.users.username,
        email: schema.users.email,
        role: schema.users.role,
        shopId: schema.users.shopId,
        createdAt: schema.users.createdAt,
      }).from(schema.users);
      const all = shopId
        ? await query.where(eq(schema.users.shopId, shopId))
        : await query;
      return c.json({ users: all }, 200);
    })
    .post("/", requireAuth, async (c) => {
      const body = await c.req.json();
      const { name, username, password, shopId, role } = body;
      if (!name || !username || !password) {
        return c.json({ message: "name, username, and password are required" }, 400);
      }

      // Check username uniqueness within shop
      const [existing] = await db.select({ id: schema.users.id })
        .from(schema.users)
        .where(and(eq(schema.users.username, username), eq(schema.users.shopId, Number(shopId))));
      if (existing) return c.json({ message: "Username already taken" }, 409);

      const userId = crypto.randomUUID();
      const accountId = crypto.randomUUID();
      const now = new Date();
      // Use a synthetic email so Better Auth's auth still works if needed
      const syntheticEmail = `${username}@shop-${shopId}.internal`;
      const hashed = await hashPassword(password);

      await db.insert(schema.users).values({
        id: userId,
        name,
        username,
        email: syntheticEmail,
        emailVerified: false,
        shopId: Number(shopId),
        role: role ?? "staff",
        createdAt: now,
        updatedAt: now,
      });

      await db.insert(schema.accounts).values({
        id: accountId,
        accountId: userId,
        providerId: "credential",
        userId,
        password: hashed,
        createdAt: now,
        updatedAt: now,
      });

      return c.json({
        user: { id: userId, name, username, role: role ?? "staff", shopId: Number(shopId) },
      }, 201);
    })
    .put("/:id", requireAuth, async (c) => {
      const id = c.req.param("id");
      const body = await c.req.json();
      const updates: Partial<typeof schema.users.$inferInsert> = {
        name: body.name,
        username: body.username,
        role: body.role,
        shopId: body.shopId,
        updatedAt: new Date(),
      };
      if (body.password) {
        // Update password in accounts table
        const hashed = await hashPassword(body.password);
        await db.update(schema.accounts).set({ password: hashed })
          .where(and(eq(schema.accounts.userId, id), eq(schema.accounts.providerId, "credential")));
      }
      const [user] = await db.update(schema.users).set(updates)
        .where(eq(schema.users.id, id)).returning();
      return c.json({ user }, 200);
    })
    .delete("/:id", requireAuth, async (c) => {
      const id = c.req.param("id");
      await db.delete(schema.users).where(eq(schema.users.id, id));
      return c.json({ success: true }, 200);
    });
}
