/**
 * Sync Service — drains the offline queue every 5 seconds when online.
 * Call startSync() once on app startup. Call stopSync() on logout.
 *
 * Emits pendingCount updates via a simple listener pattern so the UI
 * can show a badge without any global state library.
 */
import NetInfo from "@react-native-community/netinfo";
import { getPending, dequeue, incrementRetry, getPendingCount } from "./offlineQueue";
import { getToken } from "./auth";
import Constants from "expo-constants";

const BASE =
  Constants.expoConfig?.extra?.apiUrl ??
  process.env.EXPO_PUBLIC_API_URL ??
  "";

type Listener = (count: number) => void;
const listeners = new Set<Listener>();

export function onPendingCountChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

async function notifyListeners() {
  const count = await getPendingCount();
  listeners.forEach(fn => fn(count));
}

let syncInterval: ReturnType<typeof setInterval> | null = null;
let isSyncing = false;

export async function runSync(): Promise<void> {
  if (isSyncing) return;
  const net = await NetInfo.fetch();
  if (!net.isConnected || !net.isInternetReachable) {
    await notifyListeners();
    return;
  }

  const token = getToken();
  if (!token) return;

  isSyncing = true;
  try {
    const items = await getPending();
    if (items.length === 0) return;

    for (const item of items) {
      try {
        const res = await fetch(`${BASE}/api/transactions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: item.payload,
        });

        if (res.ok || res.status === 409) {
          // 409 = already exists, treat as success
          await dequeue(item.id);
        } else if (res.status === 401) {
          // Token expired — stop syncing, authFetch handles redirect
          break;
        } else {
          await incrementRetry(item.id);
        }
      } catch {
        // Network error — retry later
        await incrementRetry(item.id);
      }
    }
  } finally {
    isSyncing = false;
    await notifyListeners();
  }
}

export function startSync(): void {
  if (syncInterval) return;
  // Run immediately then every 5s
  runSync();
  syncInterval = setInterval(runSync, 5000);
}

export function stopSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}
