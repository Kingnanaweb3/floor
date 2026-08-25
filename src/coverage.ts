export type Quote = {
  contracts: number;
  pricePerContract: number;
  cost: number;
  payoutIfDown: number;
  netIfDown: number;
  maxLoss: number;
  levels: { price: number; size: number; take: number }[];
  fillable: boolean;
};

export function quoteCoverage(coverAmount: number, downAsks: [number, number][], lotSize: number): Quote {
  const snap = (q: number) => Math.floor(q / lotSize) * lotSize;
  const levels: Quote["levels"] = [];
  let remaining = coverAmount;
  let contracts = 0;
  let cost = 0;

  for (const [price, size] of downAsks) {
    if (remaining <= 0) break;
    const take = snap(Math.min(size, remaining));
    if (take <= 0) continue;
    levels.push({ price, size, take });
    contracts += take;
    cost += take * price;
    remaining -= take;
  }

  const pricePerContract = contracts > 0 ? cost / contracts : 0;
  return {
    contracts,
    pricePerContract,
    cost,
    payoutIfDown: contracts,
    netIfDown: contracts - cost,
    maxLoss: cost,
    levels,
    fillable: contracts >= coverAmount - lotSize,
  };
}

export function downBook(upBids: [number, number][]): [number, number][] {
  return upBids.map(([p, s]) => [1 - p, s] as [number, number]);
}
