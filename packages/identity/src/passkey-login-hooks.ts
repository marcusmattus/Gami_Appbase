// CORRECTION to the P2 note in privy-expo-adapter.ts / MIGRATION_NOTES.md:
// @privy-io/expo@0.51.0 (the version actually installed — confirmed via
// node_modules/@privy-io/expo/package.json `exports`) DOES ship a first-class
// passkey-login hook. It was missed earlier because it isn't on the package's
// main entry point — it's a separate subpath export:
//   import { useLoginWithPasskey } from "@privy-io/expo/passkey";
// (`usePrivy()`'s main export only has passkeys inside MFA enrollment, which
// is what the earlier pass found and incorrectly generalized from.) §4.1's
// passkey requirement is satisfiable after all — no SDK bump or support
// ticket needed.
//
// Passkey login is a login method, not a wallet operation — same reasoning
// as privy-login-hooks.ts — so it lives here, not in privy-expo-adapter.ts.
import { useLoginWithPasskey } from "@privy-io/expo/passkey";

/**
 * The URL origin where this app's apple-app-site-association
 * (`webcredentials` service) and Android assetlinks.json are hosted. Must
 * match an `associatedDomains: ["webcredentials:<domain>"]` entry in
 * app.config.ts. Hosting those two well-known files (with the real Apple
 * Team ID / Android signing-cert SHA256 fingerprint) is a manual step that
 * needs account access — see MIGRATION_NOTES.md.
 */
export const GAMI_PASSKEY_RELYING_PARTY = "https://wallet.gamiprotocol.io";

// Pure passthrough (matches useGamiEmailLogin/useGamiOAuthLogin in
// privy-login-hooks.ts) — not a renaming wrapper. Destructuring/renaming
// fields here forces TypeScript to synthesize a new declared type from
// @privy-io/expo/passkey's PasskeyHookResult, which isn't itself exported
// (TS2742: "cannot be named without a reference to ...predicates-a2b727d8").
// A passthrough return type is expressible as `ReturnType<typeof useLoginWithPasskey>`
// instead, which resolves fine since the function itself is exported.
export function useGamiPasskeyLogin(): ReturnType<typeof useLoginWithPasskey> {
  return useLoginWithPasskey();
}
