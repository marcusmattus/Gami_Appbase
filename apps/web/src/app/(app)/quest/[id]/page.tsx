// Ported from apps/mobile/app/quest/[id].tsx. useLocalSearchParams (expo-router)
// swapped for useParams (next/navigation).
"use client";

import { useParams, useRouter } from "next/navigation";
import { View, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import { ArcadeText, ArcadeScreen, ArcadeButton, ArcadeCard, ArcadeChip, color, surface } from "@gami/ui";

const CHECKLIST = [
  { label: "Create your wallet", xp: 50, done: true },
  { label: "Claim your .gami name", xp: 50, done: true },
  { label: "Meet NOVA", xp: 50, done: true },
  { label: "Turn on Face ID lock", xp: 50, done: false, cta: true },
  { label: "Pick your interests", xp: 50, done: false, locked: true },
];

export default function QuestDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const doneCount = CHECKLIST.filter((c) => c.done).length;

  return (
    <ArcadeScreen edges={["top"]}>
      <View style={styles.header}>
        <ArcadeButton label="◂ QUESTS" variant="ghost" onPress={() => router.push("/quests")} />
        <View style={{ flex: 1 }} />
        <View style={styles.tutorialBadge}>
          <ArcadeText variant="mono" size={9} color="#F5C518" style={{ fontWeight: "700" }}>
            ⚡ TUTORIAL QUEST
          </ArcadeText>
        </View>
      </View>

      <ArcadeCard shadowColor={color.primary} shadowSize={6} style={styles.hero}>
        <ArcadeText variant="mono" size={9} color="#9C6CFF" style={{ fontWeight: "700" }}>
          {(id ?? "QUEST_001").toString().toUpperCase()}
        </ArcadeText>
        <ArcadeText variant="body" size={24} style={{ fontWeight: "600" }}>
          First Steps
        </ArcadeText>
        <ArcadeText variant="body" size={14} color="rgba(255,255,255,0.65)">
          The rest of your setup, at your pace. Each step pays XP the moment it lands.
        </ArcadeText>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <ArcadeChip label="⚡ +250 XP" color={color.success} />
          <ArcadeChip label="🏆 BADGE" color="#F5C518" />
        </View>
      </ArcadeCard>

      <View style={styles.sectionHeader}>
        <ArcadeText variant="mono" size={10} color="rgba(255,255,255,0.5)" style={{ fontWeight: "700", letterSpacing: 2 }}>
          CHECKLIST {doneCount} / {CHECKLIST.length}
        </ArcadeText>
        <View style={styles.rule} />
      </View>

      <View style={{ gap: 9 }}>
        {CHECKLIST.map((item) => (
          <View
            key={item.label}
            style={[
              styles.item,
              { borderLeftWidth: item.done ? 4 : 0, borderLeftColor: color.success, opacity: item.locked ? 0.45 : 1 },
              !item.done && !item.locked && { backgroundColor: "#1A1A22", borderWidth: 2, borderColor: color.primary },
            ]}
          >
            {item.done ? (
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color.success} strokeWidth={3}>
                <Path d="m4 13 5 5L20 6" />
              </Svg>
            ) : (
              <View style={styles.stepNum}>
                <ArcadeText variant="mono" size={11} color="#FFFFFF" style={{ fontWeight: "700" }}>
                  {CHECKLIST.indexOf(item) + 1}
                </ArcadeText>
              </View>
            )}
            <ArcadeText
              variant="body"
              size={14}
              style={{ flex: 1, textDecorationLine: item.done ? "line-through" : "none" }}
              color={item.done ? "rgba(255,255,255,0.45)" : "#FFFFFF"}
            >
              {item.label}
            </ArcadeText>
            {item.cta ? (
              <ArcadeButton label="DO IT" onPress={() => router.push("/settings")} />
            ) : item.done ? (
              <ArcadeText variant="mono" size={10} color={color.success} style={{ fontWeight: "700" }}>
                +{item.xp}
              </ArcadeText>
            ) : (
              <ArcadeText variant="mono" size={10} color="rgba(255,255,255,0.5)" style={{ fontWeight: "700" }}>
                LOCKED
              </ArcadeText>
            )}
          </View>
        ))}
      </View>

      <View style={{ height: 16 }} />
      <ArcadeButton label="CONTINUE QUEST" onPress={() => router.push("/scan")} />
    </ArcadeScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", marginTop: 12, marginBottom: 4 },
  tutorialBadge: { borderWidth: 2, borderColor: "#F5C518", paddingVertical: 4, paddingHorizontal: 8 },
  hero: { padding: 18, gap: 12, marginVertical: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "baseline", gap: 8, marginBottom: 9 },
  rule: { flex: 1, height: 2, backgroundColor: surface.cardAlt },
  item: { flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: surface.card, padding: 13 },
  stepNum: { width: 22, height: 22, backgroundColor: color.primary, alignItems: "center", justifyContent: "center" },
});
