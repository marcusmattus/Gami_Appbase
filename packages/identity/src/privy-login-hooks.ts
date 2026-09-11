// Login itself isn't a GamiWallet operation (see privy-expo-adapter.ts's file
// header) — it's inherently multi-step and provider-specific, so it isn't
// part of the GamiWallet seam. But it's still Privy-specific, so it still
// has to live in packages/identity (eslint rule 1) rather than in the
// onboarding screens directly. These thin re-exports are what
// apps/mobile/app/onboarding/{start,otp}.tsx call.
import { useLoginWithEmail, useLoginWithOAuth } from "@privy-io/expo";

export function useGamiEmailLogin() {
  return useLoginWithEmail();
}

export type GamiOAuthProvider = "google" | "apple";

export function useGamiOAuthLogin() {
  return useLoginWithOAuth();
}
