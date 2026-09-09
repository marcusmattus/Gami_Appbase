// Web QueueStorage for packages/chain's TxQueue (§5.6) — see
// packages/chain/src/tx-queue.ts's file header: "Storage is injected (MMKV
// on native, IndexedDB on web)". Hand-rolled against the native IndexedDB
// API directly — the store is a flat id -> QueuedTx map, small enough that a
// dependency (idb, dexie, ...) would be pure overhead.
//
// IndexedDB doesn't exist during Next.js's server-side rendering/build —
// every method opens the DB lazily on first call (never at module load)
// rather than assuming a browser environment up front.
"use client";

import type { QueuedTx, QueueStorage } from "@gami/chain";

const DB_NAME = "gami-tx-queue";
const STORE_NAME = "queued-txs";
const DB_VERSION = 1;

// QueuedTx.value is a bigint — IndexedDB's structured-clone algorithm
// supports bigint natively (unlike JSON.stringify), so tx objects are
// stored as-is, no serialization needed.

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function runTransaction<T>(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const request = run(tx.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function createIndexedDbTxQueueStorage(): QueueStorage {
  return {
    async getAll(): Promise<QueuedTx[]> {
      const db = await openDb();
      try {
        return await runTransaction(db, "readonly", (store) => store.getAll());
      } finally {
        db.close();
      }
    },

    async put(tx: QueuedTx): Promise<void> {
      const db = await openDb();
      try {
        await runTransaction(db, "readwrite", (store) => store.put(tx));
      } finally {
        db.close();
      }
    },

    async remove(id: string): Promise<void> {
      const db = await openDb();
      try {
        await runTransaction(db, "readwrite", (store) => store.delete(id));
      } finally {
        db.close();
      }
    },
  };
}
