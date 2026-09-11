// §4.1: native GamiWallet adapter over Privy's embedded wallet. This file
// (and base-account-adapter.ts) are the ONLY places in the repo allowed to
// import @privy-io/* (eslint rule 1). No screen may import Privy directly.
//
// VERIFIED against the actually-installed @privy-io/expo@0.51.0 type
// declarations (node_modules/.../@privy-io/expo/dist/index.d.ts) — this is
// exactly the risk §4.2 calls out for the SIWE hook, and it turned out to
// apply here too:
//   - `usePrivy()` has NO `login()` method in this SDK version. Login is
//     inherently multi-step and method-specific (`useLoginWithEmail`'s
//     sendCode/loginWithCode pair, or `useLoginWithOAuth`'s
//     login({ provider: 'google' | 'apple' })), so it cannot be collapsed
//     into GamiWallet's single connect(). Per the screen map in §7, that's
//     actually fine: screens 2/3 (start/otp) own Privy's login UI directly
//     and are NOT behind the GamiWallet seam (login isn't a wallet
//     operation). connect() here instead provisions the embedded wallet for
//     an ALREADY-authenticated user — matching screen 3's "creating"
//     step ("WALLET PROVISIONED / SIGNING KEY READY / ...").
//   - `getUserEmbeddedEthereumWallet` (named in the prompt) does not exist in
//     this SDK version at all. Use `useEmbeddedEthereumWallet()`'s `wallets`
//     array plus `create()` instead.
//   - CORRECTED (see passkey-login-hooks.ts): a first-class
//     `useLoginWithPasskey` hook DOES exist in this installed version — it's
//     just not on the package's main entry point, it's the `@privy-io/expo/passkey`
//     subpath export. The original read of this file only checked the main
//     entry and wrongly concluded §4.1's passkey requirement was
//     unsatisfiable. It isn't; see passkey-login-hooks.ts for the wired hook.
import { useCallback, useMemo, useState } from "react";
import { usePrivy, useEmbeddedEthereumWallet } from "@privy-io/expo";
import type { PrivyUser } from "@privy-io/expo"; // re-exported from @privy-io/public-api
import type { Address, Hex, TypedDataDefinition } from "viem";
import type { Eip1193Provider, GamiWallet, WalletStatus } from "@gami/core";
import { withProviderTimeout } from "@gami/core";

/** Mirrors the removed `getUserEmbeddedEthereumWallet` helper against the real linked_accounts shape. */
function findEmbeddedEthereumAddress(user: PrivyUser | null): Address | null {
  if (!user) return null;
  // `linked_accounts` is a large discriminated union; narrow with `any` here
  // rather than reproducing Privy's full account-type union by hand.
  const account: any = user.linked_accounts?.find(
    (a: any) =>
      a.type === "wallet" &&
      a.chain_type === "ethereum" &&
      a.wallet_client_type === "privy" &&
      a.connector_type === "embedded",
  );
  return (account?.address as Address | undefined) ?? null;
}

export function usePrivyWallet(): GamiWallet {
  const { user, isReady, logout } = usePrivy();
  const { wallets, create } = useEmbeddedEthereumWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);

  const address =
    (wallets[0]?.address as Address | undefined) ?? findEmbeddedEthereumAddress(user) ?? null;

  const status: WalletStatus = !isReady
    ? "unavailable"
    : address
      ? "connected"
      : isConnecting
        ? "connecting"
        : "disconnected";

  const getWalletProvider = useCallback(async (): Promise<Eip1193Provider> => {
    const wallet = wallets[0];
    if (!wallet) throw new Error("Cannot get a provider before connect() has provisioned a wallet.");
    return withProviderTimeout(wallet.getProvider() as unknown as Promise<Eip1193Provider>);
  }, [wallets]);

  const connect = useCallback(async (): Promise<Address> => {
    if (address) return address; // already provisioned

    if (!user) {
      // Login is intentionally NOT this adapter's job — see file header.
      throw new Error(
        "usePrivyWallet().connect() provisions the embedded wallet for an already-authenticated " +
          "Privy user; it does not perform login. Complete the onboarding screens' own " +
          "useLoginWithEmail/useLoginWithOAuth flow first (§7, screens 'start'/'otp'), then call connect().",
      );
    }

    setIsConnecting(true);
    try {
      const { user: updatedUser } = await create();
      const created = findEmbeddedEthereumAddress(updatedUser);
      if (!created) throw new Error("Wallet creation resolved without producing an embedded Ethereum address.");

      try {
        const wallet = wallets.find((w) => w.address === created) ?? wallets[0];
        const provider = await withProviderTimeout(wallet?.getProvider() as unknown as Promise<Eip1193Provider>);
        const hexChainId = (await provider.request({ method: "eth_chainId" })) as Hex;
        setChainId(parseInt(hexChainId, 16));
      } catch {
        // Non-fatal: chainId stays null until the next successful read.
      }

      return created;
    } finally {
      setIsConnecting(false);
    }
  }, [address, user, create, wallets]);

  const disconnect = useCallback(async (): Promise<void> => {
    await logout();
    setChainId(null);
  }, [logout]);

  const switchChain = useCallback(
    async (targetChainId: number): Promise<void> => {
      const provider = await getWalletProvider();
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
      setChainId(targetChainId);
    },
    [getWalletProvider],
  );

  const signMessage = useCallback(
    async (message: string): Promise<Hex> => {
      if (!address) throw new Error("Cannot signMessage before connect().");
      const provider = await getWalletProvider();
      const sig = await provider.request({ method: "personal_sign", params: [message, address] });
      return sig as Hex;
    },
    [getWalletProvider, address],
  );

  const signTypedData = useCallback(
    async (data: TypedDataDefinition): Promise<Hex> => {
      if (!address) throw new Error("Cannot signTypedData before connect().");
      const provider = await getWalletProvider();
      const sig = await provider.request({
        method: "eth_signTypedData_v4",
        params: [address, JSON.stringify(data)],
      });
      return sig as Hex;
    },
    [getWalletProvider, address],
  );

  const sendTransaction = useCallback(
    async (tx: { to: Address; data?: Hex; value?: bigint; gas?: bigint }) => {
      if (!address) throw new Error("Cannot sendTransaction before connect().");
      const provider = await getWalletProvider();
      const hash = await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: address,
            to: tx.to,
            data: tx.data,
            value: tx.value ? `0x${tx.value.toString(16)}` : undefined,
            gas: tx.gas ? `0x${tx.gas.toString(16)}` : undefined,
          },
        ],
      });
      return hash as Hex;
    },
    [getWalletProvider, address],
  );

  return useMemo<GamiWallet>(
    () => ({
      kind: "privy-embedded",
      status,
      address,
      chainId,
      connect,
      disconnect,
      switchChain,
      signMessage,
      signTypedData,
      sendTransaction,
      getProvider: getWalletProvider,
    }),
    [status, address, chainId, connect, disconnect, switchChain, signMessage, signTypedData, sendTransaction, getWalletProvider],
  );
}
