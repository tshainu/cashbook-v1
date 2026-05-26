import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { expo } from "@better-auth/expo";
import { scryptAsync } from "@noble/hashes/scrypt.js";
import { createDb, type Env } from "./database";
import { users, sessions, accounts, verifications } from "./database/schema";

const schema = { user: users, session: sessions, account: accounts, verification: verifications };

// Lighter scrypt params for CF Workers CPU limits (N=4096 vs default 16384)
const SCRYPT_CONFIG = { N: 4096, r: 8, p: 1, dkLen: 32 };

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

const customHashPassword = async (password: string): Promise<string> => {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const salt = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  const key = await scryptAsync(password.normalize("NFKC"), salt, SCRYPT_CONFIG);
  return `${salt}:${Array.from(key).map(b => b.toString(16).padStart(2, '0')).join('')}`;
};

const customVerifyPassword = async ({ hash, password }: { hash: string; password: string }): Promise<boolean> => {
  const [salt, keyHex] = hash.split(":");
  if (!salt || !keyHex) return false;
  const key = await scryptAsync(password.normalize("NFKC"), salt, SCRYPT_CONFIG);
  const expected = Uint8Array.from(keyHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
  return constantTimeEqual(key, expected);
};

export function createAuth(env: Env) {
  const db = createDb(env);
  return betterAuth({
    basePath: "/api/auth",
    baseURL: env.WEBSITE_URL,
    database: drizzleAdapter(db, { provider: "sqlite", schema }),
    emailAndPassword: {
      enabled: true,
      password: {
        hash: customHashPassword,
        verify: customVerifyPassword,
      },
    },
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: (request) => {
      const origin = request?.headers.get("origin");
      return origin ? [origin] : ["*"];
    },
    plugins: [bearer(), expo()],
  });
}

export type AuthInstance = ReturnType<typeof createAuth>;
