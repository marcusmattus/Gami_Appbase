// Native QueueStorage for packages/chain's TxQueue (§5.6) — see
// packages/chain/src/tx-queue.ts's file header: "Storage is injected (MMKV
// on native, IndexedDB on web)". react-native-mmkv's API is synchronous;
// QueueStorage's is async, so every method just wraps a sync read/write.
//
// react-native-mmkv v4 (the version actually installed — confirmed against
// node_modules/react-native-mmkv/lib/specs/MMKV.nitro.d.ts) rewrote the API
// on top of react-native-nitro-modules: `MMKV` is now a type-only interface
// (instances come from the `createMMKV()` factory, not `new MMKV()`), and
// the deletion method is `.remove(key)`, not `.delete(key)` — this repo's
// installed version doesn't match the API most existing docs/examples for
// react-native-mmkv (v2/v3) describe.
//
// One MMKV entry per tx (keyed by id), plus one index entry listing all ids
// — avoids reading/rewriting one giant JSON blob on every put()/remove().
import { createMMKV } from "react-native-mmkv";
import type { MMKV } from "react-native-mmkv";
import type { QueuedTx, QueueStorage } from "@gami/chain";

const INDEX_KEY = "gami_tx_queue_ids";
const txKey = (id: string) => `gami_tx_queue_tx_${id}`;

// QueuedTx.value is a bigint — JSON.stringify throws on bigint by default,
// so it needs an explicit replacer/reviver pair (tagged string round-trip).
function serializeTx(tx: QueuedTx): string {
  return JSON.stringify(tx, (_key, val) => (typeof val === "bigint" ? `bigint:${val}` : val));
}

function deserializeTx(raw: string): QueuedTx {
  return JSON.parse(raw, (_key, val) =>
    typeof val === "string" && val.startsWith("bigint:") ? BigInt(val.slice("bigint:".length)) : val,
  ) as QueuedTx;
}

function readIds(storage: MMKV): string[] {
  const raw = storage.getString(INDEX_KEY);
  return raw ? (JSON.parse(raw) as string[]) : [];
}

function writeIds(storage: MMKV, ids: string[]): void {
  storage.set(INDEX_KEY, JSON.stringify(ids));
}

export function createMmkvTxQueueStorage(mmkv: MMKV = createMMKV({ id: "gami-tx-queue" })): QueueStorage {
  return {
    async getAll(): Promise<QueuedTx[]> {
      return readIds(mmkv)
        .map((id) => mmkv.getString(txKey(id)))
        .filter((raw): raw is string => raw != null)
        .map(deserializeTx);
    },

    async put(tx: QueuedTx): Promise<void> {
      mmkv.set(txKey(tx.id), serializeTx(tx));
      const ids = readIds(mmkv);
      if (!ids.includes(tx.id)) writeIds(mmkv, [...ids, tx.id]);
    },

    async remove(id: string): Promise<void> {
      mmkv.remove(txKey(id));
      const ids = readIds(mmkv);
      if (ids.includes(id)) writeIds(mmkv, ids.filter((existing) => existing !== id));
    },
  };
}
