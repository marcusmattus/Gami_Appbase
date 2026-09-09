// Design source: `isWelcome` block (§7 screen 2). Value-prop grid + CTA.
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Path, Rect } from "react-native-svg";
import { ArcadeText, ArcadeScreen, ArcadeButton, ArcadeCard, color } from "@gami/ui";
import { OnboardingProgress } from "../../src/components/OnboardingProgress";

const FEATURES = [
  { icon: "M13 2 3 14h9l-1 8 10-12h-9z", color: color.success, label: "XP ON EVERY\nACTION" },
  { icon: "M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z", color: "#F5C518", label: "QUESTS +\nREWARDS" },
  { icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", color: color.primary, label: "NON-\nCUSTODIAL" },
  { icon: "M4 8h16v12H4zM12 8V4M9 14h.01M15 14h.01", color: "#9C6CFF", label: "AI AGENT\nINSIDE" },
];

export default function Welcome() {
  const router = useRouter();
  return (
    <ArcadeScreen>
      <View style={styles.header}>
        <View style={styles.badge}>
          <ArcadeText variant="mono" size={10} color="#000000" style={styles.badgeText}>
            NEW PLAYER
          </ArcadeText>
        </View>
        <View style={{ flex: 1 }} />
        <ArcadeText variant="mono" size={10} color="rgba(255,255,255,0.5)">
          STEP 01 / 04
        </ArcadeText>
      </View>
      <OnboardingProgress step={1} />
      <ArcadeText variant="display" size={34} style={styles.title}>
        Your wallet,{"\n"}but make it{"\n"}
        <ArcadeText variant="display" size={34} color={color.primary}>
          fun.
        </ArcadeText>
      </ArcadeText>
      <ArcadeText variant="body" color="rgba(255,255,255,0.7)" style={styles.copy}>
        Earn XP on every action across apps, games and communities. One wallet, one identity, an agent that watches for you.
      </ArcadeText>
      <View style={styles.grid}>
        {FEATURES.map((f) => (
          <ArcadeCard key={f.label} style={styles.tile}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={f.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d={f.icon} />
            </Svg>
            <ArcadeText variant="mono" size={11} style={styles.tileLabel}>
              {f.label}
            </ArcadeText>
          </ArcadeCard>
        ))}
      </View>
      <View style={{ flex: 1 }} />
      <ArcadeButton label="LET'S GO" onPress={() => router.push("/onboarding/start")} />
    </ArcadeScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "baseline", gap: 10, marginBottom: 6, marginTop: 16 },
  badge: { backgroundColor: "#9C6CFF", borderWidth: 2, borderColor: "#000000", paddingVertical: 5, paddingHorizontal: 10 },
  badgeText: { fontWeight: "700" },
  title: { textTransform: "uppercase", lineHeight: 32, marginTop: 18, marginBottom: 4 },
  copy: { lineHeight: 21, marginBottom: 4, maxWidth: 300 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 },
  tile: { width: "47%", minHeight: 104, padding: 14, gap: 10 },
  tileLabel: { fontWeight: "700", letterSpacing: 0.6, lineHeight: 15 },
});
