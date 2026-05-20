import { db } from "./src/api/database";
import * as schema from "./src/api/database/schema";

const shops = await db.select().from(schema.shops);
console.log("SHOPS:", JSON.stringify(shops));

const users = await db.select({
  id: schema.users.id,
  name: schema.users.name,
  username: schema.users.username,
  email: schema.users.email,
  role: schema.users.role,
  shopId: schema.users.shopId,
}).from(schema.users);
console.log("USERS:", JSON.stringify(users));
