// Design's toggle is a 52x30 square switch — square knob, square track, no
// rounded pill (§2.2: zero radius, no exceptions, including form controls).
import { Pressable, View, StyleSheet } from "react-native";
import { color, radius } from "./tokens.js";

export interface ArcadeToggleProps {
  value: boolean;
  onChange: (next: boolean) => void;
  accessibilityLabel: string;
}

export function ArcadeToggle({ value, onChange, accessibilityLabel }: ArcadeToggleProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
      onPress={() => onChange(!value)}
      style={[
        styles.track,
        { backgroundColor: value ? color.success : color.bg, justifyContent: value ? "flex-end" : "flex-start" },
      ]}
    >
      <View style={[styles.knob, { backgroundColor: value ? "#000000" : "rgba(255,255,255,0.4)" }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 52,
    height: 30,
    borderWidth: 2,
    borderColor: "#000000",
    borderRadius: radius,
    padding: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  knob: { width: 22, height: 22, borderRadius: radius },
});
