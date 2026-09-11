// §5.7 / §5.1: every write is simulateContract'd (or a raw eth_call) first. A
// failing simulation blocks submission and surfaces the decoded revert
// reason. No blind sends — this module is the single choke point every send
// path must go through.
import type { Address, Hex, PublicClient, Transport } from "viem";
import { BaseError, ContractFunctionRevertedError } from "viem";
import type { GamiChain } from "./clients.js";

export interface SimulationResult {
  ok: boolean;
  /** Human-readable decoded revert reason, or a generic message when it can't be decoded. */
  revertReason: string | null;
  /** Gas returned by simulation, for downstream gas estimation. */
  gasEstimate: bigint | null;
}

export interface SimulateTxParams {
  client: PublicClient<Transport, GamiChain>;
  account: Address;
  to: Address;
  data?: Hex;
  value?: bigint;
}

/**
 * Simulates a transaction via eth_call before it is ever signed. Screens must
 * treat a failed simulation as a hard block: surface `revertReason` to the
 * user and require an explicit "I understand, this will likely fail" hold-to
 * confirm before allowing submission anyway (§5.1) — never send silently.
 */
export async function simulateBeforeSend(params: SimulateTxParams): Promise<SimulationResult> {
  const { client, account, to, data, value } = params;
  try {
    const gasEstimate = await client.estimateGas({ account, to, data, value });
    await client.call({ account, to, data, value });
    return { ok: true, revertReason: null, gasEstimate };
  } catch (error) {
    return { ok: false, revertReason: decodeRevertReason(error), gasEstimate: null };
  }
}

function decodeRevertReason(error: unknown): string {
  if (error instanceof BaseError) {
    const revertError = error.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revertError instanceof ContractFunctionRevertedError) {
      return revertError.data?.errorName ?? revertError.reason ?? revertError.shortMessage;
    }
    return error.shortMessage ?? error.message;
  }
  return "This transaction would fail. We couldn't decode a specific reason.";
}
