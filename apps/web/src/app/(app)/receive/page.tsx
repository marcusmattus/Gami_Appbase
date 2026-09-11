// Ported from apps/mobile/app/receive.tsx. expo-clipboard (a native Expo
// module with no meaning outside an Expo app) swapped for the browser's own
// navigator.clipboard API. react-native-qrcode-styled is kept as-is — it's a
// pure react-native-svg-based component, so it should render through the
// same react-native-web pipeline everything else here does; verified via a
// real `next build`, see MIGRATION_NOTES.md if that ever stops being true.
"use client";

import { useState } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useRouter } from "next/navigation";
import QRCodeStyled from "react-native-qrcode-styled";
import { ArcadeText, ArcadeScreen, ArcadeButton, color, surface } from "@gami/ui";
import { useBaseAccountWallet } from "@gami/identity/web";

export default function Receive() {
  const router = useRouter();
  const wallet = useBaseAccountWallet();
  const [copied, setCopied] = useState(false);
  const address = wallet.address ?? "0x0000000000000000000000000000000000000000";

  const copy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <ArcadeScreen edges={["top"]} style={{ alignItems: "center" }}>
      <Pressable onPress={() => router.push("/home")} style={{ alignSelf: "flex-start", marginTop: 12 }}>
        <ArcadeText variant="display" size={22}>
          ◂ RECEIVE
        </ArcadeText>
      </Pressable>

      <View style={styles.qrFrame}>
        <QRCodeStyled data={address} style={{ backgroundColor: "#FFFFFF" }} padding={12} pieceSize={6} color={color.bg} />
      </View>

      {!wallet.address && (
        <ArcadeText variant="mono" size={9} color="rgba(255,255,255,0.35)" style={{ letterSpacing: 1 }}>
          PLACEHOLDER ADDRESS — CONNECT YOUR WALLET FOR THE REAL ONE
        </ArcadeText>
      )}

      <View style={styles.addressCard}>
        <ArcadeText variant="mono" size={17} color="#9C6CFF" style={{ fontWeight: "700" }}>
          noxx_.gami
        </ArcadeText>
        <ArcadeText variant="mono" size={11} color="rgba(255,255,255,0.5)" style={{ textAlign: "center" }}>
          {address}
        </ArcadeText>
        <ArcadeButton label={copied ? "COPIED ✓" : "COPY ADDRESS"} onPress={copy} />
      </View>

      <ArcadeText variant="mono" size={9} color="rgba(255,255,255,0.3)" style={styles.footnote}>
        SEND ONLY BASE AND ETHEREUM ASSETS TO THIS ADDRESS.
      </ArcadeText>
    </ArcadeScreen>
  );
}

const styles = StyleSheet.create({
  qrFrame: { backgroundColor: "#FFFFFF", borderWidth: 2, borderColor: "#000000", padding: 16, marginTop: 24 },
  addressCard: { width: "100%", maxWidth: 360, backgroundColor: surface.card, borderWidth: 2, borderColor: "#000000", padding: 16, gap: 11, alignItems: "center", marginTop: 18 },
  footnote: { textAlign: "center", letterSpacing: 1, lineHeight: 15, marginTop: 16 },
});
