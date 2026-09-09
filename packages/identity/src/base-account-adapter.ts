// §4.2: web GamiWallet adapter over wagmi (Base Account connector +
// injected fallback). Only file besides privy-expo-adapter.ts allowed to
// import wagmi (eslint rule 1).
//
// NOT YET TYPECHECKED IN THIS SCAFFOLD PASS — wagmi/@base-org/account are
// peer deps not installed here (see MIGRATION_NOTES.md).
//
// Hard rule from §4.2/§4.3: never gate on `sdk.isInMiniApp()`, and never let a
// provider acquisition hang — every path here goes through
// withProviderTimeout, falling through to `injected` if Base Account's
// connector doesn't resolve in time.
import { useCallback, useMemo } from "react";
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useSignMessage,
  useSignTypedData,
  useSendTransaction,
  useSwitchChain,
  useConnectorClient,
} from "wagmi";
import type { Address, Hex, TypedDataDefinition } from "viem";
import type { Eip1193Provider, GamiWallet, WalletStatus } from "@gami/core";
import { withProviderTimeout } from "@gami/core";

function toWalletStatus(wagmiStatus: string): WalletStatus {
  switch (wagmiStatus) {
    case "connected":
      return "connected";
    case "connecting":
    case "reconnecting":
      return "connecting";
    case "disconnected":
      return "disconnected";
    default:
      return "unavailable";
  }
}

export function useBaseAccountWallet(): GamiWallet {
  const { address, status: accountStatus, chainId } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const { signMessageAsync } = useSignMessage();
  const { signTypedDataAsync } = useSignTypedData();
  const { sendTransactionAsync } = useSendTransaction();
  const { data: connectorClient } = useConnectorClient();

  const connect = useCallback(async (): Promise<Address> => {
    // Preferred: Base Account (Sign In With Base). Fallback: any injected
    // provider, with a 5s ceiling so a hung Base App WebView never wedges
    // the connect flow (§4.2, §4.3).
    const baseConnector = connectors.find((c) => c.id === "baseAccount" || c.name === "Base Account");
    const injectedConnector = connectors.find((c) => c.type === "injected");

    const tryConnect = async (connector: (typeof connectors)[number]) => {
      const result = await withProviderTimeout(connectAsync({ connector }), 5000);
      return result.accounts[0];
    };

    if (baseConnector) {
      try {
        return await tryConnect(baseConnector);
      } catch {
        // fall through to injected — never let this hang the caller
      }
    }
    if (injectedConnector) {
      return await tryConnect(injectedConnector);
    }
    throw new Error("No usable wallet connector available in this environment.");
  }, [connectAsync, connectors]);

  const disconnect = useCallback(async (): Promise<void> => {
    await disconnectAsync();
  }, [disconnectAsync]);

  const switchChain = useCallback(
    async (targetChainId: number): Promise<void> => {
      await switchChainAsync({ chainId: targetChainId });
    },
    [switchChainAsync],
  );

  const signMessage = useCallback(
    async (message: string): Promise<Hex> => {
      return signMessageAsync({ message });
    },
    [signMessageAsync],
  );

  const signTypedData = useCallback(
    async (data: TypedDataDefinition): Promise<Hex> => {
      return signTypedDataAsync(data);
    },
    [signTypedDataAsync],
  );

  const sendTransaction = useCallback(
    async (tx: { to: Address; data?: Hex; value?: bigint; gas?: bigint }) => {
      return sendTransactionAsync(tx);
    },
    [sendTransactionAsync],
  );

  const getProvider = useCallback(async (): Promise<Eip1193Provider> => {
    if (!connectorClient) throw new Error("Cannot getProvider before connect().");
    return withProviderTimeout(
      Promise.resolve(connectorClient.transport as unknown as Eip1193Provider),
      5000,
    );
  }, [connectorClient]);

  return useMemo<GamiWallet>(
    () => ({
      kind: "base-account",
      status: toWalletStatus(accountStatus),
      address: address ?? null,
      chainId: chainId ?? null,
      connect,
      disconnect,
      switchChain,
      signMessage,
      signTypedData,
      sendTransaction,
      getProvider,
    }),
    [accountStatus, address, chainId, connect, disconnect, switchChain, signMessage, signTypedData, sendTransaction, getProvider],
  );
}
