// Ported from apps/mobile/app/(tabs)/home.tsx — same layout/tokens, wallet
// hook swapped for the web adapter, expo-router calls swapped for
// next/navigation. See that file for the gradient/blur-flattening rationale
// (§2.2) — unchanged here.
"use client";

import { View, Pressable, StyleSheet } from "react-native";
import { useRouter } from "next/navigation";
import Svg, { Path, Circle } from "react-native-svg";
import { ArcadeText, ArcadeScreen, ArcadeCard, ArcadeProgressBar, color, surface } from "@gami/ui";
import { useBaseAccountWallet } from "@gami/identity/web";
import { truncateAddress } from "@gami/core";
import { mockUser, mockQuests } from "../../../mockData";

const ACTIONS: Array<{ id: string; label: string; icon: string; iconColor: string; route: string }> = [
  { id: "send", label: "SEND", icon: "M12 19V5M5 12l7-7 7 7", iconColor: color.success, route: "/send" },
  { id: "receive", label: "RECEIVE", icon: "M12 5v14M5 12l7 7 7-7", iconColor: "#9C6CFF", route: "/receive" },
  { id: "quests", label: "QUESTS", icon: "M4.5 16.5 3 21l4.5-1.5M14 3l7 7-9 9-7-7z", iconColor: "#F5C518", route: "/quests" },
  { id: "profile", label: "STASH", icon: "M12 2 4 7v10l8 5 8-5V7z", iconColor: "#3B82F6", route: "/profile" },
];

export default function Home() {
  const router = useRouter();
  const wallet = useBaseAccountWallet();

  return (
    <ArcadeScreen edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <ArcadeText variant="mono" size={14} style={{ fontWeight: "700" }}>
            {mockUser.avatarInitials}
          </ArcadeText>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <ArcadeText variant="display" size={17} numberOfLines={1}>
            HEY, @{mockUser.handle}
          </ArcadeText>
          <ArcadeText variant="mono" size={10} color="rgba(255,255,255,0.4)">
            {wallet.address ? truncateAddress(wallet.address) : mockUser.gamiName}
          </ArcadeText>
        </View>
        <View style={styles.streak}>
          <ArcadeText variant="mono" size={10} color="#F5C518" style={{ fontWeight: "700" }}>
            🔥 {mockUser.streakDays} DAY
          </ArcadeText>
        </View>
      </View>

      <ArcadeCard shadowColor="#000000" shadowSize={6} background={color.primary} style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={styles.ring}>
            <Svg width={84} height={84} viewBox="0 0 84 84">
              <Circle cx={42} cy={42} r={34} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth={9} />
              <Circle
                cx={42}
                cy={42}
                r={34}
                fill="none"
                stroke={color.success}
                strokeWidth={9}
                strokeDasharray={`${(mockUser.xp / mockUser.xpToNextLevel) * 213.6} 213.6`}
                transform="rotate(-90 42 42)"
              />
            </Svg>
            <View style={StyleSheet.absoluteFill}>
              <View style={styles.ringCenter}>
                <ArcadeText variant="mono" size={9} color="rgba(255,255,255,0.7)">
                  LVL
                </ArcadeText>
                <ArcadeText variant="mono" size={24} style={{ fontWeight: "700" }}>
                  {mockUser.level}
                </ArcadeText>
              </View>
            </View>
          </View>
          <View style={{ flex: 1, gap: 5 }}>
            <ArcadeText variant="display" size={22}>
              WELCOME!
            </ArcadeText>
            <ArcadeText variant="mono" size={12} color={color.success} style={{ fontWeight: "700" }}>
              +250 XP UNLOCKED
            </ArcadeText>
            <ArcadeText variant="mono" size={10} color="rgba(255,255,255,0.7)">
              {mockUser.xp} / {mockUser.xpToNextLevel} XP
            </ArcadeText>
          </View>
        </View>
      </ArcadeCard>

      <View style={styles.actionGrid}>
        {ACTIONS.map((a) => (
          <Pressable key={a.id} style={styles.actionTile} onPress={() => router.push(a.route)}>
            <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={a.iconColor} strokeWidth={2} strokeLinecap="round">
              <Path d={a.icon} />
            </Svg>
            <ArcadeText variant="mono" size={9}>
              {a.label}
            </ArcadeText>
          </Pressable>
        ))}
      </View>

      <SectionHeader label="ACTIVE QUEST" trailing="NOVA PICK ▸" />
      {mockQuests.map((q) => (
        <Pressable key={q.id} onPress={() => router.push(`/quest/${q.id}`)}>
          <ArcadeCard style={styles.questRow}>
            <View style={styles.questIcon}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color.success} strokeWidth={2} strokeLinecap="round">
                <Path d="M7 7h10v10M7 17 17 7" />
              </Svg>
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <ArcadeText variant="body" size={15} style={{ fontWeight: "600" }}>
                {q.title}
              </ArcadeText>
              <ArcadeText variant="mono" size={10} color="rgba(255,255,255,0.5)">
                +{q.xpReward} XP · {Math.round(q.progress * 100)}%
              </ArcadeText>
              <ArcadeProgressBar progress={q.progress} color={color.primary} />
            </View>
          </ArcadeCard>
        </Pressable>
      ))}
    </ArcadeScreen>
  );
}

function SectionHeader({ label, trailing }: { label: string; trailing?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <ArcadeText variant="mono" size={10} color="rgba(255,255,255,0.5)" style={{ fontWeight: "700", letterSpacing: 2 }}>
        {label}
      </ArcadeText>
      <View style={styles.sectionRule} />
      {trailing && (
        <ArcadeText variant="mono" size={10} color="#9C6CFF">
          {trailing}
        </ArcadeText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 16 },
  avatar: { width: 40, height: 40, backgroundColor: color.primary, borderWidth: 2, borderColor: "#000000", alignItems: "center", justifyContent: "center" },
  streak: { backgroundColor: "rgba(245,197,24,0.12)", borderWidth: 2, borderColor: "#F5C518", paddingVertical: 5, paddingHorizontal: 9 },
  hero: { padding: 18, marginBottom: 16 },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  ring: { width: 84, height: 84 },
  ringCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  actionGrid: { flexDirection: "row", gap: 9, marginBottom: 18 },
  actionTile: { flex: 1, backgroundColor: surface.card, borderWidth: 2, borderColor: "#000000", paddingVertical: 12, alignItems: "center", gap: 7, minHeight: 74 },
  sectionHeader: { flexDirection: "row", alignItems: "baseline", gap: 8, marginBottom: 10 },
  sectionRule: { flex: 1, height: 2, backgroundColor: surface.cardAlt },
  questRow: { flexDirection: "row", alignItems: "center", gap: 13, padding: 14, marginBottom: 12 },
  questIcon: { width: 42, height: 42, backgroundColor: "rgba(0,229,160,0.12)", borderWidth: 2, borderColor: color.success, alignItems: "center", justifyContent: "center" },
});
