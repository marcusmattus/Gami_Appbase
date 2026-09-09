// LOCKED — §10. GAMI_TOKEN_MODULE is a legal gate: do not flip without written
// clearance. The prebuild bundle-scan (see scripts/assert-no-token-strings.mjs)
// enforces that no $GAMI/tokenomics copy survives a production build while
// this is false.
export const FLAGS = {
  GAMI_TOKEN_MODULE: false,
  SWAP_BRIDGE: false,
  SOLANA: false,
  GAMI_CHAIN_NATIVE: false,
  NOVA: true,
} as const;

export type FlagName = keyof typeof FLAGS;
