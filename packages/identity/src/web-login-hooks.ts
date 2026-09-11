// CORRECTION to apps/web/src/app/api/auth/siwe/{nonce,verify}/route.ts (now
// deleted): those routes hand-rolled a nonce/verify/`mintPrivySessionFromSiwe`
// flow against an API that doesn't exist — Privy has no server-side "mint a
// session from an externally-verified SIWE signature" call. It already
// solves this end-to-end on the client via useLoginWithSiwe: generateSiweMessage
// asks Privy's own backend for the nonce/message, and loginWithSiwe submits
// the signature straight to Privy, which verifies it and establishes the
// session itself (confirmed against docs.privy.io — see MIGRATION_NOTES.md).
// No custom server route, no `siwe` npm package, no PRIVY_APP_SECRET, needed
// for this flow at all.
"use client";

import { useCallback } from "react";
import { useLoginWithSiwe } from "@privy-io/react-auth";
import type { GamiWallet } from "@gami/core";

export function useGamiSiweLogin() {
  const { generateSiweMessage, loginWithSiwe, state } = useLoginWithSiwe();

  const signInWithWallet = useCallback(
    async (wallet: GamiWallet) => {
      if (!wallet.address || wallet.chainId == null) {
        throw new Error("Connect a wallet (GamiWallet.connect()) before signing in.");
      }
      // CAIP-2 format, per Privy's generateSiweMessage signature.
      const message = await generateSiweMessage({
        address: wallet.address,
        chainId: `eip155:${wallet.chainId}`,
      });
      const signature = await wallet.signMessage(message);
      return loginWithSiwe({ signature, message });
    },
    [generateSiweMessage, loginWithSiwe],
  );

  return { signInWithWallet, state };
}
