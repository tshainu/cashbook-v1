import { createAuthClient } from "better-auth/react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

const isWeb = Platform.OS === "web";
const TOKEN_KEY = "bearer_token";
const USER_KEY = "cashbook_user";

const baseURL =
  Constants.expoConfig?.extra?.apiUrl ?? process.env.EXPO_PUBLIC_API_URL;

export function getToken(): string {
  try {
    return SecureStore.getItem(TOKEN_KEY) ?? "";
  } catch {
    return typeof localStorage !== "undefined" ? localStorage.getItem(TOKEN_KEY) ?? "" : "";
  }
}

export function setToken(token: string) {
  try {
    SecureStore.setItem(TOKEN_KEY, token);
  } catch {
    if (typeof localStorage !== "undefined") localStorage.setItem(TOKEN_KEY, token);
  }
}

export async function removeToken() {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    if (typeof localStorage !== "undefined") localStorage.removeItem(TOKEN_KEY);
  }
}

// Store user info locally
export function getStoredUser(): any {
  try {
    const raw = SecureStore.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    try {
      const raw = typeof localStorage !== "undefined" ? localStorage.getItem(USER_KEY) : null;
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
}

export function storeUser(user: any) {
  const raw = JSON.stringify(user);
  try {
    SecureStore.setItem(USER_KEY, raw);
  } catch {
    if (typeof localStorage !== "undefined") localStorage.setItem(USER_KEY, raw);
  }
}

export async function clearUser() {
  try {
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch {
    if (typeof localStorage !== "undefined") localStorage.removeItem(USER_KEY);
  }
}

export const authClient = createAuthClient({
  baseURL,
  basePath: "/api/auth",
  fetchOptions: {
    ...(isWeb ? { credentials: "omit" as const } : {}),
    auth: { type: "Bearer", token: () => getToken() },
    headers: isWeb ? {} : { "expo-origin": "mobile://" },
  },
});

export function captureToken(ctx: { response: Response }) {
  const token = ctx.response.headers.get("set-auth-token");
  if (token) setToken(token);
}

export async function clearToken() {
  await removeToken();
  await clearUser();
}
