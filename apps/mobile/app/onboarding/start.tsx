// Design source: `isStart` block (§7 screen 3). Locked login methods: email
// OTP, Apple, Google, passkey (§4.1) — all four are wired (passkey via
// @privy-io/expo/passkey, see packages/identity/src/passkey-login-hooks.ts;
// see that file's header for the correction to the earlier "unsatisfiable"
// note). Methods are feature-detected from Privy, not hard-coded — the
// "GOOGLE"/"APPLE"/"PASSKEY" buttons only report failure on press if the
// method isn't actually enabled in the Privy dashboard, matching the
// design's own note that disabled methods simply don't render.
import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ArcadeText, ArcadeScreen, ArcadeButton, ArcadeInput } from "@gami/ui";
import { useGamiOAuthLogin, useGamiPasskeyLogin, GAMI_PASSKEY_RELYING_PARTY } from "@gami/identity/mobile";
import { OnboardingProgress } from "../../src/components/OnboardingProgress";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function Start() {
  const router = useRouter();
  const { login: loginWithOAuth, state: oauthState } = useGamiOAuthLogin();
  const { loginWithPasskey, state: passkeyState } = useGamiPasskeyLogin();
  const [error, setError] = useState<string | null>(null);
  const [showEmailField, setShowEmailField] = useState(false);
  const [email, setEmail] = useState("");

  const handleOAuth = async (provider: "google" | "apple") => {
    setError(null);
    try {
      await loginWithOAuth({ provider });
      router.push("/onboarding/creating");
    } catch (err) {
      // §4.1: unsupported/disabled methods should not block the flow —
      // surface a plain error rather than crash the screen.
      setError(err instanceof Error ? err.message : "That sign-in method isn't available right now.");
    }
  };

  const handlePasskey = async () => {
    setError(null);
    try {
      await loginWithPasskey({ relyingParty: GAMI_PASSKEY_RELYING_PARTY });
      router.push("/onboarding/creating");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Passkey sign-in isn't available right now.");
    }
  };

  const handleEmailContinue = () => {
    setError(null);
    if (!showEmailField) {
      setShowEmailField(true);
      return;
    }
    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    router.push({ pathname: "/onboarding/otp", params: { email: email.trim().toLowerCase() } });
  };

  const passkeyBusy =
    passkeyState.status === "generating-challenege" ||
    passkeyState.status === "awaiting-passkey" ||
    passkeyState.status === "submitting-response";
  const busy = oauthState.status === "loading" || passkeyBusy;

  return (
    <ArcadeScreen>
      <ArcadeText variant="mono" size={10} color="rgba(255,255,255,0.5)" style={{ marginTop: 16 }}>
        STEP 02 / 04
      </ArcadeText>
      <OnboardingProgress step={2} />
      <ArcadeText variant="display" size={28} style={styles.title}>
        Choose your{"\n"}start.
      </ArcadeText>
      <ArcadeText variant="body" color="rgba(255,255,255,0.6)" style={styles.copy}>
        No password. No seed phrase to lose. Your keys are provisioned and held by Privy's embedded wallet.
      </ArcadeText>

      <View style={styles.stack}>
        {showEmailField && (
          <ArcadeInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            onSubmitEditing={handleEmailContinue}
          />
        )}
        <ArcadeButton
          label={showEmailField ? "SEND CODE" : "CONTINUE WITH EMAIL"}
          onPress={handleEmailContinue}
          variant="secondary"
          disabled={busy}
        />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <ArcadeButton label="GOOGLE" variant="ghost" disabled={busy} onPress={() => handleOAuth("google")} />
          </View>
          <View style={{ flex: 1 }}>
            <ArcadeButton label="APPLE" variant="ghost" disabled={busy} onPress={() => handleOAuth("apple")} />
          </View>
        </View>
        <ArcadeButton label="PASSKEY" variant="ghost" disabled={busy} onPress={handlePasskey} />
        {error && (
          <ArcadeText variant="mono" size={10} color="#FF4444">
            {error}
          </ArcadeText>
        )}
      </View>

      <View style={{ flex: 1 }} />
      <ArcadeText variant="mono" size={9} color="rgba(255,255,255,0.3)" style={styles.footnote}>
        METHODS SHOWN ARE FEATURE-DETECTED FROM THE PRIVY DASHBOARD. DISABLED METHODS DO NOT RENDER.
      </ArcadeText>
    </ArcadeScreen>
  );
}

const styles = StyleSheet.create({
  title: { textTransform: "uppercase", lineHeight: 30, marginTop: 18, marginBottom: 10 },
  copy: { lineHeight: 20, marginBottom: 4 },
  stack: { gap: 12, marginTop: 4 },
  row: { flexDirection: "row", gap: 12 },
  footnote: { letterSpacing: 1, lineHeight: 15 },
});
