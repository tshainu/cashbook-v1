import { scryptAsync } from "@noble/hashes/scrypt.js";

const SCRYPT_CONFIG = { N: 4096, r: 8, p: 1, dkLen: 32 };

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function hashPassword(password: string): Promise<string> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const salt = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  const key = await scryptAsync(password.normalize("NFKC"), salt, SCRYPT_CONFIG);
  return `${salt}:${Array.from(key).map(b => b.toString(16).padStart(2, '0')).join('')}`;
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  const [salt, keyHex] = hash.split(":");
  if (!salt || !keyHex) return false;
  const key = await scryptAsync(password.normalize("NFKC"), salt, SCRYPT_CONFIG);
  const expected = Uint8Array.from(keyHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
  return constantTimeEqual(key, expected);
}
