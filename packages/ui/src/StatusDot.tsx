// The design uses small circular status dots (online indicator, streak
// flame accent) — technically border-radius:50%, which conflicts with
// §2.2's "zero radius, no exceptions." Tokens win: rendered as a square dot
// here. Logged in MIGRATION_NOTES.md.
import { View } from "react-native";
import { radius } from "./tokens.js";

export function ArcadeStatusDot({ color, size = 8 }: { color: string; size?: number }) {
  return <View style={{ width: size, height: size, backgroundColor: color, borderRadius: radius }} />;
}
