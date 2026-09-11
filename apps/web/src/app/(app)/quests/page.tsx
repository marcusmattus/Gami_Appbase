// Ported from apps/mobile/app/(tabs)/quests.tsx.
"use client";

import { View, Pressable, StyleSheet } from "react-native";
import { useRouter } from "next/navigation";
import { ArcadeText, ArcadeScreen, ArcadeCard, ArcadeChip, ArcadeProgressBar, color, surface } from "@gami/ui";
import { formatXp } from "@gami/core";
import { mockQuests, mockWaysToEarn, mockUser } from "../../../mockData";

export default function Quests() {
  const router = useRouter();
  const active = mockQuests.filter((q) => q.state === "in_progress").length;
  const available = mockQuests.filter((q) => q.state === "available").length;

  return (
    <ArcadeScreen edges={["top"]}>
      <View style={styles.header}>
        <ArcadeText variant="display" size={26}>
          QUESTS
        </ArcadeText>
        <View style={{ flex: 1 }} />
        <ArcadeText variant="mono" size={11} color={color.success} style={{ fontWeight: "700" }}>
          {formatXp(mockUser.xp * 7)} XP
        </ArcadeText>
      </View>

      <View style={styles.tabRow}>
        <View style={[styles.tab, { backgroundColor: color.primary }]}>
          <ArcadeText variant="mono" size={10} style={{ fontWeight: "700" }}>
            ACTIVE {active}
          </ArcadeText>
        </View>
        <View style={styles.tab}>
          <ArcadeText variant="mono" size={10} color="rgba(255,255,255,0.5)">
            AVAILABLE {available}
          </ArcadeText>
        </View>
        <View style={styles.tab}>
          <ArcadeText variant="mono" size={10} color="rgba(255,255,255,0.5)">
            DONE 1
          </ArcadeText>
        </View>
      </View>

      {mockQuests.map((q) => (
        <Pressable key={q.id} onPress={() => router.push(`/quest/${q.id}`)}>
          <ArcadeCard shadowColor={color.primary} shadowSize={5} style={styles.questCard}>
            <View style={styles.questTop}>
              <ArcadeText variant="mono" size={9} color="#9C6CFF" style={{ fontWeight: "700" }}>
                {q.id.toUpperCase()}
              </ArcadeText>
            </View>
            <ArcadeText variant="body" size={20} style={{ fontWeight: "600" }}>
              {q.title}
            </ArcadeText>
            <ArcadeText variant="body" size={13} color="rgba(255,255,255,0.6)">
              {q.description}
            </ArcadeText>
            <View style={styles.chipRow}>
              <ArcadeChip label={`⚡ +${q.xpReward} XP`} color={color.success} />
            </View>
            <ArcadeProgressBar progress={q.progress} color={color.primary} height={6} />
          </ArcadeCard>
        </Pressable>
      ))}

      <View style={styles.header}>
        <ArcadeText variant="mono" size={10} color="rgba(255,255,255,0.5)" style={{ fontWeight: "700", letterSpacing: 2 }}>
          WAYS TO EARN
        </ArcadeText>
        <View style={styles.rule} />
      </View>
      <ArcadeCard shadowColor="transparent" style={{ padding: 0 }}>
        {mockWaysToEarn.map((w, i) => (
          <View key={w.label} style={[styles.earnRow, i < mockWaysToEarn.length - 1 && styles.earnDivider]}>
            <ArcadeText variant="body" size={14} color="rgba(255,255,255,0.85)" style={{ flex: 1 }}>
              {w.label}
            </ArcadeText>
            <ArcadeText variant="mono" size={12} color={w.color} style={{ fontWeight: "700" }}>
              {w.value}
            </ArcadeText>
          </View>
        ))}
      </ArcadeCard>
      <ArcadeText variant="mono" size={9} color="rgba(255,255,255,0.3)" style={styles.footnote}>
        VALUES SERVED BY THE REWARD RULES ENGINE — NEVER HARD-CODED IN THE CLIENT.
      </ArcadeText>
    </ArcadeScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "baseline", gap: 10, marginTop: 6, marginBottom: 12 },
  rule: { flex: 1, height: 2, backgroundColor: surface.cardAlt },
  tabRow: { flexDirection: "row", borderWidth: 2, borderColor: "#000000", backgroundColor: surface.card, marginBottom: 15 },
  tab: { flex: 1, paddingVertical: 11, alignItems: "center" },
  questCard: { padding: 16, gap: 11, marginBottom: 12 },
  questTop: { flexDirection: "row" },
  chipRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  earnRow: { flexDirection: "row", alignItems: "center", gap: 11, padding: 14 },
  earnDivider: { borderBottomWidth: 1, borderBottomColor: surface.divider },
  footnote: { letterSpacing: 1, lineHeight: 15, marginTop: 10, marginBottom: 20 },
});
