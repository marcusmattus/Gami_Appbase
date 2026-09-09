// App-wide offline banner (GamiScreen.dc.html's top-level `{{ offline }}`
// block) — warn-colored bar reading "OFFLINE — SHOWING LAST KNOWN STATE".
// Presentational only: no network-state detection lives here. A caller
// decides when to render it (currently: nothing does automatically — real
// connectivity detection, e.g. via NetInfo, is a separate, not-yet-done
// piece of work; see MIGRATION_NOTES.md).
import { View } from "react-native";
import { ArcadeText } from "./Text.js";
import { warn } from "./tokens.js";

export function OfflineBanner() {
  return (
    <View style={{ backgroundColor: warn, borderBottomWidth: 2, borderBottomColor: "#000000", paddingVertical: 7, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 8 }}>
      <View style={{ width: 7, height: 7, backgroundColor: "#000000" }} />
      <ArcadeText variant="mono" size={10} color="#000000" style={{ fontWeight: "700", letterSpacing: 1.4, textTransform: "uppercase" }}>
        Offline — showing last known state
      </ArcadeText>
    </View>
  );
}
