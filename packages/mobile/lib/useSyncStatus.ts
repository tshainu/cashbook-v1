/**
 * Hook — returns { pendingCount, isOnline }
 * Updates automatically as sync runs and network changes.
 */
import { useState, useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";
import { onPendingCountChange } from "./syncService";
import { getPendingCount } from "./offlineQueue";

export function useSyncStatus() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Initial count
    getPendingCount().then(setPendingCount);

    // Listen to sync service updates
    const unsub = onPendingCountChange(setPendingCount);

    // Listen to network changes
    const netUnsub = NetInfo.addEventListener(state => {
      setIsOnline(!!(state.isConnected && state.isInternetReachable));
    });

    return () => {
      unsub();
      netUnsub();
    };
  }, []);

  return { pendingCount, isOnline };
}
