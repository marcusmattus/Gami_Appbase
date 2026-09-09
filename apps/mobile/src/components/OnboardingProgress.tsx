import { View, StyleSheet } from "react-native";
import { color, surface } from "@gami/ui";

export function OnboardingProgress({ step, total = 4 }: { step: number; total?: number }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.bar, { backgroundColor: i < step ? color.primary : surface.cardAlt }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 5 },
  bar: { flex: 1, height: 5 },
});
