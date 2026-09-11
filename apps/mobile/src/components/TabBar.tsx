// Faithful port of GamiScreen.dc.html's TABS array + elevated SCAN square
// (design lines ~725-731, ~853-876). Rendered as expo-router's custom
// `tabBar` so the elevated scan button can push a full-screen route instead
// of switching tabs, matching the design's `goScan` navigation exactly.
import { View, Pressable, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useRouter } from "expo-router";
// expo-router@57 vendors its own fork of @react-navigation/bottom-tabs
// (its <Tabs tabBar={...}> prop is this type, not the standalone package's —
// the two diverged enough under SDK 57 to fail structurally, see
// MIGRATION_NOTES.md). No public re-export exists on expo-router's main
// entry, so this deep import is the only way to get the type that actually
// matches what <Tabs> passes at runtime.
import type { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs/types";
import { ArcadeText, color, surface, highlight, text as textColor } from "@gami/ui";

const ICONS: Record<string, string> = {
  home: "M3 11 12 3l9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  quests: "M4.5 16.5 3 21l4.5-1.5M14 3l7 7-9 9-7-7z",
  nova: "M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9zM12 8v.01M12 12v4",
  profile: "M4 21v-2a6 6 0 0 1 16 0v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
};

const LABELS: Record<string, string> = { home: "HOME", quests: "QUESTS", nova: "NOVA", profile: "PROFILE" };

export function GamiTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const router = useRouter();

  return (
    <View style={styles.bar}>
      {state.routes.slice(0, 2).map((route) => renderTab(route, state, navigation))}
      <Pressable style={styles.scanSlot} onPress={() => router.push("/scan")}>
        <View style={styles.scanButton}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2}>
            <Path d="M3 7V4h4M17 4h4v3M21 17v3h-4M7 20H3v-3M3 12h18" />
          </Svg>
          <ArcadeText variant="mono" size={7} color="#FFFFFF" style={styles.scanLabel}>
            SCAN
          </ArcadeText>
        </View>
      </Pressable>
      {state.routes.slice(2, 4).map((route) => renderTab(route, state, navigation))}
    </View>
  );

  function renderTab(route: (typeof state.routes)[number], s: typeof state, nav: typeof navigation) {
    const isFocused = s.routes[s.index].key === route.key;
    const iconColor = isFocused ? highlight : "rgba(255,255,255,0.4)";
    const labelColor = isFocused ? textColor.primary : "rgba(255,255,255,0.4)";
    return (
      <Pressable
        key={route.key}
        style={styles.tab}
        onPress={() => {
          const event = nav.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) nav.navigate(route.name);
        }}
      >
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth={2} strokeLinecap="round">
          <Path d={ICONS[route.name]} />
        </Svg>
        <ArcadeText variant="mono" size={8} color={labelColor} style={styles.tabLabel}>
          {LABELS[route.name]}
        </ArcadeText>
        {route.name === "nova" && <View style={styles.novaDot} />}
      </Pressable>
    );
  }
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderTopWidth: 2,
    borderTopColor: "#000000",
    backgroundColor: surface.card,
    paddingTop: 9,
    paddingBottom: 30,
    paddingHorizontal: 6,
  },
  tab: { flex: 1, alignItems: "center", gap: 5, minHeight: 44, position: "relative" },
  tabLabel: { fontWeight: "700", letterSpacing: 0.8 },
  novaDot: {
    position: "absolute",
    top: 2,
    right: "26%",
    width: 7,
    height: 7,
    backgroundColor: color.success,
    borderRadius: 0,
  },
  scanSlot: { flex: 1, alignItems: "center" },
  scanButton: {
    position: "absolute",
    bottom: -2,
    width: 58,
    height: 58,
    backgroundColor: color.primary,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  scanLabel: { fontWeight: "700", letterSpacing: 0.8 },
});
