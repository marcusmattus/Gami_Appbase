// The ONLY @privy-io/expo-touching export apps/mobile's root layout should
// ever import — mirrors provider.tsx's role for apps/web (eslint rule 1,
// §11.3: Privy imports stay inside packages/identity).
import { PrivyProvider } from "@privy-io/expo";
import { base, baseSepolia } from "viem/chains";

export interface GamiPrivyProviderProps {
  appId: string;
  clientId?: string;
  children: React.ReactNode;
}

type PrivyProviderProps = Parameters<typeof PrivyProvider>[0];

// This file lives in packages/identity, but is compiled as part of
// apps/mobile's `tsc` run (apps/mobile imports @gami/identity/mobile). A bare
// `import ... from "react"` written HERE resolves against packages/identity's
// OWN node_modules/@types/react — currently pinned to an older version for
// provider.tsx's unrelated wagmi/web needs — not apps/mobile's real one. That
// mismatch (one bigint-inclusive ReactNode, one not) is exactly the same
// class of issue as provider.tsx's SafeWagmiProvider cast, just one layer
// deeper: it's not only Privy's OWN declared `children` type that conflicts,
// it's that importing React's types AT ALL from this file is unreliable.
// Fully hand-rolling the wrapper's prop shape (no import from "react",
// `JSX.Element` used as the ambient global return type — the one thing
// guaranteed to be singular across the whole compiled program, since two
// incompatible global JSX namespaces would fail to merge at all) sidesteps
// this permanently instead of chasing whichever @types/react version wins.
const SafePrivyProvider = PrivyProvider as unknown as (props: {
  appId: string;
  clientId?: string;
  supportedChains?: unknown;
  children?: unknown;
}) => JSX.Element;

export function GamiPrivyProvider({ appId, clientId, children }: GamiPrivyProviderProps) {
  return (
    <SafePrivyProvider
      appId={appId}
      clientId={clientId}
      // viem chain objects match the shape Privy's SDK expects (EIP-3085-ish);
      // cast documented rather than hidden — verify against the installed
      // @privy-io/js-sdk-core Chain type if this ever fails to typecheck
      // after a Privy version bump.
      supportedChains={[base, baseSepolia] as unknown as PrivyProviderProps["supportedChains"]}
    >
      {children}
    </SafePrivyProvider>
  );
}
