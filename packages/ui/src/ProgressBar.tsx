import { View, StyleSheet } from "react-native";
import { radius, surface } from "./tokens.js";

export interface ArcadeProgressBarProps {
  progress: number; // 0..1
  color: string;
  height?: number;
}

export function ArcadeProgressBar({ progress, color: fillColor, height = 6 }: ArcadeProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View style={[styles.track, { height }]}>
      <View style={{ width: `${clamped * 100}%`, backgroundColor: fillColor, borderRadius: radius }} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    backgroundColor: surface.cardAlt,
    flexDirection: "row",
    borderRadius: radius,
  },
});
