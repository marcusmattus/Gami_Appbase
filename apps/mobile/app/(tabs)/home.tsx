// Design source: `isHome` block (§7 screen 6). Gradient hero card in the
// design (linear-gradient(135deg,#6E3CFB,#4B24B8,...)) is flattened to solid
// color.primary — §2.2 forbids gradients. Decorative blurred glow dropped
// for the same reason. XP green uses the LOCKED color.success (#00E5A0),
// not the design's #00F5A0 — see MIGRATION_NOTES.md conflict log.
//
// States (design's `homeLoading`/`homeReady`/`homeEmpty`/`offline` variants,
// §7's states table): loading is a real (if brief) fetch-simulating delay,
// matching the "honest stub" pattern already used in onboarding/creating.tsx
// — there's no backend yet for this to actually await. Empty is genuinely
// data-driven (no in-progress quest), not a hardcoded dead branch — it just
// never triggers today because mockData.ts always has one. Offline is
// presentational only: no real connectivity detection is wired here (see
// MIGRATION_NOTES.md) — `offline` starts false and nothing flips it yet.
import { useEffect, useState } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { ArcadeText, ArcadeScreen, ArcadeCard, ArcadeChip, ArcadeProgressBar, ArcadeButton, ArcadeSkeleton, OfflineBanner, color, surface } from "@gami/ui";
import { usePrivyWallet } from "@gami/identity/mobile";
import { truncateAddress } from "@gami/core";
import { mockUser, mockQuests } from "../../src/mockData";

const ACTIONS: Array<{ id: string; label: string; icon: string; iconColor: string; route: string }> = [
  { id: "send", label: "SEND", icon: "M12 19V5M5 12l7-7 7 7", iconColor: color.success, route: "/send" },
  { id: "receive", label: "RECEIVE", icon: "M12 5v14M5 12l7 7 7-7", iconColor: "#9C6CFF", route: "/receive" },
  { id: "quests", label: "QUESTS", icon: "M4.5 16.5 3 21l4.5-1.5M14 3l7 7-9 9-7-7z", iconColor: "#F5C518", route: "/(tabs)/quests" },
  { id: "profile", label: "STASH", icon: "M12 2 4 7v10l8 5 8-5V7z", iconColor: "#3B82F6", route: "/(tabs)/profile" },
];

export default function Home() {
  const router = useRouter();
  const wallet = usePrivyWallet();
  const [loading, setLoading] = useState(true);
  const [offline] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  const activeQuests = mockQuests.filter((q) => q.state === "in_progress");

  return (
    <ArcadeScreen edges={["top"]}>
      {offline && <OfflineBanner />}

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

      {loading ? (
        <HomeLoading />
      ) : (
        <>
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
              <Pressable key={a.id} style={styles.actionTile} onPress={() => router.push(a.route as never)}>
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
          {activeQuests.length === 0 ? (
            <HomeEmpty onAskNova={() => router.push("/(tabs)/nova" as never)} />
          ) : (
            activeQuests.map((q) => (
              <Pressable key={q.id} onPress={() => router.push(`/quest/${q.id}` as never)}>
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
            ))
          )}
        </>
      )}
    </ArcadeScreen>
  );
}

function HomeLoading() {
  return (
    <View style={{ gap: 14 }}>
      <ArcadeSkeleton height={190} />
      <View style={{ flexDirection: "row", gap: 9 }}>
        <ArcadeSkeleton height={74} style={{ flex: 1 }} delay={100} />
        <ArcadeSkeleton height={74} style={{ flex: 1 }} delay={200} />
        <ArcadeSkeleton height={74} style={{ flex: 1 }} delay={300} />
        <ArcadeSkeleton height={74} style={{ flex: 1 }} delay={400} />
      </View>
      <ArcadeSkeleton height={12} width={120} />
      <ArcadeSkeleton height={86} delay={500} />
      <ArcadeSkeleton height={86} delay={600} />
    </View>
  );
}

function HomeEmpty({ onAskNova }: { onAskNova: () => void }) {
  return (
    <View style={styles.emptyBox}>
      <Svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.8}>
        <Path d="M4.5 16.5 3 21l4.5-1.5M14 3l7 7-9 9-7-7z" />
      </Svg>
      <ArcadeText variant="display" size={18}>
        NOTHING ACTIVE
      </ArcadeText>
      <ArcadeText variant="body" size={13} color="rgba(255,255,255,0.55)" style={{ textAlign: "center", maxWidth: 230 }}>
        Ask NOVA to find you something worth doing.
      </ArcadeText>
      <ArcadeButton label="ASK NOVA" onPress={onAskNova} />
    </View>
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
  emptyBox: { borderWidth: 2, borderStyle: "dashed", borderColor: "rgba(255,255,255,0.2)", paddingVertical: 32, paddingHorizontal: 20, alignItems: "center", gap: 14, marginTop: 8 },
});
