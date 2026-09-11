// Duplicated from apps/mobile/src/mockData.ts — same PLACEHOLDER DATA
// caveat applies: the Gami backend doesn't exist, packages/api's typed
// client has nowhere real to point to yet. Kept as two copies (not a shared
// package) because this is fixture data, not app logic; once a real backend
// exists both apps call packages/api instead and this file goes away. See
// MIGRATION_NOTES.md.
import type { Quest } from "@gami/core";

export const mockUser = {
  handle: "noxx_",
  avatarInitials: "NX",
  gamiName: "noxx_.gami",
  streakDays: 1,
  level: 1,
  xp: 250,
  xpToNextLevel: 500,
  rank: 412,
  rankOf: 18200,
  balanceEth: "0.50",
};

export interface MockQuest extends Quest {
  title: string;
  description: string;
  progress: number;
  etaMinutes?: number;
}

export const mockQuests: MockQuest[] = [
  {
    id: "quest_001",
    state: "in_progress",
    xpReward: 250,
    title: "First Steps",
    description: "Finish setting up your wallet. Five small things, one badge.",
    progress: 0.6,
  },
  {
    id: "quest_014",
    state: "available",
    xpReward: 500,
    title: "First Swap",
    description: "Swap is behind a flag in v1 — this quest previews the flow.",
    progress: 0,
    etaMinutes: 5,
  },
];

export const mockWaysToEarn = [
  { label: "Daily login", value: "+100", color: "#9C6CFF" },
  { label: "Complete a quest", value: "+500", color: "#6E3CFB" },
  { label: "Streak bonus", value: "×1.5", color: "#F5C518" },
  { label: "On-chain action", value: "+250", color: "#3B82F6" },
];
