// LOCKED — §6.1. Client sends this key on every quest claim; the server dedupes
// on it. Retries are safe by construction; double-payment is impossible. Do
// not change the string layout (questId|nonce|wallet) — the server's unique
// constraint is defined against this exact shape.
//
// Uses viem's pure-JS sha256 (backed by @noble/hashes), NOT node:crypto —
// this module runs inside the Expo/Hermes runtime as well as Next.js and
// plain Node, and node:crypto does not exist there (§3 hard rule: no
// platform-specific runtime dependencies in packages/core).
import { sha256 as viemSha256, toHex } from "viem";

export function questIdempotencyKey(questId: string, nonce: string, wallet: string): string {
  const input = `${questId}|${nonce}|${wallet.toLowerCase()}`;
  const digest = viemSha256(toHex(input)); // 0x-prefixed hex
  return digest.slice(2);
}
