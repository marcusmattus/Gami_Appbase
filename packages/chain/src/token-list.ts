// §5.3: curated allowlist only. No arbitrary-token auto-display — that's a
// scam-airdrop vector and an App Store risk. Add tokens here deliberately,
// never by indexing incoming transfers.
import type { Address } from "viem";

export interface GamiToken {
  address: Address;
  symbol: string;
  decimals: number;
  name: string;
}

export const BASE_MAINNET_TOKEN_ALLOWLIST: readonly GamiToken[] = [
  {
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    symbol: "USDC",
    decimals: 6,
    name: "USD Coin",
  },
  {
    address: "0x42000000000000000000000000000000000006",
    symbol: "WETH",
    decimals: 18,
    name: "Wrapped Ether",
  },
] as const;
