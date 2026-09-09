// §5.2: native ETH + ERC-20 via multicall3. Batch every read; never loop
// readContract per token.
import { erc20Abi, formatUnits } from "viem";
import type { Address, PublicClient, Transport } from "viem";
import type { GamiToken } from "./token-list.js";
import type { GamiChain } from "./clients.js";
import { MULTICALL3_ADDRESS } from "./constants.js";

export interface TokenBalance {
  token: GamiToken;
  raw: bigint;
  formatted: string;
}

export interface PortfolioBalances {
  native: { raw: bigint; formatted: string };
  tokens: TokenBalance[];
}

export async function fetchPortfolioBalances(
  client: PublicClient<Transport, GamiChain>,
  owner: Address,
  allowlist: readonly GamiToken[],
): Promise<PortfolioBalances> {
  const [nativeRaw, tokenResults] = await Promise.all([
    client.getBalance({ address: owner }),
    client.multicall({
      multicallAddress: MULTICALL3_ADDRESS,
      allowFailure: true,
      contracts: allowlist.map((token) => ({
        address: token.address,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [owner],
      })),
    }),
  ]);

  const tokens: TokenBalance[] = allowlist.map((token, i) => {
    const result = tokenResults[i];
    const raw = result.status === "success" ? (result.result as bigint) : 0n;
    return { token, raw, formatted: formatUnits(raw, token.decimals) };
  });

  return {
    native: { raw: nativeRaw, formatted: formatUnits(nativeRaw, 18) },
    tokens,
  };
}
