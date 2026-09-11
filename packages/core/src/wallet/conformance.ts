// Shared conformance suite (§13: "Both wallet adapters pass the identical
// conformance suite"). P1 deliverable: this suite exists and FAILS for both
// adapters (no adapters implemented yet). P2/P3 make it pass for
// privy-embedded / base-account respectively.
//
// Framework-agnostic on purpose: it takes a `test`/`assert` pair so it can be
// driven by node:test, vitest, or jest without packages/core depending on any
// of them (keeping it inside the no-RN/no-Next hard rule).
import type { GamiWallet } from "./types.js";

export interface ConformanceHarness {
  test: (name: string, fn: () => Promise<void> | void) => void;
  assert: (condition: unknown, message: string) => asserts condition;
}

export interface WalletFactory {
  /** Constructs (but does not connect) a fresh adapter instance for one test. */
  create: () => GamiWallet;
}

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const HEX_RE = /^0x[a-fA-F0-9]*$/;

/**
 * Runs the same assertions against any GamiWallet implementation. Call once
 * per adapter (kind: "privy-embedded" | "base-account") with a fresh factory.
 */
export function runGamiWalletConformanceSuite(
  adapterName: string,
  factory: WalletFactory,
  harness: ConformanceHarness,
) {
  // Destructuring `assert` here would drop its `asserts condition` type
  // predicate (TS2775) — call it through `harness.assert(...)` instead.
  const { test } = harness;
  const assert: ConformanceHarness["assert"] = harness.assert;

  test(`[${adapterName}] starts disconnected or unavailable, never connected`, () => {
    const wallet = factory.create();
    assert(
      wallet.status === "disconnected" || wallet.status === "unavailable",
      `expected fresh wallet status to be disconnected|unavailable, got ${wallet.status}`,
    );
    assert(wallet.address === null, "fresh wallet must not have an address before connect()");
  });

  test(`[${adapterName}] connect() resolves a checksummable EVM address`, async () => {
    const wallet = factory.create();
    const address = await wallet.connect();
    assert(ADDRESS_RE.test(address), `connect() must resolve a 0x-prefixed 20-byte address, got ${address}`);
    assert(wallet.address === address, "wallet.address must reflect the connected address");
    assert(wallet.status === "connected", "status must be 'connected' after connect() resolves");
  });

  test(`[${adapterName}] chainId is set once connected`, async () => {
    const wallet = factory.create();
    await wallet.connect();
    assert(typeof wallet.chainId === "number", "chainId must be a number once connected");
  });

  test(`[${adapterName}] signMessage returns hex`, async () => {
    const wallet = factory.create();
    await wallet.connect();
    const sig = await wallet.signMessage("gami-wallet-conformance-nonce");
    assert(HEX_RE.test(sig), `signMessage must resolve hex, got ${sig}`);
  });

  test(`[${adapterName}] getProvider returns something EIP-1193-shaped`, async () => {
    const wallet = factory.create();
    await wallet.connect();
    const provider = await wallet.getProvider();
    assert(typeof provider.request === "function", "provider must expose request()");
  });

  test(`[${adapterName}] disconnect() clears address and status`, async () => {
    const wallet = factory.create();
    await wallet.connect();
    await wallet.disconnect();
    assert(wallet.address === null, "address must be null after disconnect()");
    assert(wallet.status === "disconnected", "status must be 'disconnected' after disconnect()");
  });

  test(`[${adapterName}] switchChain updates chainId`, async () => {
    const wallet = factory.create();
    await wallet.connect();
    const target = wallet.chainId === 8453 ? 84532 : 8453;
    await wallet.switchChain(target);
    assert(wallet.chainId === target, `expected chainId ${target} after switchChain, got ${wallet.chainId}`);
  });
}
