// Web's sign-in screen. Deliberately NOT a port of apps/mobile's
// onboarding/{welcome,start,otp,creating,handle}.tsx — mobile's auth is
// email-OTP + Google/Apple OAuth + passkey (four methods, a multi-step
// flow), because Privy's embedded wallet needs a login identity first. Web's
// auth model is fundamentally different, not just a different adapter: it's
// wallet-connect + Sign-In-With-Ethereum, ONE action, no embedded wallet, no
// multi-step onboarding. This screen intentionally collapses mobile's whole
// onboarding stack into a single "CONNECT WALLET" / "SIGN IN" button. See
// MIGRATION_NOTES.md for why that's a deliberate simplification, not a gap.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { View, StyleSheet } from "react-native";
import { ArcadeText, ArcadeScreen, ArcadeButton, ArcadeCard, color } from "@gami/ui";
import { useBaseAccountWallet, useGamiSiweLogin } from "@gami/identity/web";
import { truncateAddress } from "@gami/core";

export default function SignInPage() {
  const router = useRouter();
  const wallet = useBaseAccountWallet();
  const { signInWithWallet, state } = useGamiSiweLogin();
  const [error, setError] = useState<string | null>(null);

  const isBusy =
    state.status === "generating-message" || state.status === "awaiting-signature" || state.status === "submitting-signature";

  const handleConnectAndSignIn = async () => {
    setError(null);
    try {
      if (wallet.status !== "connected") {
        await wallet.connect();
      }
      await signInWithWallet(wallet);
      router.push("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    }
  };

  const label = isBusy
    ? state.status === "awaiting-signature"
      ? "AWAITING SIGNATURE…"
      : "SIGNING IN…"
    : wallet.status === "connected"
      ? "SIGN IN WITH ETHEREUM"
      : "CONNECT WALLET";

  return (
    <ArcadeScreen scroll={false} style={styles.center}>
      <View style={styles.markWrap}>
        <View style={styles.tile}>
          <ArcadeText variant="display" size={30} color="#000000">
            G
          </ArcadeText>
        </View>
      </View>
      <ArcadeText variant="display" size={34} style={styles.title}>
        GAMI{"\n"}
        <ArcadeText variant="display" size={34} color={color.primary}>
          WALLET
        </ArcadeText>
      </ArcadeText>
      <ArcadeText variant="body" size={14} color="rgba(255,255,255,0.6)" style={styles.copy}>
        No password. No seed phrase to lose. Connect a wallet and sign a message to prove it&apos;s yours.
      </ArcadeText>

      <ArcadeCard shadowColor="#000000" shadowSize={5} style={styles.card}>
        {wallet.status === "connected" && wallet.address && (
          <ArcadeText variant="mono" size={11} color="rgba(255,255,255,0.5)" style={{ marginBottom: 12 }}>
            CONNECTED · {truncateAddress(wallet.address)}
          </ArcadeText>
        )}
        <ArcadeButton label={label} onPress={handleConnectAndSignIn} disabled={isBusy} />
        {error && (
          <ArcadeText variant="mono" size={10} color={color.danger} style={{ marginTop: 12 }}>
            {error}
          </ArcadeText>
        )}
      </ArcadeCard>

      <ArcadeText variant="mono" size={9} color="rgba(255,255,255,0.3)" style={styles.footnote}>
        BASE ACCOUNT · SIGN-IN WITH ETHEREUM
      </ArcadeText>
    </ArcadeScreen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", gap: 20 },
  markWrap: { alignItems: "center", justifyContent: "center" },
  tile: {
    width: 72,
    height: 72,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { textAlign: "center", textTransform: "uppercase", lineHeight: 32 },
  copy: { textAlign: "center", lineHeight: 20, maxWidth: 360 },
  card: { padding: 20, width: "100%", maxWidth: 360, alignItems: "stretch" },
  footnote: { letterSpacing: 1 },
});
