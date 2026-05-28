import { getToken, clearToken } from "./auth";
import { router } from "expo-router";
import { Alert } from "react-native";
import Constants from "expo-constants";

const BASE =
  Constants.expoConfig?.extra?.apiUrl ??
  process.env.EXPO_PUBLIC_API_URL ??
  "";

/**
 * Authenticated fetch wrapper.
 * - Automatically attaches Bearer token
 * - On 401, clears token and redirects to sign-in
 * - Throws with server message on non-ok responses
 */
export async function authFetch(
  path: string,
  options: RequestInit = {}
): Promise<any> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    await clearToken();
    Alert.alert(
      "Session Expired",
      "Please log in again.",
      [{ text: "OK", onPress: () => router.replace("/sign-in") }]
    );
    throw new Error("Session expired");
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || `Server error ${res.status}`);
  }

  return data;
}
