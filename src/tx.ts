import { encodeFunctionData, erc20Abi } from "viem";
import * as sdk from "@somnia-chain/markets-sdk";

const { binaryPoolWriteAbi } = sdk as any;

export const ORDER_KIND_BUY_NO = 2;
export const ORDER_TYPE_IOC = 2;
export const SELF_MATCH_CANCEL_TAKER = 0;
const ZERO = "0x0000000000000000000000000000000000000000" as const;

export type UnsignedTx = { tag: string; to: string; data: string; value: string; chainId: number };

export function buildApproveTx(
  collateral: string, pool: string, amountRaw: bigint, chainId: number
): UnsignedTx {
  return {
    tag: "approve",
    to: collateral,
    data: encodeFunctionData({ abi: erc20Abi, functionName: "approve", args: [pool as `0x${string}`, amountRaw] }),
    value: "0",
    chainId,
  };
}

export function buildCoverTx(opts: {
  pool: string;
  downPrice: number;
  contracts: number;
  decimals: number;
  tickRaw: bigint;
  lotRaw: bigint;
  expirySec: number;
  chainId: number;
}): UnsignedTx {
  const { pool, downPrice, contracts, decimals, tickRaw, lotRaw, expirySec, chainId } = opts;
  const ONE = 10n ** BigInt(decimals);

  const downRaw = BigInt(Math.round(downPrice * Number(ONE)));
  const upRaw = ONE - downRaw;
  const priceRaw = (upRaw / tickRaw) * tickRaw;

  const qtyRaw = (BigInt(Math.round(contracts * Number(ONE))) / lotRaw) * lotRaw;
  if (qtyRaw === 0n) throw new Error("quantity below one lot");
  if (priceRaw <= 0n || priceRaw >= ONE) throw new Error("price out of range (0,1)");

  const expireNs = BigInt(expirySec) * 1_000_000_000n;

  return {
    tag: "cover",
    to: pool,
    data: encodeFunctionData({
      abi: binaryPoolWriteAbi,
      functionName: "placeBinaryOrder",
      args: [
        ORDER_KIND_BUY_NO, priceRaw, qtyRaw, expireNs,
        ORDER_TYPE_IOC, SELF_MATCH_CANCEL_TAKER, ZERO, 0n, 0n,
      ],
    }),
    value: "0",
    chainId,
  };
}
