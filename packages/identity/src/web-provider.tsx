// The ONLY @privy-io/react-auth-touching export apps/web's root layout
// should ever import — mirrors mobile-provider.tsx's role (eslint rule 1,
// §11.3: Privy imports stay inside packages/identity).
//
// This does NOT replace GamiWalletProvider (provider.tsx, wagmi/Base
// Account) — the two are layered. Web's wallet connection stays on wagmi
// (Base Account, per §4.2/§4.3); Privy here is identity-only, reached via
// useGamiSiweLogin (web-login-hooks.ts) after a wallet is connected.
// embeddedWallets stay off (Privy's default) since this app never wants
// Privy to create its own wallet on web — Base Account is the one wallet.
"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export interface GamiPrivyWebProviderProps {
  appId: string;
  children: React.ReactNode;
}

export function GamiPrivyWebProvider({ appId, children }: GamiPrivyWebProviderProps) {
  return (
    <PrivyProvider
      appId={appId}
      config={{
        // "wallet" is the loginMethods value that covers SIWE — there is no
        // separate "siwe" literal (confirmed against Privy's docs; useLoginWithSiwe
        // is the imperative hook, this just needs the method enabled). Also
        // requires "Wallet" turned on for this app in the Privy dashboard.
        loginMethods: ["wallet"],
        embeddedWallets: { ethereum: { createOnLogin: "off" } },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
