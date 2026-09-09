// Root ESLint config. Enforces §11.3 gates — these MUST fail CI, not warn.
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import gamiRules from "./eslint-rules/index.mjs";

// IMPORTANT: flat config does NOT merge `no-restricted-imports` `patterns`
// across multiple matching config objects — the LAST matching block for a
// given file wins outright and silently drops every earlier block's
// patterns for that same rule name. Verified by intentionally breaking this
// once during setup (a packages/core violation went undetected because a
// later `**/*.{ts,tsx}` block for a different rule pattern overwrote it) —
// see git history / MIGRATION_NOTES.md. To make that mistake structurally
// hard to repeat, every file scope below computes exactly ONE combined
// `no-restricted-imports` pattern list instead of being assembled from
// separately-authored per-rule blocks.
const PRIVY_WAGMI_PATTERNS = [
  { group: ["@privy-io/*"], message: "Privy must only be imported inside packages/identity (§2.3: Privy is the sole identity system, behind the GamiWallet seam)." },
  { group: ["wagmi", "wagmi/*"], message: "wagmi must only be imported inside packages/identity (§4: screens consume GamiWallet, never wagmi directly)." },
];

const RN_NEXT_EXPO_PATTERNS = [
  { group: ["react-native", "react-native/*"], message: "packages/core must stay platform-agnostic (see §3 hard rule)." },
  { group: ["next", "next/*"], message: "packages/core must stay platform-agnostic (see §3 hard rule)." },
  { group: ["expo", "expo-*", "expo/*"], message: "packages/core must stay platform-agnostic (see §3 hard rule)." },
];

const FARCASTER_MINIKIT_PATTERNS = [
  { group: ["@farcaster/*"], message: "Base App is a standard WebView post-2026-04-09 — no Farcaster mini-app SDKs in apps/web (§4.2, §14)." },
  { group: ["@coinbase/onchainkit/minikit"], message: "MiniKit hangs indefinitely inside the Base App WebView (§4.2). Forbidden in apps/web." },
];

function noRestrictedImports(files, ...patternGroups) {
  return {
    files,
    rules: {
      "no-restricted-imports": ["error", { patterns: patternGroups.flat() }],
    },
  };
}

const restrictedImportScopes = [
  // packages/core: rules 1 + 2 (no privy/wagmi, no RN/Next/Expo).
  noRestrictedImports(["packages/core/**/*.{ts,tsx}"], PRIVY_WAGMI_PATTERNS, RN_NEXT_EXPO_PATTERNS),
  // apps/web: rules 1 + 5 (no privy/wagmi directly, no farcaster/minikit at all).
  noRestrictedImports(["apps/web/**/*.{ts,tsx}"], PRIVY_WAGMI_PATTERNS, FARCASTER_MINIKIT_PATTERNS),
  // Everywhere else EXCEPT packages/identity (the sanctioned seam) and the
  // two scopes above (already covered, each with their own extra patterns):
  // rule 1 only.
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["packages/identity/**", "packages/core/**", "apps/web/**"],
    rules: {
      "no-restricted-imports": ["error", { patterns: PRIVY_WAGMI_PATTERNS }],
    },
  },
];

const arcadeStyleRules = [
  {
    files: ["packages/ui/**/*.{ts,tsx}", "apps/mobile/**/*.{ts,tsx}", "apps/web/**/*.{ts,tsx}"],
    plugins: { gami: gamiRules },
    rules: {
      // Rules 3, 4, 6 — ARCADE Cyber-Brutalist enforcement, see eslint-rules/index.mjs
      "gami/no-rounded-corners": "error",
      "gami/no-soft-effects": "error",
      "gami/numeric-text-must-be-mono": "error",
    },
  },
];

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 2022, sourceType: "module" },
    },
    plugins: { "@typescript-eslint": tsPlugin },
  },
  ...restrictedImportScopes,
  ...arcadeStyleRules,
];
