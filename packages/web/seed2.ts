import { db } from "./src/api/database";
import * as schema from "./src/api/database/schema";
import { auth } from "./src/api/auth";
import { eq } from "drizzle-orm";

const email = "admin@cashbook.com";
const password = "admin123";
const username = "admin";
const shopId = 1;

// Try sign up
try {
  const result = await auth.api.signUpEmail({
    body: { email, password, name: "Admin User" },
  });
  console.log("SIGNUP RESULT:", JSON.stringify(result));

  if (result?.user?.id) {
    await db.update(schema.users)
      .set({ shopId, username, role: "admin" })
      .where(eq(schema.users.id, result.user.id));
    console.log("Done. User id:", result.user.id);
  }
} catch (e: any) {
  console.log("Error:", e.message ?? e);
}

// Check users again
const users = await db.select().from(schema.users);
console.log("ALL USERS:", JSON.stringify(users));
