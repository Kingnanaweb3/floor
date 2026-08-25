import { isBinaryMarket } from "@somnia-chain/markets-sdk";
import { VENUE_ID, MIN_SECONDS_LEFT } from "./config.js";

export type LiveWindow = {
  marketId: `0x${string}`;
  asset: "BTC" | "ETH";
  intervalSec: number;
  expiry: number;
  secondsLeft: number;
  pool: `0x${string}`;
  outcomeToken: `0x${string}`;
  collateral: `0x${string}`;
  yesId: bigint;
  noId: bigint;
  decimals: number;
  upSymbol: string;
  downSymbol: string;
  symbol: string;
};

export async function findLiveWindows(exchange: any): Promise<LiveWindow[]> {
  const now = Math.floor(Date.now() / 1000);
  const rows: any[] = await exchange.client.listBinaryMarkets({ venueId: VENUE_ID, status: "Trading", limit: 40 });
  const markets: any[] = Object.values(await exchange.loadMarkets(true));
  const out: LiveWindow[] = [];

  const checked = await Promise.all(rows.map(async (r: any) => {
    try {
      const oc = await exchange.client.getMarketOnchain(r.marketId);
      return { r, oc };
    } catch { return null; }
  }));

  for (const c of checked) {
    if (!c) continue;
    const { r, oc } = c;
    if (oc.status !== 1) continue;

    const secondsLeft = Number(oc.expiry) - now;
    if (secondsLeft < MIN_SECONDS_LEFT) continue;

    const m = markets.find((x: any) => isBinaryMarket(x.info) && x.info.marketId === r.marketId);
    const up = m?.outcomes?.[0]?.symbol;
    const down = m?.outcomes?.[1]?.symbol;
    if (!up || !down) continue;

    out.push({
      marketId: r.marketId,
      asset: r.asset,
      intervalSec: Number(r.intervalSec),
      expiry: Number(oc.expiry),
      secondsLeft,
      pool: oc.pool,
      outcomeToken: oc.outcomeToken,
      collateral: oc.collateral,
      yesId: BigInt(oc.yesId),
      noId: BigInt(oc.noId),
      decimals: Number(oc.decimals),
      upSymbol: up,
      downSymbol: down,
      symbol: m.symbol,
    });
  }

  return out.sort((a, b) => a.intervalSec - b.intervalSec);
}

export function pickWindow(windows: LiveWindow[], asset: "BTC" | "ETH", intervalSec: number) {
  return windows.find(w => w.asset === asset && w.intervalSec === intervalSec);
}
