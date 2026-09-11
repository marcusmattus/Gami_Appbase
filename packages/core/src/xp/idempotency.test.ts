// Property tests for questIdempotencyKey (§11.4): same inputs → same key;
// any input change → different key; case-insensitive on address only.
import assert from "node:assert/strict";
import test from "node:test";
// NOTE: imported with the .ts extension (not .js) so `node --experimental-strip-types`
// can resolve it directly in dev/test. Production code under src/ uses .js
// extensions per NodeNext convention — see tsconfig.json / the package build.
import { questIdempotencyKey } from "./idempotency.ts";

const QUEST = "quest_001";
const NONCE = "nonce-abc";
const WALLET = "0xAbC1230000000000000000000000000000dEaD";

test("same inputs produce the same key (deterministic)", () => {
  const a = questIdempotencyKey(QUEST, NONCE, WALLET);
  const b = questIdempotencyKey(QUEST, NONCE, WALLET);
  assert.equal(a, b);
});

test("changing questId changes the key", () => {
  const a = questIdempotencyKey(QUEST, NONCE, WALLET);
  const b = questIdempotencyKey("quest_002", NONCE, WALLET);
  assert.notEqual(a, b);
});

test("changing nonce changes the key", () => {
  const a = questIdempotencyKey(QUEST, NONCE, WALLET);
  const b = questIdempotencyKey(QUEST, "nonce-def", WALLET);
  assert.notEqual(a, b);
});

test("changing wallet changes the key", () => {
  const a = questIdempotencyKey(QUEST, NONCE, WALLET);
  const b = questIdempotencyKey(QUEST, NONCE, "0x0000000000000000000000000000000000beef");
  assert.notEqual(a, b);
});

test("wallet casing does not change the key (case-insensitive on address only)", () => {
  const lower = questIdempotencyKey(QUEST, NONCE, WALLET.toLowerCase());
  const upper = questIdempotencyKey(QUEST, NONCE, WALLET.toUpperCase());
  const mixed = questIdempotencyKey(QUEST, NONCE, WALLET);
  assert.equal(lower, upper);
  assert.equal(lower, mixed);
});

test("questId and nonce casing DOES change the key (only address is case-folded)", () => {
  const a = questIdempotencyKey("Quest_001", NONCE, WALLET);
  const b = questIdempotencyKey("quest_001", NONCE, WALLET);
  assert.notEqual(a, b);
});

test("key is a 64-char lowercase hex sha256 digest", () => {
  const key = questIdempotencyKey(QUEST, NONCE, WALLET);
  assert.match(key, /^[0-9a-f]{64}$/);
});
