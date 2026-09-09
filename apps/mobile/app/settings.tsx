// Design source: `isSettings` block (§7 screen 14). §2.3: recovery reads
// "MANAGED BY PRIVY" in success green — no seed-phrase export UI in v1
// (§4.1, §14). Delete Account must stay in-app and permanent (App Review
// requirement, §9.1) — the actual account-deletion backend call doesn't
// exist yet (packages/api has no endpoint); the button is present but
// disabled with that reason surfaced, not silently non-functional.
import { useState } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { ArcadeText, ArcadeScreen, ArcadeToggle, ArcadeButton, color, surface } from "@gami/ui";
import { usePrivyWallet } from "@gami/identity/mobile";
import { truncateAddress } from "@gami/core";

export default function Settings() {
  const router = useRouter();
  const wallet = usePrivyWallet();
  const [faceId, setFaceId] = useState(true);
  const [hideBalances, setHideBalances] = useState(false);
  const [sound, setSound] = useState(true);
  const [haptics, setHaptics] = useState(true);

  return (
    <ArcadeScreen edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <ArcadeText variant="display" size={22}>
            ◂ SETTINGS
          </ArcadeText>
        </Pressable>
        <View style={{ flex: 1 }} />
        <ArcadeText variant="mono" size={10} color="rgba(255,255,255,0.35)">
          V0.1.0
        </ArcadeText>
      </View>

      <SectionLabel label="ACCOUNT" />
      <Group>
        <Row label="Display name" value="@noxx_" trailingLabel="EDIT" />
        <Row label="Email" value="nox@gamiprotocol.xyz" />
        <Row label="Wallet address" value={wallet.address ? truncateAddress(wallet.address) : "0x—"} trailingLabel="COPY" last />
      </Group>

      <SectionLabel label="SECURITY" />
      <Group>
        <ToggleRow label="Face ID lock" value={faceId} onChange={setFaceId} />
        <Row label="Auto-lock" value="1 MINUTE" />
        <View style={styles.row}>
          <ArcadeText variant="body" size={14} style={{ flex: 1 }}>
            Recovery
          </ArcadeText>
          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={color.success} strokeWidth={3}>
            <Path d="m4 13 5 5L20 6" />
          </Svg>
          <ArcadeText variant="mono" size={11} color={color.success}>
            {" "}MANAGED BY PRIVY
          </ArcadeText>
        </View>
        <ToggleRow label="Hide balances" value={hideBalances} onChange={setHideBalances} last />
      </Group>

      <SectionLabel label="GAME" />
      <Group>
        <ToggleRow label="Sound effects" value={sound} onChange={setSound} />
        <ToggleRow label="Haptics" value={haptics} onChange={setHaptics} />
        <Row label="NOVA personality" value="HYPE" />
        <Row label="Daily quest reminder" value="9:00 AM" last />
      </Group>

      <ArcadeButton label="SIGN OUT" variant="ghost" onPress={() => wallet.disconnect()} />
      <View style={{ height: 12 }} />
      <ArcadeButton label="DELETE ACCOUNT" variant="danger" disabled onPress={() => {}} />
      <ArcadeText variant="mono" size={9} color="rgba(255,255,255,0.3)" style={styles.footnote}>
        DELETION IS IN-APP AND PERMANENT — REQUIRED BY APP REVIEW. DISABLED PENDING BACKEND SUPPORT.
      </ArcadeText>
    </ArcadeScreen>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <ArcadeText variant="mono" size={10} color="rgba(255,255,255,0.45)" style={{ fontWeight: "700", letterSpacing: 2, marginTop: 18, marginBottom: 8 }}>
      {label}
    </ArcadeText>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return <View style={{ backgroundColor: surface.card, borderWidth: 2, borderColor: "#000000" }}>{children}</View>;
}

function Row({ label, value, trailingLabel, last }: { label: string; value: string; trailingLabel?: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <ArcadeText variant="body" size={14} style={{ flex: 1 }}>
        {label}
      </ArcadeText>
      <ArcadeText variant="mono" size={12} color="rgba(255,255,255,0.6)">
        {value}
      </ArcadeText>
      {trailingLabel && (
        <ArcadeText variant="mono" size={9} color="#9C6CFF" style={{ fontWeight: "700" }}>
          {" "}{trailingLabel}
        </ArcadeText>
      )}
    </View>
  );
}

function ToggleRow({ label, value, onChange, last }: { label: string; value: boolean; onChange: (v: boolean) => void; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <ArcadeText variant="body" size={14} style={{ flex: 1 }}>
        {label}
      </ArcadeText>
      <ArcadeToggle value={value} onChange={onChange} accessibilityLabel={label} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", marginTop: 16, marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: surface.divider },
  footnote: { textAlign: "center", letterSpacing: 1, lineHeight: 15, marginTop: 10, marginBottom: 20 },
});
