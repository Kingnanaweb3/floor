import * as sdk from "@somnia-chain/markets-sdk";
const t: any = sdk;
console.log("ORDER_KIND:", t.ORDER_KIND);
console.log("ORDER_KIND_SIDE:", t.ORDER_KIND_SIDE);
console.log("sideOfKind(0..3):", [0,1,2,3].map(k => { try { return t.sideOfKind(k); } catch { return "?"; } }));
