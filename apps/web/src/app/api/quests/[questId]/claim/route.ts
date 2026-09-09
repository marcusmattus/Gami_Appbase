// Dev-stub for packages/api/src/client.ts's GamiApiClient.claimQuest() —
// there is no real Gami backend yet (MIGRATION_NOTES.md), this exists so
// the quest-claim contract has something real to call against locally.
//
// NOT PRODUCTION: dedup state is an in-memory Map, which resets on every
// server restart and is NOT shared across serverless instances/replicas —
// a real backend needs a persistent unique constraint on Idempotency-Key
// (§6.1/§11.2), not this. This also does not verify the Authorization
// bearer token against Privy's JWKS (packages/api/src/client.ts's own
// header comment: "the backend re-verifies against Privy's JWKS" — that
// verification does not exist here, only the request shape is honored).
import { NextResponse } from "next/server";

interface ClaimQuestResponse {
  xpAwarded: number;
  txHash: `0x${string}` | null;
  duplicate: boolean;
}

const claimsByIdempotencyKey = new Map<string, ClaimQuestResponse>();

const XP_AWARDED_PER_CLAIM = 250;

export async function POST(
  request: Request,
  { params }: { params: { questId: string } },
): Promise<NextResponse<ClaimQuestResponse | { error: string }>> {
  const idempotencyKey = request.headers.get("Idempotency-Key");
  if (!idempotencyKey) {
    return NextResponse.json({ error: "Missing required Idempotency-Key header." }, { status: 400 });
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing bearer token." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { wallet?: string } | null;
  if (!body?.wallet) {
    return NextResponse.json({ error: "Missing required 'wallet' field." }, { status: 400 });
  }

  const existing = claimsByIdempotencyKey.get(idempotencyKey);
  if (existing) {
    return NextResponse.json({ ...existing, duplicate: true });
  }

  void params.questId; // real backend would validate the quest exists/is claimable; this stub doesn't.
  const response: ClaimQuestResponse = { xpAwarded: XP_AWARDED_PER_CLAIM, txHash: null, duplicate: false };
  claimsByIdempotencyKey.set(idempotencyKey, response);
  return NextResponse.json(response);
}
