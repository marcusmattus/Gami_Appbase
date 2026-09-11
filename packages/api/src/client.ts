// Typed client for the Gami backend (§3). Every mutating call carries the
// verified Privy access token (§11.2) — this module never accepts a raw
// wallet address as an auth credential, only a bearer token the backend
// re-verifies against Privy's JWKS.
import { questIdempotencyKey } from "@gami/core";

export interface GamiApiConfig {
  baseUrl: string;
  getAccessToken: () => Promise<string>;
}

export interface ClaimQuestParams {
  questId: string;
  nonce: string;
  wallet: string;
}

export interface ClaimQuestResponse {
  xpAwarded: number;
  txHash: `0x${string}` | null;
  duplicate: boolean;
}

export class GamiApiClient {
  constructor(private readonly config: GamiApiConfig) {}

  private async authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
    const token = await this.config.getAccessToken();
    return fetch(`${this.config.baseUrl}${path}`, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  }

  async claimQuest(params: ClaimQuestParams): Promise<ClaimQuestResponse> {
    const idempotencyKey = questIdempotencyKey(params.questId, params.nonce, params.wallet);
    const res = await this.authedFetch(`/quests/${params.questId}/claim`, {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify({ wallet: params.wallet }),
    });
    if (!res.ok) throw new Error(`claimQuest failed: ${res.status} ${await res.text()}`);
    return res.json() as Promise<ClaimQuestResponse>;
  }
}
