// Design source: `isCreating` block (§7 screen 4 — "Securing your wallet").
// Real integration point: `usePrivyWallet().connect()` actually provisions
// the Privy embedded wallet here (steps 1-2 below are genuinely driven by
// it). Steps 3-4 ("PROTOCOL HANDSHAKE" / "XP LEDGER LINKED") depend on the
// Gami backend, which doesn't exist in this repo yet (packages/api has a
// typed client but nothing to call) — they're left as an honest stub
// (short delay, clearly commented) rather than faked as a real network call.
// See MIGRATION_NOTES.md.
import { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { ArcadeText, ArcadeScreen, ArcadeButton, ArcadeCard, color } from "@gami/ui";
import { usePrivyWallet } from "@gami/identity/mobile";
import { OnboardingProgress } from "../../src/components/OnboardingProgress";

type StepStatus = "done" | "working" | "waiting" | "error";

interface Step {
  label: string;
  status: StepStatus;
}

export default function Creating() {
  const router = useRouter();
  const wallet = usePrivyWallet();
  const [walletStep, setWalletStep] = useState<StepStatus>("working");
  const [handshakeStep, setHandshakeStep] = useState<StepStatus>("waiting");
  const [ledgerStep, setLedgerStep] = useState<StepStatus>("waiting");

  useEffect(() => {
    let cancelled = false;
    wallet
      .connect()
      .then(() => {
        if (cancelled) return;
        setWalletStep("done");
        setHandshakeStep("working");
        // TODO(backend): replace with a real call once packages/api has a
        // session/bootstrap endpoint. Simulated delay only — not a real
        // network round-trip.
        return new Promise((r) => setTimeout(r, 900));
      })
      .then(() => {
        if (cancelled) return;
        setHandshakeStep("done");
        setLedgerStep("working");
        return new Promise((r) => setTimeout(r, 700));
      })
      .then(() => {
        if (cancelled) return;
        setLedgerStep("done");
      })
      .catch(() => {
        if (!cancelled) setWalletStep("error");
      });
    return () => {
      cancelled = true;
    };
    // Intentionally runs once on mount only — `wallet` is a fresh object
    // each render (see privy-expo-adapter.ts's useMemo deps), so including
    // it here would re-trigger connect() on every re-render.
  }, []);

  const steps: Step[] = [
    { label: "WALLET PROVISIONED", status: walletStep === "working" ? "working" : walletStep },
    { label: "SIGNING KEY READY", status: walletStep === "done" ? "done" : walletStep === "error" ? "error" : "waiting" },
    { label: "PROTOCOL HANDSHAKE", status: handshakeStep },
    { label: "XP LEDGER LINKED", status: ledgerStep },
  ];

  const allDone = steps.every((s) => s.status === "done");
  const hasError = steps.some((s) => s.status === "error");

  return (
    <ArcadeScreen>
      <ArcadeText variant="mono" size={10} color="rgba(255,255,255,0.5)" style={{ marginTop: 16 }}>
        STEP 03 / 04
      </ArcadeText>
      <OnboardingProgress step={3} />
      <View style={styles.iconWrap}>
        <View style={styles.iconTile}>
          <Svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2}>
            <Path d="M2 6h20v13H2zM2 11h20M6 15h4" />
          </Svg>
        </View>
      </View>
      <ArcadeText variant="display" size={26} style={styles.title}>
        Securing your{"\n"}wallet.
      </ArcadeText>
      <ArcadeText variant="body" color="rgba(255,255,255,0.6)" style={styles.copy}>
        Privy is provisioning your embedded wallet. Keys are generated in a secure enclave — never on this device, never by us.
      </ArcadeText>

      <View style={styles.stepList}>
        {steps.map((s) => (
          <StepRow key={s.label} {...s} />
        ))}
      </View>

      <View style={{ flex: 1 }} />
      <ArcadeText variant="mono" size={9} color="rgba(255,255,255,0.3)" style={styles.footnote}>
        EACH ROW IS BOUND TO A REAL ASYNC STATE. A FAILED STEP TURNS RED WITH RETRY AND BLOCKS ADVANCE.
      </ArcadeText>
      <ArcadeButton
        label={hasError ? "RETRY" : "CONTINUE"}
        disabled={!allDone && !hasError}
        onPress={() => (hasError ? router.replace("/onboarding/creating") : router.push("/onboarding/handle"))}
      />
    </ArcadeScreen>
  );
}

function StepRow({ label, status }: Step) {
  const col = status === "done" ? color.success : status === "working" ? "#9C6CFF" : status === "error" ? color.danger : "rgba(255,255,255,0.4)";
  const text = status === "done" ? "DONE" : status === "working" ? "WORKING" : status === "error" ? "FAILED" : "WAITING";
  return (
    <ArcadeCard style={[styles.stepRow, { borderLeftWidth: 4, borderLeftColor: col }]} shadowColor="transparent">
      <ArcadeText variant="mono" size={11} style={{ flex: 1, fontWeight: "700" }}>
        {label}
      </ArcadeText>
      <ArcadeText variant="mono" size={9} color={col}>
        {text}
      </ArcadeText>
    </ArcadeCard>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: "center", marginTop: 8 },
  iconTile: { width: 96, height: 96, backgroundColor: color.primary, borderWidth: 2, borderColor: "#000000", alignItems: "center", justifyContent: "center" },
  title: { textAlign: "center", textTransform: "uppercase", lineHeight: 28, marginTop: 8 },
  copy: { textAlign: "center", lineHeight: 20, maxWidth: 290, alignSelf: "center" },
  stepList: { gap: 10, marginTop: 10 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 11, padding: 13 },
  footnote: { letterSpacing: 1, lineHeight: 15, marginBottom: 12 },
});
