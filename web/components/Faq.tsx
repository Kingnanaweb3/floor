"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

const QA = [
  ["What happens if a market voids?",
   "If no reliable settlement price can be determined inside the settlement window, the market voids rather than settling on bad data. Both sides redeem at 0.5 and no fee is taken. It is a refund, not a loss."],
  ["Why not just use a perpetual future?",
   "Perps liquidate. Move far enough against the position and the venue closes your hedge and keeps the collateral, so you lose on both sides at once. A Down contract is fully collateralized with no leverage, so the premium is the absolute maximum you can lose on it."],
  ["Does Floor hold my funds?",
   "No. Floor prices the coverage and returns an unsigned transaction. You sign it in your own wallet and broadcast it. Your keys and collateral never leave your control."],
  ["What is the catch?",
   "A Down contract pays a fixed amount if the window closes below its opening price. It does not pay more when the move is larger, while your spot loss does scale with the size of the move. So Floor covers an amount you choose, not your entire exposure. You pick the number and see the exact worst case before signing."],
  ["What does it cost?",
   "Nothing beyond the premium and gas. dreamDEX sets maker, taker, and settlement fees to zero, so a winning contract redeems one for one."],
];

export default function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq">
      <div className="mx-auto max-w-[860px] px-[clamp(32px,7vw,96px)] py-[clamp(72px,9vw,132px)]">
        <h2 className="reveal font-display text-[clamp(28px,3.6vw,46px)] leading-[1.12] tracking-[-0.032em]">
          Questions worth <span className="text-ink3">asking first.</span>
        </h2>

        <div className="mt-10">
          {QA.map(function (item, i) {
            var isOpen = open === i;
            return (
              <div key={item[0]} className="reveal border-b border-line">
                <button
                  type="button"
                  onClick={function () { setOpen(isOpen ? -1 : i); }}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left"
                >
                  <span className="text-[15px] font-medium">{item[0]}</span>
                  <Plus
                    size={16}
                    strokeWidth={2}
                    className={"shrink-0 text-ink3 transition-transform duration-200 " + (isOpen ? "rotate-45" : "")}
                  />
                </button>
                <div className={"grid transition-all duration-300 ease-out " + (isOpen ? "grid-rows-[1fr] pb-5 opacity-100" : "grid-rows-[0fr] opacity-0")}>
                  <p className="body overflow-hidden pr-10 text-ink2">{item[1]}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
