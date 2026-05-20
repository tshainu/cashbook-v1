import { db } from "./src/api/database";
import * as schema from "./src/api/database/schema";
import { auth } from "./src/api/auth";
import { eq } from "drizzle-orm";

// 1. Create shop
const existing = await db.select().from(schema.shops).where(eq(schema.shops.shopCode, "SHOP001"));
let shopId: number;

if (existing.length > 0) {
  shopId = existing[0].id;
  console.log("Shop exists, id:", shopId);
} else {
  const [shop] = await db.insert(schema.shops).values({
    name: "My Shop",
    shopCode: "SHOP001",
  }).returning();
  shopId = shop.id;
  console.log("Created shop id:", shopId);
}

// 2. Create user via Better Auth
const email = "admin@cashbook.com";
const password = "admin123";
const username = "admin";

try {
  const result = await auth.api.signUpEmail({
    body: { email, password, name: "Admin User" },
  });
  if (result?.user?.id) {
    await db.update(schema.users)
      .set({ shopId, username, role: "admin" })
      .where(eq(schema.users.id, result.user.id));
    console.log("Created & updated user id:", result.user.id);
  }
} catch (e: any) {
  console.log("User exists, updating...");
  const [u] = await db.select().from(schema.users).where(eq(schema.users.email, email));
  if (u) {
    await db.update(schema.users).set({ shopId, username, role: "admin" }).where(eq(schema.users.id, u.id));
    console.log("Updated user id:", u.id);
  }
}

console.log("\n====== LOGIN CREDENTIALS ======");
console.log("Shop ID  : SHOP001");
console.log("Username : admin");
console.log("Password : admin123");
console.log("================================");
