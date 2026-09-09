// §5.6: persisted tx queue, survives app restart, exponential backoff,
// replacement-tx detection, reorg-safe confirmation at CONFIRMATION_BLOCKS.
//
// Storage is injected (MMKV on native, IndexedDB on web) so this module has
// no platform dependency — apps/mobile and apps/web each provide a
// QueueStorage implementation.
import type { Address, Hash, Hex, PublicClient, Transport } from "viem";
import type { GamiChain } from "./clients.js";
import { CONFIRMATION_BLOCKS } from "./constants.js";

export type QueuedTxStatus = "pending" | "replaced" | "confirmed" | "failed";

export interface QueuedTx {
  id: string; // idempotency key or client-generated uuid
  hash: Hash;
  nonce: number;
  account: Address;
  to: Address;
  data?: Hex;
  value?: bigint;
  status: QueuedTxStatus;
  submittedAt: number;
  attempt: number;
}

export interface QueueStorage {
  getAll(): Promise<QueuedTx[]>;
  put(tx: QueuedTx): Promise<void>;
  remove(id: string): Promise<void>;
}

const MAX_ATTEMPTS = 5;
const BASE_BACKOFF_MS = 2000;

export function backoffDelayMs(attempt: number): number {
  return BASE_BACKOFF_MS * 2 ** Math.min(attempt, 6);
}

export class TxQueue {
  constructor(
    private readonly storage: QueueStorage,
    private readonly client: PublicClient<Transport, GamiChain>,
  ) {}

  async enqueue(tx: Omit<QueuedTx, "status" | "submittedAt" | "attempt">): Promise<void> {
    await this.storage.put({ ...tx, status: "pending", submittedAt: Date.now(), attempt: 0 });
  }

  /** Call on app start and periodically; resolves pending txs against chain state. */
  async reconcile(): Promise<QueuedTx[]> {
    const all = await this.storage.getAll();
    const updated: QueuedTx[] = [];

    for (const tx of all) {
      if (tx.status !== "pending") {
        updated.push(tx);
        continue;
      }

      const onChainNonce = await this.client.getTransactionCount({ address: tx.account });

      // Replacement-tx detection: a later nonce landed while this one is
      // still pending at the RPC's tip → treat as replaced, not stuck.
      if (onChainNonce > tx.nonce) {
        const receipt = await this.client
          .getTransactionReceipt({ hash: tx.hash })
          .catch(() => null);
        if (!receipt) {
          const replaced: QueuedTx = { ...tx, status: "replaced" };
          await this.storage.put(replaced);
          updated.push(replaced);
          continue;
        }
      }

      const receipt = await this.client
        .waitForTransactionReceipt({ hash: tx.hash, confirmations: CONFIRMATION_BLOCKS, timeout: 1 })
        .catch(() => null);

      if (receipt?.status === "success") {
        const confirmed: QueuedTx = { ...tx, status: "confirmed" };
        await this.storage.put(confirmed);
        updated.push(confirmed);
      } else if (receipt?.status === "reverted") {
        const failed: QueuedTx = { ...tx, status: "failed" };
        await this.storage.put(failed);
        updated.push(failed);
      } else if (tx.attempt >= MAX_ATTEMPTS) {
        const failed: QueuedTx = { ...tx, status: "failed" };
        await this.storage.put(failed);
        updated.push(failed);
      } else {
        updated.push(tx); // still pending — caller may re-poll after backoffDelayMs(tx.attempt)
      }
    }

    return updated;
  }
}
