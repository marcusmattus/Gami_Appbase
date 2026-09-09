// Ported from apps/mobile/app/(tabs)/nova.tsx. Same §6.3 read-only
// constraint applies: this screen never imports GamiWallet, and the chat
// backend doesn't exist — scripted placeholder replies only.
"use client";

import { useRef, useState } from "react";
import { View, Pressable, TextInput, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "next/navigation";
import Svg, { Path } from "react-native-svg";
import { ArcadeText, ArcadeScreen, color, surface } from "@gami/ui";

interface Msg {
  me: boolean;
  text: string;
  questCta?: boolean;
}

const INITIAL: Msg[] = [
  { me: false, text: "yo. i'm your wallet's brain. i read your XP, quests and on-chain history — i can't move a thing." },
  { me: true, text: "find me a quest" },
  { me: false, text: "NeoCity Cyber Cafe is 0.2 mi out and pays +250 XP for a node scan. Open until 11.", questCta: true },
];

const SUGGESTIONS = ["FIND ME A QUEST", "TIMING", "ALPHA"];

export default function Nova() {
  const router = useRouter();
  const [msgs, setMsgs] = useState<Msg[]>(INITIAL);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  const ask = (q?: string) => {
    const text = (q ?? draft).trim() || "find me a quest";
    setDraft("");
    setMsgs((prev) => [
      ...prev,
      { me: true, text },
      { me: false, text: "On it. Scanning quests that match your interests and streak window…" },
    ]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  };

  return (
    <ArcadeScreen scroll={false} edges={["top"]} style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <View style={styles.badgeDotOnline} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <ArcadeText variant="display" size={17}>
            NOVA
          </ArcadeText>
          <ArcadeText variant="mono" size={9} color={color.success} style={{ letterSpacing: 1 }}>
            READ-ONLY · CANNOT MOVE FUNDS
          </ArcadeText>
        </View>
      </View>

      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={styles.bubbles}>
        {msgs.map((m, i) => (
          <View key={i} style={{ alignItems: m.me ? "flex-end" : "flex-start" }}>
            <View style={[styles.bubble, m.me ? styles.bubbleMe : styles.bubbleNova]}>
              <ArcadeText variant="body" size={14} style={{ lineHeight: 20 }}>
                {m.text}
              </ArcadeText>
              {m.questCta && (
                <Pressable style={styles.ctaBtn} onPress={() => router.push("/scan")}>
                  <ArcadeText variant="mono" size={9} color="#000000" style={{ fontWeight: "700" }}>
                    OPEN SCANNER ▸
                  </ArcadeText>
                </Pressable>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.suggestRow}>
        {SUGGESTIONS.map((s) => (
          <Pressable key={s} style={styles.suggestChip} onPress={() => ask(s.toLowerCase())}>
            <ArcadeText variant="mono" size={9} color="rgba(255,255,255,0.8)">
              {s}
            </ArcadeText>
          </Pressable>
        ))}
      </View>

      <View style={styles.inputRow}>
        <View style={styles.inputBox}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="ask nova…"
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={styles.input}
            onSubmitEditing={() => ask()}
          />
        </View>
        <Pressable style={styles.sendBtn} onPress={() => ask()}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round">
            <Path d="M12 19V5M5 12l7-7 7 7" />
          </Svg>
        </Pressable>
      </View>
    </ArcadeScreen>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 0, paddingBottom: 0 },
  header: { flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: "#000000", backgroundColor: surface.card },
  badge: { width: 38, height: 38, backgroundColor: color.bg, borderWidth: 2, borderColor: "#9C6CFF", alignItems: "center", justifyContent: "center" },
  badgeDot: { width: 10, height: 10, backgroundColor: "#9C6CFF" },
  badgeDotOnline: { position: "absolute", top: -6, right: -5, width: 8, height: 8, backgroundColor: color.success },
  bubbles: { padding: 16, gap: 12 },
  bubble: { maxWidth: "82%", padding: 13, borderWidth: 2, borderColor: "#000000" },
  bubbleMe: { backgroundColor: color.primary },
  bubbleNova: { backgroundColor: surface.card },
  ctaBtn: { marginTop: 10, backgroundColor: color.success, borderWidth: 2, borderColor: "#000000", paddingVertical: 8, paddingHorizontal: 11, alignSelf: "flex-start" },
  suggestRow: { flexDirection: "row", gap: 7, flexWrap: "wrap", paddingHorizontal: 16, paddingBottom: 10 },
  suggestChip: { backgroundColor: surface.card, borderWidth: 2, borderColor: surface.border, paddingVertical: 8, paddingHorizontal: 11 },
  inputRow: { flexDirection: "row", gap: 9, paddingHorizontal: 16, paddingBottom: 20 },
  inputBox: { flex: 1, backgroundColor: surface.card, borderWidth: 2, borderColor: surface.border, justifyContent: "center", paddingHorizontal: 12, minHeight: 48 },
  input: { color: "#FFFFFF", fontSize: 14, paddingVertical: 13 },
  sendBtn: { backgroundColor: color.primary, borderWidth: 2, borderColor: "#FFFFFF", paddingHorizontal: 15, alignItems: "center", justifyContent: "center" },
});
