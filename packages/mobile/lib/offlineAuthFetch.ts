/**
 * offlineAuthFetch — for transaction POSTs only.
 *
 * When online:  sends immediately (same as authFetch)
 * When offline: saves to local SQLite queue, returns immediately
 *
 * Use this instead of authFetch for POST /api/transactions calls.
 * For GETs and other mutations, continue using authFetch.
 */
import NetInfo from "@react-native-community/netinfo";
import { enqueue } from "./offlineQueue";
import { authFetch } from "./authFetch";
import { runSync } from "./syncService";

export async function offlineAuthFetch(
  path: string,
  options: RequestInit = {}
): Promise<void> {
  const net = await NetInfo.fetch();
  const online = !!(net.isConnected && net.isInternetReachable);

  if (online) {
    try {
      await authFetch(path, options);
    } catch (e: any) {
      if (e?.message === "Session expired") throw e;
      // Online but server error — queue it for retry
      const body = options.body;
      if (body) {
        const payload = typeof body === "string" ? JSON.parse(body) : body;
        await enqueue(payload);
        runSync(); // attempt sync immediately
      }
    }
  } else {
    // Offline — save to queue
    const body = options.body;
    if (body) {
      const payload = typeof body === "string" ? JSON.parse(body) : body;
      await enqueue(payload);
    }
  }
}
