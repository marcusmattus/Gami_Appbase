// Pure formatters. Every numeral a user reads renders in JetBrains Mono at the
// UI layer (packages/ui) — this module only produces the strings, it does not
// touch styling. No DOM, no window, no mock wallet state (support.js in the
// Claude Design project is the canvas-preview runtime, not app logic — nothing
// from it was portable here; see MIGRATION_NOTES.md).
import type { Address } from "viem";

export function truncateAddress(address: Address, headLen = 6, tailLen = 4): string {
  if (address.length <= headLen + tailLen + 2) return address;
  return `${address.slice(0, 2 + headLen)}…${address.slice(-tailLen)}`;
}

/** Formats a bigint amount with `decimals` precision, trimming trailing zeros. */
export function formatTokenAmount(raw: bigint, decimals: number, maxFractionDigits = 6): string {
  const negative = raw < 0n;
  const abs = negative ? -raw : raw;
  const base = 10n ** BigInt(decimals);
  const whole = abs / base;
  const frac = abs % base;
  let fracStr = frac.toString().padStart(decimals, "0").slice(0, maxFractionDigits);
  fracStr = fracStr.replace(/0+$/, "");
  const sign = negative ? "-" : "";
  return fracStr.length > 0 ? `${sign}${whole}.${fracStr}` : `${sign}${whole}`;
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function formatXp(xp: number): string {
  return new Intl.NumberFormat("en-US").format(Math.trunc(xp));
}

export function formatTxHash(hash: string, headLen = 8, tailLen = 6): string {
  if (hash.length <= headLen + tailLen + 2) return hash;
  return `${hash.slice(0, 2 + headLen)}…${hash.slice(-tailLen)}`;
}
