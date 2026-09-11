// Loading-state placeholder block. Design source (GamiScreen.dc.html) pulses
// skeletons via a CSS `gami-skel` keyframe (opacity .35 -> .7 -> .35, 1.4s
// ease-in-out, staggered per block) — reimplemented here with RN's Animated
// API since there's no CSS keyframe equivalent. Flat rectangle, zero radius,
// matches §2.2 (no shimmer/gradient sweep — that would be a soft effect).
import { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";
import type { ViewStyle } from "react-native";
import { surface, radius } from "./tokens.js";

export interface ArcadeSkeletonProps {
  height: number;
  width?: number | `${number}%`;
  /** Stagger the pulse start, in ms — matches the design's per-block offsets (0, .1s, .2s, ...). */
  delay?: number;
  style?: ViewStyle;
}

export function ArcadeSkeleton({ height, width = "100%", delay = 0, style }: ArcadeSkeletonProps) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 700, delay, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, delay]);

  return <Animated.View style={[styles.base, { height, width, opacity }, style]} />;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: surface.card,
    borderWidth: 2,
    borderColor: "#000000",
    borderRadius: radius,
  },
});
