// Design source: `isOtp` block (§7). Wires the real email-OTP flow via
// packages/identity's useGamiEmailLogin (sendCode / loginWithCode) — this
// screen is where a real code gets sent and verified, not a mock timer.
//
// `email` comes from the previous screen (onboarding/start.tsx) as a router
// param — that input was the one real gap flagged in MIGRATION_NOTES.md
// ("email isn't wired... deferred"); now closed.
import { useEffect, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArcadeText, ArcadeScreen, ArcadeButton, ArcadeCard, color } from "@gami/ui";
import { useGamiEmailLogin } from "@gami/identity/mobile";

const CODE_LENGTH = 6;

export default function Otp() {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const { sendCode, loginWithCode, state } = useGamiEmailLogin();
  const [email] = useState<string | null>(emailParam ?? null);
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const sentRef = useRef(false);

  useEffect(() => {
    if (!email) {
      // Reaching this screen without an email param means the user
      // navigated here directly (e.g. deep link) rather than through
      // start.tsx's email-collection flow — bounce back rather than show a
      // permanently non-functional code screen.
      router.replace("/onboarding/start");
      return;
    }
    if (sentRef.current) return;
    sentRef.current = true;
    sendCode({ email }).catch(() => setError(true));
  }, [email, sendCode, router]);

  const submit = async (fullCode: string) => {
    if (!email) return;
    try {
      setError(false);
      await loginWithCode({ code: fullCode, email });
      router.push("/onboarding/creating");
    } catch {
      setError(true);
      setCode("");
    }
  };

  const onDigit = (digits: string) => {
    setCode(digits);
    if (digits.length === CODE_LENGTH) void submit(digits);
  };

  return (
    <ArcadeScreen>
      <ArcadeButton label="◂ BACK" variant="ghost" onPress={() => router.back()} containerStyle={{ alignSelf: "flex-start" }} />
      <ArcadeText variant="display" size={28} style={styles.title}>
        Check your{"\n"}inbox.
      </ArcadeText>
      <ArcadeText variant="body" color="rgba(255,255,255,0.6)">
        Six-digit code sent to <ArcadeText variant="mono" size={13} color="#9C6CFF">{email ?? "your email"}</ArcadeText>
      </ArcadeText>

      <View style={styles.boxRow}>
        {Array.from({ length: CODE_LENGTH }, (_, i) => (
          <ArcadeCard key={i} style={styles.box} shadowColor="transparent">
            <ArcadeText variant="mono" size={24}>
              {code[i] ?? ""}
            </ArcadeText>
          </ArcadeCard>
        ))}
      </View>

      {error && (
        <View style={styles.errorBar}>
          <ArcadeText variant="mono" size={11} color={color.danger} style={{ letterSpacing: 1 }}>
            CODE INCORRECT — TRY AGAIN
          </ArcadeText>
        </View>
      )}

      <View style={{ flex: 1 }} />
      <ArcadeText variant="mono" size={9} color="rgba(255,255,255,0.3)" style={styles.footnote}>
        AUTO-ADVANCE · AUTO-SUBMIT ON LAST DIGIT · WRONG CODE CLEARS DIGITS, KEEPS THIS SCREEN
      </ArcadeText>
    </ArcadeScreen>
  );
}

const styles = StyleSheet.create({
  title: { textTransform: "uppercase", lineHeight: 30, marginTop: 12, marginBottom: 4 },
  boxRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  box: { flex: 1, aspectRatio: 0.78, alignItems: "center", justifyContent: "center" },
  errorBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,68,68,0.1)",
    borderWidth: 2,
    borderColor: "#FF4444",
    padding: 11,
  },
  footnote: { letterSpacing: 1, lineHeight: 15 },
});
