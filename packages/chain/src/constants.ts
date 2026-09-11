// LOCKED — §2.1. DO NOT EDIT VALUES.
//
// Gami Chain is a sovereign Cosmos SDK L1. Never describe it as an L2,
// sidechain, or rollup, in code comments, UI copy, or docs. It is not part of
// this build's write path (GAMI_CHAIN_NATIVE flag stays off — see
// packages/core/src/flags).
export const BASE_MAINNET = {
  id: 8453,
  name: "Base",
  rpc: "https://mainnet.base.org",
  explorer: "https://basescan.org",
} as const;

export const BASE_SEPOLIA = {
  id: 84532,
  name: "Base Sepolia",
  rpc: "https://sepolia.base.org",
  explorer: "https://sepolia.basescan.org",
} as const;

// Primary chain for v1. Everything else is read-only or flagged off.
export const PRIMARY_CHAIN = BASE_MAINNET;

// Supported for READ ONLY in v1 (portfolio display). No write paths.
export const READ_ONLY_CHAINS = [137 /* Polygon */, 42161 /* Arbitrum */] as const;

// §5.4: gas ceiling. Any tx whose estimated cost exceeds this requires an
// explicit second confirm before it can be submitted.
export const MAX_TX_GAS_USD = 5.0;

// §5.4: EIP-1559 gas estimation headroom.
export const GAS_HEADROOM_MULTIPLIER = 1.2;

// §5.6: reorg-safe confirmation depth.
export const CONFIRMATION_BLOCKS = 2;

export const MULTICALL3_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11" as const;
