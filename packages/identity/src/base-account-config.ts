// §4.2. Base App is a standard WebView post-2026-04-09 — the connector list
// is Base Account + injected only. No Farcaster / MiniKit connectors here,
// ever (§14, eslint rule 5 blocks that import outright in apps/web).
//
// Lives in packages/identity, NOT apps/web, because eslint rule 1 (§11.3)
// forbids importing wagmi anywhere outside this package — including the app
// shell's provider wiring. apps/web only ever imports `GamiWalletProvider`
// (provider.tsx in this package) and the `GamiWallet` seam itself; it never
// touches wagmi's Config type or its connectors directly.
import { http, createConfig, createStorage, cookieStorage } from "wagmi";
import type { Config } from "wagmi";
import { base } from "wagmi/chains";
import { baseAccount, injected } from "wagmi/connectors";

export function createBaseAccountWagmiConfig(rpcUrl: string): Config {
  if (!rpcUrl) {
    throw new Error("A proxied Base RPC URL is required — never fall back to an unauthenticated public RPC in production (§2.1).");
  }
  return createConfig({
    chains: [base],
    connectors: [baseAccount({ appName: "Gami Wallet" }), injected()],
    storage: createStorage({ storage: cookieStorage }),
    ssr: true,
    transports: { [base.id]: http(rpcUrl) },
  });
}
