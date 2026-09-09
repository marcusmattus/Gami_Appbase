// The wallet seam (§4). Every screen, hook, and service in this repo consumes
// ONLY this interface — never Privy, never wagmi, never a raw EIP-1193 provider.
// Two adapters implement it (packages/identity): privy-embedded (native) and
// base-account (web). Both must pass the conformance suite in ./conformance.ts.
import type { Address, Hash, Hex, TypedDataDefinition } from "viem";

export type WalletStatus = "unavailable" | "disconnected" | "connecting" | "connected";

export interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] | object }): Promise<unknown>;
}

export interface SendTransactionRequest {
  to: Address;
  data?: Hex;
  value?: bigint;
  gas?: bigint;
}

export interface GamiWallet {
  readonly kind: "privy-embedded" | "base-account" | "injected";
  readonly status: WalletStatus;
  readonly address: Address | null;
  readonly chainId: number | null;

  connect(): Promise<Address>;
  disconnect(): Promise<void>;
  switchChain(chainId: number): Promise<void>;

  signMessage(message: string): Promise<Hex>;
  signTypedData(data: TypedDataDefinition): Promise<Hex>;
  sendTransaction(tx: SendTransactionRequest): Promise<Hash>;

  /** Returns an EIP-1193 provider for viem/wagmi interop. */
  getProvider(): Promise<Eip1193Provider>;
}
