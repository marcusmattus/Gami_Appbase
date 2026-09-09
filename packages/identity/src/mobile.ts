// apps/mobile's only entry point into this package (import from
// "@gami/identity/mobile", never the bare package). Split from the web
// entry point (web.ts) because a single shared barrel re-exporting both
// platforms' code meant Metro had to resolve @privy-io/react-auth (and its
// styled-components dependency, which fails to resolve on React Native) just
// because apps/mobile imported ANYTHING from @gami/identity — even though no
// mobile code ever calls the web-only exports. Found by actually running a
// real Metro bundle (`npx expo export`), not by inspection.
export * from "./privy-expo-adapter.js";
export * from "./mobile-provider.js";
export * from "./privy-login-hooks.js";
export * from "./passkey-login-hooks.js";
