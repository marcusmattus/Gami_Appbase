// Shared shell for every post-sign-in screen: the top nav (ArcadeWebNav)
// replaces apps/mobile's bottom tab bar (there's no native tab-bar metaphor
// on a desktop-capable web layout). Nested routes (quest/[id], send,
// receive, scan, settings) render under this same nav rather than as modal
// presentations like on mobile — web has no navigation-stack concept either.
//
// "use client" is required here even though this file has no hooks of its
// own: it imports the @gami/ui barrel (for `color`), whose module graph
// includes hook-using components (Button, Input, Skeleton). Next's
// Server/Client Component boundary analysis walks the whole import graph,
// not just this file's own body.
"use client";

import { ArcadeWebNav } from "../../components/ArcadeWebNav";
import { color } from "@gami/ui";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: color.bg }}>
      <ArcadeWebNav />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>{children}</div>
    </div>
  );
}
