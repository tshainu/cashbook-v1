import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { auth } from "../auth";

export const staff = new Hono()
  // List all staff for a shop
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
    return c.json({ staff: all }, 200);
  })
  // Create staff user
  .post("/", requireAuth, async (c) => {
    const body = await c.req.json();
    // Use Better Auth to create user
    const result = await auth.api.signUpEmail({
      body: {
        name: body.name,
        email: body.email,
        password: body.password,
      },
      headers: c.req.raw.headers,
    });
    if (!result?.user) return c.json({ message: "Failed to create user" }, 400);
    // Update with shopId, username, role
    await db.update(schema.users).set({
      shopId: body.shopId,
      username: body.username,
      role: body.role ?? "staff",
    }).where(eq(schema.users.id, result.user.id));
    return c.json({ user: result.user }, 201);
  })
  // Update staff
  .put("/:id", requireAuth, async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    const [user] = await db.update(schema.users).set({
      name: body.name,
      username: body.username,
      role: body.role,
      shopId: body.shopId,
    }).where(eq(schema.users.id, id)).returning();
    return c.json({ user }, 200);
  })
  // Delete staff
  .delete("/:id", requireAuth, async (c) => {
    const id = c.req.param("id");
    await db.delete(schema.users).where(eq(schema.users.id, id));
    return c.json({ success: true }, 200);
  });
