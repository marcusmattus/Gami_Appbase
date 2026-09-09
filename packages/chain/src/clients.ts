// §5.1: Clients. `publicClient` (viem, Base) and a `walletClient` factory
// built from `GamiWallet.getProvider()` — never construct a walletClient from
// a raw injected/window provider directly; it must come through the seam.
import { createPublicClient, createWalletClient, custom, http, fallback } from "viem";
import type { PublicClient, WalletClient, Transport } from "viem";
import { base, baseSepolia } from "viem/chains";
import type { Eip1193Provider } from "@gami/core";
import { BASE_MAINNET, BASE_SEPOLIA } from "./constants.js";

export type ChainEnv = "mainnet" | "sepolia";
export type GamiChain = typeof base | typeof baseSepolia;

// NOTE: Base's chain definition carries OP-Stack-specific formatters (e.g. the
// "deposit" transaction type), which makes its inferred client type
// incompatible with the bare, chain-agnostic `PublicClient`/`WalletClient`
// generics — annotating with those directly produces a spurious TS2719
// ("two different types... unrelated") on methods like getBlock(). Pinning
// the chain generic to `GamiChain` keeps the annotation accurate instead of
// removing it.

/**
 * Primary transport must be an authenticated provider proxied through the
 * Gami backend (EXPO_PUBLIC_BASE_RPC_URL / NEXT_PUBLIC_BASE_RPC_URL). Never
 * ship an RPC key in the client bundle. The locked public RPCs from
 * §2.1 are a fallback only, used if the proxied URL is unreachable.
 */
export function createGamiPublicClient(
  env: ChainEnv,
  proxiedRpcUrl?: string,
): PublicClient<Transport, GamiChain> {
  const chain = env === "mainnet" ? base : baseSepolia;
  const fallbackUrl = env === "mainnet" ? BASE_MAINNET.rpc : BASE_SEPOLIA.rpc;

  const transport = proxiedRpcUrl
    ? fallback([http(proxiedRpcUrl), http(fallbackUrl)])
    : http(fallbackUrl);

  return createPublicClient({ chain, transport });
}

/**
 * Builds a viem WalletClient from a GamiWallet's EIP-1193 provider. This is
 * the ONLY sanctioned way to get a WalletClient in this codebase — never
 * construct one from window.ethereum or a raw connector.
 */
export function createGamiWalletClient(
  env: ChainEnv,
  provider: Eip1193Provider,
): WalletClient<Transport, GamiChain> {
  const chain = env === "mainnet" ? base : baseSepolia;
  return createWalletClient({ chain, transport: custom(provider) });
}
