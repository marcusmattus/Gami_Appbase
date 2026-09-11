// Ported from apps/mobile/app/send.tsx — same §5.1 safety pipeline
// (simulateBeforeSend before any signature, estimateGasWithCeiling's
// requiresSecondConfirm gate), same placeholder ETH/USD price and static
// recipient/amount caveats as the mobile original. See that file's header.
"use client";

import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "next/navigation";
import { ArcadeText, ArcadeScreen, ArcadeButton, ArcadeCard, color, surface } from "@gami/ui";
import { useBaseAccountWallet } from "@gami/identity/web";
import { createGamiPublicClient, simulateBeforeSend, estimateGasWithCeiling } from "@gami/chain";
import { formatTxHash } from "@gami/core";
import type { Address } from "viem";
import { parseEther } from "viem";

const DEMO_RECIPIENT = { name: "zkdrip.gami", address: "0x91c2000000000000000000000000000000004f7d" as Address };
const DEMO_AMOUNT_ETH = "0.25";

type Phase = "review" | "simulating" | "blocked" | "confirm-gas" | "signing" | "done" | "error";

export default function Send() {
  const router = useRouter();
  const wallet = useBaseAccountWallet();
  const [phase, setPhase] = useState<Phase>("review");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [gasUsd, setGasUsd] = useState<number | null>(null);

  const chainEnv = (process.env.NEXT_PUBLIC_CHAIN_ENV as "mainnet" | "sepolia") ?? "sepolia";
  const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL;

  const confirmAndSign = async () => {
    if (!wallet.address) {
      setPhase("error");
      setErrorMsg("Connect your wallet first.");
      return;
    }
    setPhase("simulating");
    try {
      const client = createGamiPublicClient(chainEnv, rpcUrl);
      const value = parseEther(DEMO_AMOUNT_ETH);

      const sim = await simulateBeforeSend({ client, account: wallet.address, to: DEMO_RECIPIENT.address, value });
      if (!sim.ok) {
        setPhase("blocked");
        setErrorMsg(sim.revertReason);
        return;
      }

      // TODO(pricing): same placeholder-price caveat as apps/mobile/app/send.tsx.
      const PLACEHOLDER_ETH_USD = 3200;
      const gas = await estimateGasWithCeiling({
        client,
        account: wallet.address,
        to: DEMO_RECIPIENT.address,
        value,
        ethUsdPrice: PLACEHOLDER_ETH_USD,
      });
      setGasUsd(gas.estimatedCostUsd);

      if (gas.requiresSecondConfirm) {
        setPhase("confirm-gas");
        return;
      }

      await doSend(value);
    } catch (err) {
      setPhase("error");
      setErrorMsg(err instanceof Error ? err.message : "Couldn't reach the network.");
    }
  };

  const doSend = async (value: bigint) => {
    setPhase("signing");
    try {
      const hash = await wallet.sendTransaction({ to: DEMO_RECIPIENT.address, value });
      setPhase("done");
      setErrorMsg(formatTxHash(hash));
    } catch (err) {
      setPhase("error");
      setErrorMsg(err instanceof Error ? err.message : "Signature was rejected or failed.");
    }
  };

  return (
    <ArcadeScreen edges={["top"]}>
      <ArcadeButton label="◂ SEND" variant="ghost" onPress={() => router.push("/home")} containerStyle={{ alignSelf: "flex-start", marginTop: 12 }} />

      <ArcadeCard shadowColor="#000000" shadowSize={5} style={styles.amountCard}>
        <ArcadeText variant="mono" size={9} color="rgba(255,255,255,0.45)" style={{ letterSpacing: 2 }}>
          AMOUNT
        </ArcadeText>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
          <ArcadeText variant="mono" size={42} style={{ fontWeight: "700" }}>
            {DEMO_AMOUNT_ETH}
          </ArcadeText>
          <ArcadeText variant="mono" size={15} color="#9C6CFF" style={{ fontWeight: "700" }}>
            ETH
          </ArcadeText>
        </View>
        <ArcadeText variant="mono" size={10} color="rgba(255,255,255,0.4)">
          BALANCE 0.50
        </ArcadeText>
      </ArcadeCard>

      <ArcadeText variant="mono" size={10} color="rgba(255,255,255,0.45)" style={{ letterSpacing: 2, marginTop: 16, marginBottom: 8 }}>
        TO
      </ArcadeText>
      <View style={styles.toRow}>
        <View style={styles.toAvatar}>
          <ArcadeText variant="mono" size={13} style={{ fontWeight: "700" }}>
            ZK
          </ArcadeText>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <ArcadeText variant="mono" size={14} style={{ fontWeight: "700" }}>
            {DEMO_RECIPIENT.name}
          </ArcadeText>
          <ArcadeText variant="mono" size={10} color="rgba(255,255,255,0.45)">
            RESOLVES TO {DEMO_RECIPIENT.address.slice(0, 6)}…{DEMO_RECIPIENT.address.slice(-4)}
          </ArcadeText>
        </View>
      </View>

      <View style={styles.signBox}>
        <ArcadeText variant="mono" size={9} color="#F5C518" style={{ letterSpacing: 2, fontWeight: "700" }}>
          YOU ARE SIGNING
        </ArcadeText>
        <ArcadeText variant="body" size={14} color="rgba(255,255,255,0.85)" style={{ lineHeight: 21 }}>
          Send <ArcadeText variant="mono" size={14}>{DEMO_AMOUNT_ETH} ETH</ArcadeText> to{" "}
          <ArcadeText variant="mono" size={14}>{DEMO_RECIPIENT.name}</ArcadeText>. Network fee is paid from your balance. This cannot be reversed.
        </ArcadeText>
        {gasUsd != null && (
          <View style={styles.feeRow}>
            <ArcadeText variant="mono" size={10} color="rgba(255,255,255,0.5)" style={{ flex: 1 }}>
              NETWORK FEE
            </ArcadeText>
            <ArcadeText variant="mono" size={12} style={{ fontWeight: "700" }}>
              ≈ ${gasUsd.toFixed(2)}
            </ArcadeText>
          </View>
        )}
      </View>

      {phase === "blocked" && (
        <StatusBanner color={color.danger} text={`SIMULATION FAILED: ${errorMsg ?? "unknown reason"}`} />
      )}
      {phase === "error" && <StatusBanner color={color.danger} text={errorMsg ?? "Something went wrong."} />}
      {phase === "done" && <StatusBanner color={color.success} text={`SENT — TX ${errorMsg}`} />}

      {phase === "confirm-gas" ? (
        <View style={{ gap: 10, marginTop: 4 }}>
          <StatusBanner color="#F5C518" text={`GAS IS HIGHER THAN USUAL (≈ $${gasUsd?.toFixed(2)}). CONFIRM AGAIN TO PROCEED.`} />
          <ArcadeButton label="CONFIRM ANYWAY & SIGN" onPress={() => doSend(parseEther(DEMO_AMOUNT_ETH))} />
        </View>
      ) : (
        <View style={{ flex: 1 }} />
      )}

      <ArcadeButton
        label={phase === "simulating" ? "SIMULATING…" : phase === "signing" ? "AWAITING SIGNATURE…" : "CONFIRM & SIGN"}
        disabled={phase === "simulating" || phase === "signing" || phase === "confirm-gas"}
        onPress={confirmAndSign}
      />
      <View style={{ height: 12 }} />
      <ArcadeButton label="CANCEL" variant="ghost" onPress={() => router.push("/home")} />
    </ArcadeScreen>
  );
}

function StatusBanner({ color: c, text }: { color: string; text: string }) {
  return (
    <View style={[styles.banner, { borderColor: c }]}>
      <ArcadeText variant="mono" size={10} color={c} style={{ fontWeight: "700", letterSpacing: 0.5 }}>
        {text}
      </ArcadeText>
    </View>
  );
}

const styles = StyleSheet.create({
  amountCard: { padding: 20, alignItems: "center", gap: 8, marginTop: 14 },
  toRow: { flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: surface.card, borderWidth: 2, borderColor: color.primary, padding: 14 },
  toAvatar: { width: 36, height: 36, backgroundColor: "#F5C518", borderWidth: 2, borderColor: "#000000", alignItems: "center", justifyContent: "center" },
  signBox: { backgroundColor: surface.cardAlt, borderWidth: 2, borderColor: "#000000", padding: 15, gap: 11, marginTop: 14 },
  feeRow: { flexDirection: "row", alignItems: "center", gap: 10, borderTopWidth: 1, borderTopColor: surface.divider, paddingTop: 11 },
  banner: { borderWidth: 2, padding: 12, marginTop: 12 },
});
