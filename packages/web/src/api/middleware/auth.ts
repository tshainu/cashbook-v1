import { createMiddleware } from "hono/factory";
import type { AuthInstance } from "../auth";

type User = { id: string; name: string; email: string; [key: string]: any };
type Session = { id: string; userId: string; [key: string]: any };

declare module "hono" {
  interface ContextVariableMap {
    user: User | null;
    session: Session | null;
  }
}

export function authMiddleware(auth: AuthInstance) {
  return createMiddleware(async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    c.set("user", (session?.user as User) ?? null);
    c.set("session", (session?.session as Session) ?? null);
    return next();
  });
}

export const requireAuth = createMiddleware(async (c, next) => {
  if (!c.get("user")) return c.json({ message: "Unauthorized" }, 401);
  return next();
});
