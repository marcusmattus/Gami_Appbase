// §5.4: EIP-1559 estimation with 20% headroom, plus a hard ceiling
// (MAX_TX_GAS_USD = $5) that requires an explicit second confirm rather than
// blocking outright — the user can still choose to proceed.
import type { PublicClient, Transport } from "viem";
import type { GamiChain } from "./clients.js";
import { GAS_HEADROOM_MULTIPLIER, MAX_TX_GAS_USD } from "./constants.js";

export interface GasEstimate {
  gasLimit: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  estimatedCostWei: bigint;
  estimatedCostUsd: number;
  /** True when estimatedCostUsd exceeds MAX_TX_GAS_USD — caller MUST require a second confirm. */
  requiresSecondConfirm: boolean;
}

export interface EstimateGasParams {
  client: PublicClient<Transport, GamiChain>;
  account: `0x${string}`;
  to: `0x${string}`;
  data?: `0x${string}`;
  value?: bigint;
  /** Current ETH/USD price, sourced server-side — never trust a client-supplied price. */
  ethUsdPrice: number;
}

export async function estimateGasWithCeiling(params: EstimateGasParams): Promise<GasEstimate> {
  const { client, account, to, data, value, ethUsdPrice } = params;

  const [rawGasLimit, fees] = await Promise.all([
    client.estimateGas({ account, to, data, value }),
    client.estimateFeesPerGas(),
  ]);

  const gasLimit = applyHeadroom(rawGasLimit);
  const { maxFeePerGas, maxPriorityFeePerGas } = fees;

  const estimatedCostWei = gasLimit * maxFeePerGas;
  const estimatedCostEth = Number(estimatedCostWei) / 1e18;
  const estimatedCostUsd = estimatedCostEth * ethUsdPrice;

  return {
    gasLimit,
    maxFeePerGas,
    maxPriorityFeePerGas,
    estimatedCostWei,
    estimatedCostUsd,
    requiresSecondConfirm: estimatedCostUsd > MAX_TX_GAS_USD,
  };
}

function applyHeadroom(gas: bigint): bigint {
  // Integer-safe *1.2: multiply by 120, divide by 100.
  return (gas * 120n) / 100n;
}

// Exported for callers that already have a raw estimate and just want the
// headroom multiplier documented/applied consistently.
export { GAS_HEADROOM_MULTIPLIER };
