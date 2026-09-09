// LOCKED — §2.2. ARCADE design system, Cyber-Brutalist. Where the Claude
// Design source (Gami Wallet Mobile.dc.html) disagrees with these values, the
// tokens win — see MIGRATION_NOTES.md for the logged conflicts.
//
// Forbidden, enforced by lint (see /eslint-rules): gradients, glassmorphism,
// backdrop blur, soft/diffuse shadows, borderRadius > 0, opacity-based
// elevation, any font outside the three below. Every numeral the user reads
// (balances, XP, gas, block numbers, dates, percentages, addresses) is mono.
export const color = {
  bg: "#0E0E12",
  primary: "#6E3CFB",
  accent: "#FF3D8B",
  success: "#00E5A0",
  danger: "#FF4444",
} as const;

export const radius = 0; // ALL corners. No exceptions.
export const borderWidth = 2;
export const shadowOffset = 6; // hard offset, color = color.primary, zero blur

export const font = {
  display: "SpaceGrotesk_700Bold", // headings, buttons
  body: "Inter_400Regular", // prose, labels
  mono: "JetBrainsMono_500Medium", // ALL numerals, addresses, hashes, amounts
} as const;

export type ArcadeColor = keyof typeof color;
export type ArcadeFont = keyof typeof font;

// NOT LOCKED — gap-fill, not a §2.2 override. The five locked colors (bg,
// primary, accent, success, danger) have no card-surface, border-neutral, or
// warning slot, which a real multi-surface app needs. Values below are taken
// from the Claude Design source (GamiScreen.dc.html) where it used the same
// neutrals consistently across all 15 screens — logged in MIGRATION_NOTES.md
// as a design-system gap that needs an owner decision, not silently invented
// brand color. Where the design used a color that DOES collide with a locked
// slot (its "#00F5A0" XP/success green vs. the locked `color.success`
// "#00E5A0"), the locked value wins and is NOT included here.
export const surface = {
  card: "#15151E", // card/list-row background
  cardAlt: "#1A1A22", // nested card / divider / secondary surface
  page: "#08080B", // page background on a few full-bleed screens (bg is #0E0E12)
  border: "rgba(255,255,255,0.2)", // neutral (non-black) border, e.g. inputs/toggles at rest
  divider: "rgba(255,255,255,0.1)",
} as const;

export const text = {
  primary: "#FFFFFF",
  secondary: "rgba(255,255,255,0.6)",
  muted: "rgba(255,255,255,0.4)",
  faint: "rgba(255,255,255,0.3)",
} as const;

// Design's secondary purple (links, active tab icons, secondary highlights) —
// not one of the 5 locked colors. Kept distinct from color.primary because
// collapsing it would flatten real hierarchy (primary = solid CTA fill,
// this = text/icon accent on dark surfaces).
export const highlight = "#9C6CFF";

// Design's amber, used for streaks/warnings/offline banner — not locked.
export const warn = "#F5C518";
