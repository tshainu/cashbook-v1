import { db } from "./src/api/database";
import * as schema from "./src/api/database/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const shopId = 1;
const email = "admin@cashbook.com";
const username = "admin";
const plainPassword = "admin123";
const userId = randomUUID();

// Hash password using bcrypt via better-auth's internal hasher
// better-auth uses scrypt by default — use the same lib
import { hashPassword } from "better-auth/crypto";

const hashedPassword = await hashPassword(plainPassword);
console.log("Hashed password:", hashedPassword.substring(0, 20) + "...");

// Insert user
await db.insert(schema.users).values({
  id: userId,
  shopId,
  name: "Admin User",
  username,
  email,
  role: "admin",
  emailVerified: true,
}).onConflictDoUpdate({
  target: schema.users.email,
  set: { shopId, username, role: "admin", emailVerified: true },
});

// Get the user id (may be existing)
const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
console.log("User:", user);

// Insert account (Better Auth credential account)
await db.insert(schema.accounts).values({
  id: randomUUID(),
  accountId: user.id,
  providerId: "credential",
  userId: user.id,
  password: hashedPassword,
  createdAt: new Date(),
  updatedAt: new Date(),
}).onConflictDoNothing();

console.log("\n====== LOGIN CREDENTIALS ======");
console.log("Shop ID  : SHOP001");
console.log("Username : admin");
console.log("Password : admin123");
console.log("================================");
