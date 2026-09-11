// Shell/environment detection (§4.3). Never gate on `sdk.isInMiniApp()` — after
// 2026-04-09 the Base App is a standard WebView and that check silently misleads.
export type Shell = "native" | "base-app" | "web";

export interface EnvironmentSignals {
  /** navigator.userAgent on web, or a synthesized string on native (RN sets its own UA). */
  userAgent: string;
  /** Whether an injected EIP-1193 provider (window.ethereum-shaped) is present. Web only. */
  hasInjectedProvider: boolean;
  /** True when running inside apps/mobile (Expo). Set by the native entrypoint. */
  isNativeRuntime: boolean;
}

const BASE_APP_UA_HINTS = [/CoinbaseWallet/i, /Base\//i, /BaseApp/i];

export function detectShell(signals: EnvironmentSignals): Shell {
  if (signals.isNativeRuntime) return "native";
  if (BASE_APP_UA_HINTS.some((re) => re.test(signals.userAgent))) return "base-app";
  return "web";
}

/**
 * Wraps a provider-acquisition promise with a hard timeout. On web, a Base
 * App / injected provider call must never be allowed to hang — Coinbase's
 * `sdk.wallet.getEthereumProvider()` hangs indefinitely with no rejection in
 * some WebView states, so every acquisition path needs an explicit ceiling
 * that falls through to the next candidate (§4.2, §4.3).
 */
export async function withProviderTimeout<T>(
  work: Promise<T>,
  ms = 5000,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Provider acquisition timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([work, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}
