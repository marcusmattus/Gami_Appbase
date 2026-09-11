// Design source: `isHandle` block (§7 screen 5). Handle-registration API
// doesn't exist yet (packages/api has no endpoint for it) — SKIP and CLAIM
// both just advance to /( tabs)/home for now; wiring real atomic
// server-side registration is a P6 follow-up (§11's open question about
// whether the .gami registry is on/off-chain is still unresolved — see
// MIGRATION_NOTES.md).
import { useState } from "react";
import { View, Pressable, TextInput, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ArcadeText, ArcadeScreen, ArcadeButton, color, surface } from "@gami/ui";
import { OnboardingProgress } from "../../src/components/OnboardingProgress";

const AVATARS = ["NX", "PX", "ZK", "OG", "OX", "GG"];

export default function Handle() {
  const router = useRouter();
  const [avatar, setAvatar] = useState("NX");
  const [handle, setHandle] = useState("");

  const finish = () => router.replace("/(tabs)/home");

  return (
    <ArcadeScreen>
      <View style={styles.header}>
        <ArcadeText variant="mono" size={10} color="rgba(255,255,255,0.5)">
          STEP 04 / 04
        </ArcadeText>
        <View style={{ flex: 1 }} />
        <Pressable onPress={finish}>
          <ArcadeText variant="mono" size={10} color="rgba(255,255,255,0.45)">
            SKIP ▸
          </ArcadeText>
        </Pressable>
      </View>
      <OnboardingProgress step={4} />
      <ArcadeText variant="display" size={28} style={styles.title}>
        Pick your{"\n"}character.
      </ArcadeText>

      <View style={styles.avatarPreview}>
        <ArcadeText variant="mono" size={38} style={{ fontWeight: "700" }}>
          {avatar}
        </ArcadeText>
      </View>
      <View style={styles.avatarRow}>
        {AVATARS.map((a) => (
          <Pressable
            key={a}
            onPress={() => setAvatar(a)}
            style={[styles.avatarTile, { borderColor: avatar === a ? color.primary : "#000000" }]}
          >
            <ArcadeText variant="mono" size={14} style={{ fontWeight: "700" }}>
              {a}
            </ArcadeText>
          </Pressable>
        ))}
      </View>

      <View style={styles.handleWrap}>
        <ArcadeText variant="mono" size={10} color="rgba(255,255,255,0.5)" style={{ letterSpacing: 2 }}>
          CLAIM YOUR HANDLE
        </ArcadeText>
        <View style={styles.inputRow}>
          <ArcadeText variant="mono" size={17} color="rgba(255,255,255,0.4)">
            @
          </ArcadeText>
          <TextInput
            value={handle}
            onChangeText={(t) => setHandle(t.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            placeholder="handle"
            placeholderTextColor="rgba(255,255,255,0.3)"
            style={styles.input}
          />
        </View>
        {handle.length >= 3 && (
          <ArcadeText variant="mono" size={11} color={color.success} style={{ letterSpacing: 1 }}>
            ✓ AVAILABLE · SAVES TO {handle}.gami
          </ArcadeText>
        )}
      </View>

      <View style={{ flex: 1 }} />
      <ArcadeButton label="CLAIM & FINISH" onPress={finish} />
      <ArcadeText variant="mono" size={10} color="rgba(255,255,255,0.35)" style={styles.fallback}>
        SKIPPABLE — FALLS BACK TO YOUR WALLET ADDRESS EVERYWHERE
      </ArcadeText>
    </ArcadeScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", marginTop: 16 },
  title: { textTransform: "uppercase", lineHeight: 28, marginTop: 12 },
  avatarPreview: {
    alignSelf: "center",
    width: 108,
    height: 108,
    backgroundColor: color.primary,
    borderWidth: 2,
    borderColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  avatarRow: { flexDirection: "row", gap: 10, justifyContent: "center", flexWrap: "wrap" },
  avatarTile: { width: 46, height: 46, backgroundColor: color.primary, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  handleWrap: { gap: 8, marginTop: 12 },
  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: surface.card, borderWidth: 2, borderColor: color.primary, paddingHorizontal: 14, minHeight: 52 },
  input: { flex: 1, color: "#FFFFFF", fontFamily: "JetBrainsMono_500Medium", fontSize: 17, paddingVertical: 14, paddingHorizontal: 6 },
  fallback: { textAlign: "center", marginTop: 8 },
});
