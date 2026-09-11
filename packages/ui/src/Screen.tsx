// Shared screen scaffold: safe-area padding, ARCADE bg color, optional
// scroll. Status-bar style is always "light" (dark background, white
// content) — matches every frame in the design source being rendered dark.
import { View, ScrollView, StyleSheet } from "react-native";
import type { ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { color } from "./tokens.js";

export interface ArcadeScreenProps extends ViewProps {
  scroll?: boolean;
  background?: string;
  /** Screens with their own tab bar / bottom nav should not add extra bottom safe-area padding twice. */
  edges?: Array<"top" | "bottom" | "left" | "right">;
}

export function ArcadeScreen({ scroll = true, background = color.bg, edges = ["top", "bottom"], style, children, ...rest }: ArcadeScreenProps) {
  const insets = useSafeAreaInsets();
  const padding = {
    paddingTop: edges.includes("top") ? insets.top : 0,
    paddingBottom: edges.includes("bottom") ? insets.bottom : 0,
    paddingLeft: edges.includes("left") ? insets.left : 0,
    paddingRight: edges.includes("right") ? insets.right : 0,
  };

  if (scroll) {
    return (
      <ScrollView
        style={[styles.flex, { backgroundColor: background }]}
        contentContainerStyle={[padding, styles.content, style]}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View {...rest} style={[styles.flex, { backgroundColor: background }, padding, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 },
});
