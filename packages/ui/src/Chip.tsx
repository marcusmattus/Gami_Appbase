import { View, StyleSheet } from "react-native";
import { ArcadeText } from "./Text.js";
import { borderWidth, radius } from "./tokens.js";

export interface ArcadeChipProps {
  label: string;
  color: string;
  /** Filled = solid color bg, outline = transparent bg with colored border+text. */
  filled?: boolean;
}

export function ArcadeChip({ label, color, filled = false }: ArcadeChipProps) {
  return (
    <View
      style={[
        styles.chip,
        { borderColor: color, backgroundColor: filled ? color : `${color}1F` /* ~12% alpha */ },
      ]}
    >
      <ArcadeText variant="mono" size={10} color={filled ? "#000000" : color} style={styles.label}>
        {label}
      </ArcadeText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth,
    borderRadius: radius,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
  },
  label: { fontWeight: "700", letterSpacing: 0.8 },
});
