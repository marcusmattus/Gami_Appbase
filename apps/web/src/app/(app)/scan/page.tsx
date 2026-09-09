// DELIBERATE STUB, not a hidden gap: apps/mobile/app/scan.tsx is a camera-based
// QR scanner (expo-camera), which has no direct web equivalent — a browser
// getUserMedia QR reader is a real feature in its own right, out of scope for
// this pass. This is a manual quest-code entry fallback instead, keeping the
// same underlying idempotency guarantee mobile's scan screen demonstrates:
// computing questIdempotencyKey and refusing to "settle" a second grant
// locally (real enforcement is server-side dedup on that key — see
// packages/api/src/client.ts's claimQuest and MIGRATION_NOTES.md).
"use client";

import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "next/navigation";
import { ArcadeText, ArcadeScreen, ArcadeButton, ArcadeCard, ArcadeInput, color } from "@gami/ui";
import { questIdempotencyKey } from "@gami/core";
import { useBaseAccountWallet } from "@gami/identity/web";

type Phase = "target" | "verifying" | "done";

export default function Scan() {
  const router = useRouter();
  const wallet = useBaseAccountWallet();
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<Phase>("target");
  const [toast, setToast] = useState<string | null>(null);

  const runVerify = () => {
    if (phase === "verifying") return;
    if (phase === "done") {
      setToast("ALREADY SETTLED — NO SECOND GRANT");
      setTimeout(() => setToast(null), 2200);
      return;
    }
    setPhase("verifying");
    const key = questIdempotencyKey(code || "quest_scan_neocity", "nonce-demo", wallet.address ?? "0x0");
    void key; // TODO(backend): wire into a real claimQuest() call once the Gami backend exists.
    setTimeout(() => setPhase("done"), 1200);
  };

  return (
    <ArcadeScreen edges={["top"]}>
      <ArcadeButton label="◂ SCAN" variant="ghost" onPress={() => router.push("/home")} containerStyle={{ alignSelf: "flex-start", marginTop: 12 }} />

      <ArcadeText variant="mono" size={9} color="rgba(255,255,255,0.4)" style={{ letterSpacing: 1, marginTop: 14, marginBottom: 4 }}>
        NO CAMERA ON WEB — ENTER THE QUEST CODE PRINTED AT THE NODE INSTEAD
      </ArcadeText>

      {phase !== "done" ? (
        <ArcadeCard shadowColor={color.primary} shadowSize={6} style={{ padding: 16, gap: 14, marginTop: 10 }}>
          <ArcadeInput
            value={code}
            onChangeText={setCode}
            placeholder="e.g. NEOCITY-412"
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <ArcadeButton
            label={phase === "verifying" ? "VERIFYING…" : "EXECUTE AGENT VERIFICATION"}
            disabled={phase === "verifying"}
            onPress={runVerify}
          />
        </ArcadeCard>
      ) : (
        <ArcadeCard shadowColor="#000000" shadowSize={6} background={color.primary} style={{ padding: 22, alignItems: "center", gap: 12, marginTop: 10 }}>
          <ArcadeText variant="display" size={22}>
            Node verified
          </ArcadeText>
          <ArcadeText variant="mono" size={20} color={color.success} style={{ fontWeight: "700" }}>
            +250 XP
          </ArcadeText>
          <ArcadeText variant="mono" size={9} color="rgba(255,255,255,0.7)" style={{ textAlign: "center", lineHeight: 15 }}>
            SETTLED ONCE — VERIFYING AGAIN RETURNS THIS GRANT, NOT A NEW ONE
          </ArcadeText>
          <ArcadeButton label="BACK TO HOME" onPress={() => router.push("/home")} />
        </ArcadeCard>
      )}

      {toast && (
        <View style={styles.toast}>
          <ArcadeText variant="mono" size={11} color="#000000" style={{ fontWeight: "700" }}>
            {toast}
          </ArcadeText>
        </View>
      )}
    </ArcadeScreen>
  );
}

const styles = StyleSheet.create({
  toast: { position: "absolute", left: 16, right: 16, bottom: 24, backgroundColor: color.success, borderWidth: 2, borderColor: "#000000", padding: 12 },
});
