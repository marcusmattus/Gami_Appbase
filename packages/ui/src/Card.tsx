// §2.2 card chrome: zero radius, 2px black border, hard offset shadow. No
// gradients — screens that used a gradient hero background in the design
// source get a flat `color.primary` fill instead (see MIGRATION_NOTES.md).
import { View, StyleSheet } from "react-native";
import type { ViewProps } from "react-native";
import { borderWidth, radius, surface } from "./tokens.js";

export interface ArcadeCardProps extends ViewProps {
  /** Shadow color — defaults to solid black. Pass color.primary for the "emphasized" card treatment. */
  shadowColor?: string;
  shadowSize?: number;
  background?: string;
}

export function ArcadeCard({ style, shadowColor = "#000000", shadowSize = 4, background = surface.card, children, ...rest }: ArcadeCardProps) {
  return (
    <View style={styles.wrap}>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: shadowSize,
          left: shadowSize,
          right: -shadowSize,
          bottom: -shadowSize,
          backgroundColor: shadowColor,
        }}
      />
      <View {...rest} style={[styles.card, { backgroundColor: background }, style]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "relative" },
  card: {
    borderWidth,
    borderColor: "#000000",
    borderRadius: radius,
  },
});
