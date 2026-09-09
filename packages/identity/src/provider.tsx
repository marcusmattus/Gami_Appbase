// The ONLY wagmi-touching export apps/web's root layout should ever import.
// Wraps WagmiProvider + QueryClientProvider so app code never needs its own
// wagmi import (eslint rule 1, §11.3).
"use client";

import { useState } from "react";
import type { PropsWithChildren, ReactElement } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBaseAccountWagmiConfig } from "./base-account-config.js";

export interface GamiWalletProviderProps {
  rpcUrl: string;
  children: React.ReactNode;
}

type WagmiProviderProps = Parameters<typeof WagmiProvider>[0];

/**
 * WagmiProvider internally wraps children in @tanstack/react-query's Hydrate,
 * whose declared return type (FunctionComponentElement<PropsWithChildren<HydrateProps>>)
 * fails TS's "usable as JSX" structural check under some @types/react /
 * @tanstack/react-query patch combinations (TS2786, "Property 'children' is
 * missing... required in type ReactPortal") — this held even with @types/react
 * pinned to an exact known-good version and reappeared after an UNRELATED
 * dependency change elsewhere in the workspace shifted pnpm's peer
 * resolution, so it's not safe to fix by chasing exact versions. Widening the
 * component's call signature here (same pattern as mobile-provider.tsx's
 * supportedChains cast) sidesteps the fragile inference instead.
 */
const SafeWagmiProvider = WagmiProvider as unknown as (props: PropsWithChildren<WagmiProviderProps>) => ReactElement;

export function GamiWalletProvider({ rpcUrl, children }: GamiWalletProviderProps) {
  const [config] = useState(() => createBaseAccountWagmiConfig(rpcUrl));
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SafeWagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SafeWagmiProvider>
  );
}
