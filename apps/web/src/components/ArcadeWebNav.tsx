// Web has no native bottom-tab-bar concept — this is a horizontal top nav
// replacing apps/mobile/src/components/TabBar.tsx's elevated-SCAN-square
// bottom bar. Same four core destinations (home/quests/nova/profile) plus a
// settings icon and a wallet-status chip (address when connected, SIGN IN
// linking back to `/` when not — matches how mobile's own screens already
// degrade when wallet.address is null, e.g. profile.tsx's `wallet.address ?
// truncateAddress(wallet.address) : mockUser.gamiName`, rather than a hard
// auth-gate redirect that doesn't exist on mobile either).
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArcadeText, color, surface } from "@gami/ui";
import { useBaseAccountWallet } from "@gami/identity/web";
import { truncateAddress } from "@gami/core";

const LINKS: Array<{ href: string; label: string }> = [
  { href: "/home", label: "HOME" },
  { href: "/quests", label: "QUESTS" },
  { href: "/nova", label: "NOVA" },
  { href: "/profile", label: "PROFILE" },
];

export function ArcadeWebNav() {
  const pathname = usePathname();
  const wallet = useBaseAccountWallet();

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "14px 20px",
        borderBottomWidth: 2,
        borderBottomColor: "#000000",
        borderBottomStyle: "solid",
        backgroundColor: surface.card,
      }}
    >
      <ArcadeText variant="display" size={16} style={{ marginRight: 18 }}>
        GAMI
      </ArcadeText>
      {LINKS.map((link) => {
        const active = pathname?.startsWith(link.href);
        return (
          <Link key={link.href} href={link.href} style={{ textDecoration: "none" }}>
            <div
              style={{
                padding: "8px 14px",
                backgroundColor: active ? color.primary : "transparent",
                border: `2px solid ${active ? "#FFFFFF" : "transparent"}`,
              }}
            >
              <ArcadeText variant="mono" size={11} color={active ? "#FFFFFF" : "rgba(255,255,255,0.6)"} style={{ fontWeight: "700", letterSpacing: 1 }}>
                {link.label}
              </ArcadeText>
            </div>
          </Link>
        );
      })}
      <div style={{ flex: 1 }} />
      <Link href="/settings" style={{ textDecoration: "none", marginRight: 14 }}>
        <ArcadeText variant="mono" size={11} color={pathname === "/settings" ? "#9C6CFF" : "rgba(255,255,255,0.5)"} style={{ fontWeight: "700", letterSpacing: 1 }}>
          SETTINGS
        </ArcadeText>
      </Link>
      {wallet.status === "connected" && wallet.address ? (
        <div style={{ border: "2px solid #000000", backgroundColor: color.bg, padding: "7px 11px" }}>
          <ArcadeText variant="mono" size={11} color={color.success} style={{ fontWeight: "700" }}>
            {truncateAddress(wallet.address)}
          </ArcadeText>
        </div>
      ) : (
        <Link href="/" style={{ textDecoration: "none" }}>
          <div style={{ border: "2px solid #FFFFFF", backgroundColor: color.primary, padding: "7px 11px" }}>
            <ArcadeText variant="mono" size={11} color="#FFFFFF" style={{ fontWeight: "700" }}>
              SIGN IN
            </ArcadeText>
          </div>
        </Link>
      )}
    </nav>
  );
}
