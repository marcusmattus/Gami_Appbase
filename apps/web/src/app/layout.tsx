// Root layout — first real screen-facing code in apps/web (P5 previously
// only covered apps/mobile; see MIGRATION_NOTES.md §4.4). Wires the two
// sanctioned providers from @gami/identity: GamiPrivyWebProvider (identity,
// §4.2 "one user, one Privy DID, whichever shell they arrive through") and
// GamiWalletProvider (wagmi/Base Account, the one wallet this shell uses).
// eslint rule 1 means this file may never import wagmi or @privy-io/* itself.
import type { Metadata } from "next";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GamiPrivyWebProvider, GamiWalletProvider } from "@gami/identity/web";

export const metadata: Metadata = {
  title: "Gami Wallet",
};

// Every route under this layout depends on wallet/auth state that's
// inherently per-visitor and can never be meaningfully prerendered — forcing
// dynamic rendering also means GamiWalletProvider's deliberate "no RPC URL
// configured" throw (§2.1: never fall back to an unauthenticated public RPC)
// fires per-request instead of at build time, which is where it belongs.
export const dynamic = "force-dynamic";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";
const BASE_RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL ?? "";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <GamiPrivyWebProvider appId={PRIVY_APP_ID}>
          <GamiWalletProvider rpcUrl={BASE_RPC_URL}>
            {/* ArcadeScreen (packages/ui/src/Screen.tsx) calls useSafeAreaInsets
                — needs this provider in the tree even on web, where
                react-native-safe-area-context reports zero insets. */}
            <SafeAreaProvider>{children}</SafeAreaProvider>
          </GamiWalletProvider>
        </GamiPrivyWebProvider>
      </body>
    </html>
  );
}
