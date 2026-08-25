import * as trade from "@somnia-chain/markets-sdk";

const t: any = trade;
console.log("ORDER_TYPE:", t.ORDER_TYPE);
console.log("SELF_MATCHING_OPTION:", t.SELF_MATCHING_OPTION);
console.log("side-ish exports:", Object.keys(t).filter(k => /SIDE|KIND|BINARY/i.test(k)));
