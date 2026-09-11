// Quest state machine (§6.2). Only claimable -> claimed touches the chain, and
// only when the quest carries an on-chain reward. Everything else is backend
// state; optimistic UI is permitted only for non-chain transitions.
export type QuestState =
  | "locked"
  | "available"
  | "in_progress"
  | "pending_verification"
  | "claimable"
  | "claimed";

const ALLOWED_TRANSITIONS: Record<QuestState, readonly QuestState[]> = {
  locked: ["available"],
  available: ["in_progress"],
  in_progress: ["pending_verification", "claimable"],
  pending_verification: ["claimable", "available"], // failed verification bounces back
  claimable: ["claimed"],
  claimed: [],
};

/** Only this specific transition may originate a chain write (§6.2). */
export const CHAIN_WRITE_TRANSITION: readonly [QuestState, QuestState] = ["claimable", "claimed"];

export function isValidQuestTransition(from: QuestState, to: QuestState): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function isChainWriteTransition(from: QuestState, to: QuestState): boolean {
  return from === CHAIN_WRITE_TRANSITION[0] && to === CHAIN_WRITE_TRANSITION[1];
}

export interface Quest {
  id: string;
  state: QuestState;
  /** Only present when this quest's claim is a sponsored on-chain transaction (§6.3, §5). */
  onChainRewardContract?: `0x${string}`;
  xpReward: number;
}
