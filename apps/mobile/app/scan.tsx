// Design source: `isScan` block (§7 screen 9). This is the concrete
// scan-twice-pays-once example from §6.1: pressing EXECUTE a second time
// after settlement must NOT replay the grant. The real enforcement is
// server-side (the backend dedupes on Idempotency-Key) — this screen
// computes the same key via questIdempotencyKey and would send it as the
// `Idempotency-Key` header (see packages/api/src/client.ts's claimQuest),
// but there's no live Gami backend to call yet, so the second-press guard
// here is also enforced locally as defense in depth. See MIGRATION_NOTES.md.
import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { ArcadeText, ArcadeScreen, ArcadeButton, ArcadeCard, color, surface } from "@gami/ui";
import { questIdempotencyKey } from "@gami/core";
import { usePrivyWallet } from "@gami/identity/mobile";

type Phase = "target" | "verifying" | "done";

const STEPS = ["LOCATION VERIFIED", "PROOF SIGNED", "IDEMPOTENCY CHECK"];

export default function Scan() {
  const router = useRouter();
  const wallet = usePrivyWallet();
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
    // Real key the backend would dedupe on — computed the same way
    // packages/api/src/client.ts does before a live POST.
    const key = questIdempotencyKey("quest_scan_neocity", "nonce-demo", wallet.address ?? "0x0");
    void key; // TODO(backend): wire into a real claimQuest() call once the Gami backend exists.
    setTimeout(() => setPhase("done"), 1500);
  };

  return (
    <ArcadeScreen scroll={false} edges={["top"]} style={{ paddingHorizontal: 0, backgroundColor: "#08080B" }}>
      <View style={styles.header}>
        <ArcadeText variant="display" size={20}>
          SCAN
        </ArcadeText>
        <View style={{ flex: 1 }} />
        <View style={styles.liveDot} />
        <ArcadeText variant="mono" size={9} color={color.success} style={{ fontWeight: "700" }}>
          OPTICAL HUD LIVE
        </ArcadeText>
      </View>

      <View style={styles.viewfinder}>
        <View style={styles.reticle}>
          {(["tl", "tr", "bl", "br"] as const).map((corner) => (
            <View key={corner} style={[styles.corner, cornerStyle(corner)]} />
          ))}
        </View>
      </View>

      <View style={styles.body}>
        <ArcadeText variant="display" size={24} style={{ marginBottom: 12 }}>
          {phase === "done" ? "Reward settled." : phase === "verifying" ? "Verifying…" : "Locking target node..."}
        </ArcadeText>

        {phase !== "done" && (
          <ArcadeCard shadowColor={color.primary} shadowSize={6} style={{ padding: 15, gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
              <View style={styles.smallDot} />
              <ArcadeText variant="mono" size={9} color={color.success} style={{ fontWeight: "700" }}>
                TARGET VERIFIED · 0.2 MI
              </ArcadeText>
            </View>
            <ArcadeText variant="body" size={18} style={{ fontWeight: "600" }}>
              NeoCity Cyber Cafe{"\n"}
              <ArcadeText variant="mono" size={13} color="rgba(255,255,255,0.5)">
                NODE #412
              </ArcadeText>
            </ArcadeText>
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <View style={styles.xpChip}>
                <ArcadeText variant="mono" size={11} color={color.success} style={{ fontWeight: "700" }}>
                  ⚡ +250 XP
                </ArcadeText>
              </View>
              {/* Design source also showed a dashed "50 $GAMI · FLAG OFF" chip
                  here. Deliberately not ported: §10's bundle-scan gate greps
                  the built JS output for the literal string "$GAMI", and a
                  runtime `if (FLAGS.GAMI_TOKEN_MODULE)` guard would NOT
                  prevent that string from surviving minification (Metro
                  doesn't cross-module constant-fold like a DefinePlugin
                  would) — so the only build-safe option while the flag is
                  locked off is to omit the string from source entirely. See
                  MIGRATION_NOTES.md. */}
            </View>
            <View style={{ gap: 7 }}>
              {STEPS.map((label, i) => {
                let status: "ok" | "work" | "wait" = "wait";
                if (phase === "verifying") status = i === 0 ? "ok" : i === 1 ? "work" : "wait";
                const col = status === "ok" ? color.success : status === "work" ? "#9C6CFF" : "rgba(255,255,255,0.35)";
                return (
                  <View key={label} style={[styles.stepRow, { borderLeftColor: col, opacity: status === "wait" ? 0.55 : 1 }]}>
                    <View style={[styles.stepDot, { backgroundColor: col }]} />
                    <ArcadeText variant="mono" size={10} style={{ flex: 1, fontWeight: "700" }}>
                      {label}
                    </ArcadeText>
                    <ArcadeText variant="mono" size={9} color={col}>
                      {status === "ok" ? "PASS" : status === "work" ? "WORKING" : "PENDING"}
                    </ArcadeText>
                  </View>
                );
              })}
            </View>
            <ArcadeButton label={phase === "verifying" ? "VERIFYING…" : "EXECUTE AGENT VERIFICATION"} disabled={phase === "verifying"} onPress={runVerify} />
          </ArcadeCard>
        )}

        {phase === "done" && (
          <ArcadeCard shadowColor="#000000" shadowSize={6} background={color.primary} style={{ padding: 22, alignItems: "center", gap: 12 }}>
            <Svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke={color.success} strokeWidth={3}>
              <Circle cx={12} cy={12} r={10} />
              <Path d="m8 12.5 2.5 2.5L16 9.5" />
            </Svg>
            <ArcadeText variant="display" size={22}>
              Node verified
            </ArcadeText>
            <ArcadeText variant="mono" size={20} color={color.success} style={{ fontWeight: "700" }}>
              +250 XP
            </ArcadeText>
            <ArcadeText variant="mono" size={9} color="rgba(255,255,255,0.7)" style={{ textAlign: "center", lineHeight: 15 }}>
              SETTLED ONCE — SCAN AGAIN RETURNS THIS GRANT, NOT A NEW ONE
            </ArcadeText>
            <ArcadeButton label="BACK TO HOME" onPress={() => router.replace("/(tabs)/home")} />
          </ArcadeCard>
        )}
      </View>

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

function cornerStyle(corner: "tl" | "tr" | "bl" | "br") {
  const side = 30;
  const base = { position: "absolute" as const, width: side, height: side, borderColor: "#9C6CFF" };
  if (corner === "tl") return { ...base, left: 0, top: 0, borderLeftWidth: 3, borderTopWidth: 3 };
  if (corner === "tr") return { ...base, right: 0, top: 0, borderRightWidth: 3, borderTopWidth: 3 };
  if (corner === "bl") return { ...base, left: 0, bottom: 0, borderLeftWidth: 3, borderBottomWidth: 3 };
  return { ...base, right: 0, bottom: 0, borderRightWidth: 3, borderBottomWidth: 3 };
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 14, paddingTop: 60, paddingBottom: 10 },
  liveDot: { width: 7, height: 7, backgroundColor: color.success },
  viewfinder: { marginHorizontal: 14, height: 236, backgroundColor: "#101015", borderWidth: 2, borderColor: "#000000", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  reticle: { width: 150, height: 150 },
  corner: {},
  body: { paddingHorizontal: 14, flex: 1 },
  smallDot: { width: 6, height: 6, backgroundColor: color.success },
  xpChip: { backgroundColor: "rgba(0,229,160,0.12)", borderWidth: 2, borderColor: color.success, paddingVertical: 5, paddingHorizontal: 9 },
  gamiChip: { borderWidth: 2, borderColor: "rgba(255,255,255,0.22)", borderStyle: "dashed", paddingVertical: 5, paddingHorizontal: 9 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "#1A1A22", borderWidth: 2, borderColor: "#000000", borderLeftWidth: 4, padding: 11 },
  stepDot: { width: 8, height: 8 },
  toast: { position: "absolute", left: 16, right: 16, bottom: 40, backgroundColor: color.success, borderWidth: 2, borderColor: "#000000", padding: 12 },
});
