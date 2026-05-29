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
        suspended: schema.users.suspended,
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

      const [existing] = await db.select({ id: schema.users.id })
        .from(schema.users)
        .where(and(eq(schema.users.username, username), eq(schema.users.shopId, Number(shopId))));
      if (existing) return c.json({ message: "Username already taken" }, 409);

      const userId = crypto.randomUUID();
      const accountId = crypto.randomUUID();
      const now = new Date();
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
        suspended: false,
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
    // Edit user (name, role, optional password)
    .patch("/:id", requireAuth, async (c) => {
      const id = c.req.param("id");
      const body = await c.req.json();
      if (body.password) {
        const hashed = await hashPassword(body.password);
        await db.update(schema.accounts).set({ password: hashed })
          .where(and(eq(schema.accounts.userId, id), eq(schema.accounts.providerId, "credential")));
      }
      const updates: any = { updatedAt: new Date() };
      if (body.name) updates.name = body.name;
      if (body.role) updates.role = body.role;
      const [user] = await db.update(schema.users).set(updates)
        .where(eq(schema.users.id, id)).returning();
      return c.json({ user }, 200);
    })
    // Suspend/unsuspend user
    .patch("/:id/suspend", requireAuth, async (c) => {
      const id = c.req.param("id");
      const body = await c.req.json();
      const [user] = await db.update(schema.users)
        .set({ suspended: body.suspended, updatedAt: new Date() })
        .where(eq(schema.users.id, id))
        .returning();
      return c.json({ user }, 200);
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
