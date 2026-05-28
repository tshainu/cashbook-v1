/**
 * Offline Queue — uses expo-sqlite to persist pending transactions
 * when the device has no internet. syncService drains it every 5s.
 */
import * as SQLite from "expo-sqlite";

export type QueuedTransaction = {
  id: number;
  payload: string; // JSON string of the transaction body
  retries: number;
  createdAt: number; // unix ms
};

let _db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync("cashbook_offline.db");
  await _db.execAsync(`
    CREATE TABLE IF NOT EXISTS offline_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payload TEXT NOT NULL,
      retries INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
  `);
  return _db;
}

/** Add a transaction to the offline queue */
export async function enqueue(payload: object): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "INSERT INTO offline_queue (payload, retries, created_at) VALUES (?, ?, ?)",
    [JSON.stringify(payload), 0, Date.now()]
  );
}

/** Get all pending items (oldest first) */
export async function getPending(): Promise<QueuedTransaction[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: number;
    payload: string;
    retries: number;
    created_at: number;
  }>("SELECT * FROM offline_queue ORDER BY created_at ASC");
  return rows.map(r => ({
    id: r.id,
    payload: r.payload,
    retries: r.retries,
    createdAt: r.created_at,
  }));
}

/** Count pending items */
export async function getPendingCount(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM offline_queue"
  );
  return row?.count ?? 0;
}

/** Remove a successfully synced item */
export async function dequeue(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM offline_queue WHERE id = ?", [id]);
}

/** Increment retry count (drop after 10 retries) */
export async function incrementRetry(id: number): Promise<void> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ retries: number }>(
    "SELECT retries FROM offline_queue WHERE id = ?",
    [id]
  );
  if (!row) return;
  if (row.retries >= 10) {
    // Give up — remove from queue
    await db.runAsync("DELETE FROM offline_queue WHERE id = ?", [id]);
  } else {
    await db.runAsync(
      "UPDATE offline_queue SET retries = retries + 1 WHERE id = ?",
      [id]
    );
  }
}

/** Clear everything (e.g. on logout) */
export async function clearQueue(): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM offline_queue");
}
