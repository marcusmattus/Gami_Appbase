// apps/web's only entry point into this package (import from
// "@gami/identity/web", never the bare package). See mobile.ts's header for
// why this package no longer has one shared barrel — apps/mobile must never
// resolve @privy-io/react-auth/wagmi/@base-org/account through here.
export * from "./base-account-adapter.js";
export * from "./base-account-config.js";
export * from "./provider.js";
export * from "./web-provider.js";
export * from "./web-login-hooks.js";
