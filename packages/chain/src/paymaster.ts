// §5.5: sponsor quest-claim transactions so XP claims are gasless. The CDP
// paymaster endpoint is configured server-side only (CDP_PAYMASTER_URL is a
// server env var, never NEXT_PUBLIC_/EXPO_PUBLIC_ — see apps/*/.env.example).
// This client module talks to the Gami backend's sponsorship proxy, not CDP
// directly, so no paymaster credential ever ships in a client bundle.
import type { Address, Hex } from "viem";

/**
 * The ONE contract + selector this build is allowed to sponsor. Both the
 * client (defense in depth / clear error messaging) and the server (the real
 * enforcement point) must check against this — never sponsor arbitrary
 * calldata (§5.5, §11.2).
 */
export interface SponsorshipPolicy {
  contract: Address;
  selector: Hex; // first 4 bytes of the calldata, e.g. "0x12345678"
}

export function isSponsorable(policy: SponsorshipPolicy, to: Address, data: Hex): boolean {
  if (to.toLowerCase() !== policy.contract.toLowerCase()) return false;
  const selector = data.slice(0, 10).toLowerCase();
  return selector === policy.selector.toLowerCase();
}

export interface SponsoredTxRequest {
  account: Address;
  to: Address;
  data: Hex;
}

export interface SponsoredTxResult {
  hash: Hex;
}

export interface SponsorshipApiClient {
  /** POSTs to the Gami backend, which validates the policy and forwards to CDP paymaster. */
  requestSponsoredTransaction(req: SponsoredTxRequest): Promise<SponsoredTxResult>;
}

/**
 * Thin wrapper the quest-claim flow calls into. Throws if the request isn't
 * shaped like a quest claim — this is a client-side guard, not the security
 * boundary; the backend re-validates independently (§11.2).
 */
export async function claimQuestSponsored(
  api: SponsorshipApiClient,
  policy: SponsorshipPolicy,
  req: SponsoredTxRequest,
): Promise<SponsoredTxResult> {
  if (!isSponsorable(policy, req.to, req.data)) {
    throw new Error("Refusing to request sponsorship for a non-allowlisted contract/selector.");
  }
  return api.requestSponsoredTransaction(req);
}
