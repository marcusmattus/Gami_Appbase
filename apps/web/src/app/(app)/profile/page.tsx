// Ported from apps/mobile/app/(tabs)/profile.tsx.
"use client";

import { View, Pressable, StyleSheet } from "react-native";
import { useRouter } from "next/navigation";
import Svg, { Path } from "react-native-svg";
import { ArcadeText, ArcadeScreen, color, surface } from "@gami/ui";
import { useBaseAccountWallet } from "@gami/identity/web";
import { truncateAddress, formatTokenAmount } from "@gami/core";
import { mockUser } from "../../../mockData";

const MENU: Array<{ label: string; route?: string; trailing?: string; badge?: string }> = [
  { label: "Security & backup", route: "/settings", badge: "NEW" },
  { label: "Connected wallets", route: "/settings", trailing: "1" },
  { label: "Notifications", route: "/settings", trailing: "ON" },
  { label: "NOVA settings", route: "/nova" },
  { label: "Help & support" },
];

export default function Profile() {
  const router = useRouter();
  const wallet = useBaseAccountWallet();
  const address = wallet.address ? truncateAddress(wallet.address) : mockUser.gamiName;

  return (
    <ArcadeScreen edges={["top"]} style={{ paddingHorizontal: 0 }}>
      <View style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={styles.avatar}>
            <ArcadeText variant="mono" size={20} style={{ fontWeight: "700" }}>
              {mockUser.avatarInitials}
            </ArcadeText>
          </View>
          <View style={{ gap: 5 }}>
            <ArcadeText variant="display" size={24}>
              @{mockUser.handle}
            </ArcadeText>
            <Pressable>
              <ArcadeText variant="mono" size={11} color="rgba(255,255,255,0.75)">
                {mockUser.gamiName} · {address} ⧉
              </ArcadeText>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.statGrid}>
          <Stat label="LEVEL" value={String(mockUser.level)} />
          <Stat label="BALANCE" value={formatTokenAmount(BigInt(Math.round(Number(mockUser.balanceEth) * 1e18)), 18, 2)} sub="+0.5 TODAY" subColor={color.success} />
          <Stat label="RANK" value={`#${mockUser.rank}`} sub={`OF ${(mockUser.rankOf / 1000).toFixed(1)}K`} />
        </View>

        <View style={styles.menuCard}>
          {MENU.map((item, i) => (
            <Pressable
              key={item.label}
              onPress={() => item.route && router.push(item.route)}
              style={[styles.menuRow, i < MENU.length - 1 && styles.menuDivider]}
            >
              <ArcadeText variant="body" size={14} color="#FFFFFF" style={{ flex: 1 }}>
                {item.label}
              </ArcadeText>
              {item.badge && (
                <View style={styles.newBadge}>
                  <ArcadeText variant="mono" size={8} color="#000000" style={{ fontWeight: "700" }}>
                    {item.badge}
                  </ArcadeText>
                </View>
              )}
              {item.trailing && (
                <ArcadeText variant="mono" size={11} color={item.trailing === "ON" ? color.success : "rgba(255,255,255,0.5)"}>
                  {item.trailing}
                </ArcadeText>
              )}
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={2.5}>
                <Path d="m9 5 7 7-7 7" />
              </Svg>
            </Pressable>
          ))}
        </View>
      </View>
    </ArcadeScreen>
  );
}

function Stat({ label, value, sub, subColor }: { label: string; value: string; sub?: string; subColor?: string }) {
  return (
    <View style={styles.statCard}>
      <ArcadeText variant="mono" size={8} color="rgba(255,255,255,0.45)" style={{ letterSpacing: 2 }}>
        {label}
      </ArcadeText>
      <ArcadeText variant="mono" size={24} style={{ fontWeight: "700" }}>
        {value}
      </ArcadeText>
      {sub && (
        <ArcadeText variant="mono" size={9} color={subColor ?? "rgba(255,255,255,0.45)"} style={{ fontWeight: "700" }}>
          {sub}
        </ArcadeText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: color.primary, paddingTop: 40, paddingHorizontal: 16, paddingBottom: 22, borderBottomWidth: 2, borderBottomColor: "#000000" },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 13 },
  avatar: { width: 60, height: 60, backgroundColor: "#9C6CFF", borderWidth: 2, borderColor: "#000000", alignItems: "center", justifyContent: "center" },
  body: { padding: 16, gap: 15 },
  statGrid: { flexDirection: "row", gap: 9 },
  statCard: { flex: 1, backgroundColor: surface.card, borderWidth: 2, borderColor: "#000000", padding: 12, gap: 7, minHeight: 84 },
  menuCard: { backgroundColor: surface.card, borderWidth: 2, borderColor: "#000000" },
  menuRow: { flexDirection: "row", alignItems: "center", gap: 11, padding: 15 },
  menuDivider: { borderBottomWidth: 1, borderBottomColor: surface.divider },
  newBadge: { backgroundColor: color.success, paddingVertical: 2, paddingHorizontal: 6 },
});
