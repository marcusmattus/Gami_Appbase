// SPLASH (§7 screen 1). Design source: GamiScreen.dc.html `isSplash` block.
// Auto-advances to onboarding after a boot delay. Gradient glow + blur behind
// the mark (design lines ~35) is dropped — §2.2 forbids gradients/blur;
// logged in MIGRATION_NOTES.md.
import { useEffect, useRef } from "react";
import { View, Image, Animated, Easing, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ArcadeText, ArcadeScreen, color, surface } from "@gami/ui";

const BOOT_MS = 1200;

export default function Splash() {
  const router = useRouter();
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -6, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();

    const t = setTimeout(() => router.replace("/onboarding/welcome"), BOOT_MS);
    return () => clearTimeout(t);
  }, [bob, router]);

  return (
    <ArcadeScreen scroll={false} style={styles.center}>
      <View style={styles.markWrap}>
        <Animated.View style={[styles.badge, { transform: [{ translateY: bob }] }]}>
          <View style={styles.badgeDot} />
        </Animated.View>
        <View style={styles.tile}>
          <Image source={require("../assets/adaptive-icon.png")} style={styles.tileImg} resizeMode="contain" />
        </View>
      </View>
      <ArcadeText variant="display" size={38} style={styles.title}>
        GAMI{"\n"}
        <ArcadeText variant="display" size={38} color={color.primary}>
          WALLET
        </ArcadeText>
      </ArcadeText>
      <ArcadeText variant="mono" size={11} color="rgba(255,255,255,0.5)" style={styles.tagline}>
        ▶ PLAY · EARN · OWN ◀
      </ArcadeText>
      <View style={styles.bootWrap}>
        <ArcadeText variant="mono" size={10} color="rgba(255,255,255,0.3)">
          V0.1.0 · LOADING
        </ArcadeText>
        <View style={styles.bootTrack}>
          <View style={styles.bootFill} />
        </View>
      </View>
    </ArcadeScreen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", gap: 28 },
  markWrap: { alignItems: "center", justifyContent: "center" },
  badge: {
    position: "absolute",
    left: 44,
    top: -10,
    width: 44,
    height: 44,
    backgroundColor: color.primary,
    borderWidth: 2,
    borderColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeDot: { width: 12, height: 12, backgroundColor: color.bg },
  tile: {
    width: 84,
    height: 84,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  tileImg: { width: "80%", height: "80%" },
  title: { textAlign: "center", textTransform: "uppercase", lineHeight: 36 },
  tagline: { letterSpacing: 4 },
  bootWrap: { alignItems: "center", gap: 10 },
  bootTrack: { width: 180, height: 8, borderWidth: 2, borderColor: "#000000", backgroundColor: surface.card },
  bootFill: { width: "80%", height: "100%", backgroundColor: color.primary },
});
