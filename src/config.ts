import { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES } from "@somnia-chain/markets-sdk";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";

export const VENUE_ID = "0x679795a0195a1b76cdebb7c51d74e058aee92919b8c3389af86ef24535e8a28c";
export const INDEXER = "https://dev.smk.somnia.host/v1/graphql";
export const WS_RPC = "wss://api.infra.testnet.somnia.network/ws";
export const MIN_SECONDS_LEFT = 120;

export function makeExchange(privateKey?: string) {
  return new SomniaMarkets({
    indexerUrl: INDEXER,
    chain: somniaShannon,
    wsRpcUrl: WS_RPC,
    addresses: SOMNIA_TESTNET_ADDRESSES,
    ...(privateKey ? { privateKey: privateKey as `0x${string}` } : {}),
  });
}

export const j = (v: unknown) =>
  JSON.stringify(v, (_k, x) => (typeof x === "bigint" ? x.toString() : x), 2);

export async function retry<T>(fn: () => Promise<T>, tries = 5, base = 500): Promise<T> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); } catch (e) {
      last = e;
      const msg = String(e);
      const retryable = /timeout|fetch failed|ECONN|UND_ERR|5\d\d|rpc_unavailable/i.test(msg);
      if (!retryable || i === tries - 1) throw e;
      const wait = Math.min(30000, base * 2 ** i) * (0.5 + Math.random());
      console.warn(`retry ${i + 1}/${tries} in ${Math.round(wait)}ms: ${msg.slice(0, 90)}`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
  throw last;
}
