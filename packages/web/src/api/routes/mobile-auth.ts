import { Hono } from "hono";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "../database/schema";
import { eq, and } from "drizzle-orm";
import type { AuthInstance } from "../auth";
import { verifyPassword } from "../database/password";

export function mobileAuth(db: LibSQLDatabase<typeof schema>, auth: AuthInstance) {
  return new Hono()
    .post("/mobile-login", async (c) => {
      const { shopCode, username, password } = await c.req.json();

      const [shop] = await db.select().from(schema.shops).where(eq(schema.shops.shopCode, shopCode));
      if (!shop) return c.json({ message: "Invalid Shop ID" }, 401);

      const [user] = await db.select().from(schema.users).where(
        and(eq(schema.users.username, username), eq(schema.users.shopId, shop.id))
      );
      if (!user) return c.json({ message: "Invalid username" }, 401);

      const [account] = await db.select().from(schema.accounts).where(
        and(eq(schema.accounts.userId, user.id), eq(schema.accounts.providerId, "credential"))
      );
      if (!account?.password) return c.json({ message: "No credentials set" }, 401);

      const valid = await verifyPassword(account.password, password);
      if (!valid) return c.json({ message: "Invalid password" }, 401);

      // Generate a simple session token
      const token = crypto.randomUUID();

      return c.json({
        token,
        user: {
          id: user.id, name: user.name, username: user.username,
          role: user.role, shopId: user.shopId,
          shopName: shop.name, shopCode: shop.shopCode,
        },
      }, 200);
    })
    .get("/me", async (c) => {
      const session = await auth.api.getSession({ headers: c.req.raw.headers });
      if (!session?.user) return c.json({ message: "Unauthorized" }, 401);
      const [user] = await db.select({
        id: schema.users.id, name: schema.users.name,
        username: schema.users.username, role: schema.users.role, shopId: schema.users.shopId,
      }).from(schema.users).where(eq(schema.users.id, session.user.id));
      if (!user) return c.json({ message: "User not found" }, 404);
      const shop = user.shopId
        ? (await db.select().from(schema.shops).where(eq(schema.shops.id, user.shopId)))[0]
        : null;
      return c.json({ user: { ...user, shopName: shop?.name, shopCode: shop?.shopCode } }, 200);
    });
}
