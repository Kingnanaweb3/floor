import { ShieldCheck, RotateCcw, LineChart, ArrowRight } from "lucide-react";

export default function Why() {
  return (
    <section id="why-floor">
      <div className="mx-auto max-w-[1160px] px-[clamp(32px,7vw,96px)] py-[clamp(72px,9vw,132px)]">

        <div className="grid items-start gap-[clamp(24px,4vw,64px)] lg:grid-cols-[1fr_1fr]">
          <h2 className="reveal min-w-0 font-display text-[clamp(28px,3.6vw,46px)] leading-[1.12] tracking-[-0.032em]">
            Protection that holds
            <br />
            <span className="text-ink3">when it matters.</span>
          </h2>

          <div className="reveal min-w-0 lg:pt-2">
            <p className="body max-w-[min(100%,46ch)] text-ink2">
              Why buy downside cover on a prediction market instead of the usual hedge?
              Because the thing protecting you should not be the thing that fails first.
            </p>
            <a href="#faq" className="mt-5 inline-flex items-center gap-2 text-[13px] font-medium text-ink transition-transform duration-200 hover:translate-x-0.5">
              Learn more <ArrowRight size={14} strokeWidth={2} />
            </a>
          </div>
        </div>

        <div className="mt-[clamp(40px,5vw,64px)] grid gap-[18px] md:grid-cols-3">

          <div className="reveal min-w-0 rounded-[18px] border border-line bg-card p-[26px]">
            <span className="grid h-[46px] w-[46px] place-items-center rounded-[14px] border border-line bg-white/[0.04]">
              <ShieldCheck size={19} strokeWidth={2} className="text-ink2" />
            </span>
            <h3 className="mt-5 text-[16px] font-medium">Capped by construction</h3>
            <p className="small mt-2.5 text-ink2">
              Every contract is fully collateralized with no leverage. The premium you pay is
              the maximum you can lose, so there is no margin call and no liquidation price to defend.
            </p>
          </div>

          <div className="reveal min-w-0 rounded-[18px] border border-line bg-card p-[26px]">
            <span className="grid h-[46px] w-[46px] place-items-center rounded-[14px] border border-line bg-white/[0.04]">
              <RotateCcw size={19} strokeWidth={2} className="text-ink2" />
            </span>
            <h3 className="mt-5 text-[16px] font-medium">Refunds, not surprises</h3>
            <p className="small mt-2.5 text-ink2">
              If a reliable settlement price cannot be found, the market voids rather than
              settling on bad data. Both sides redeem at 0.5 and no fee is taken.
            </p>
          </div>

          <div className="reveal min-w-0 rounded-[18px] border border-line bg-card p-[26px]">
            <span className="grid h-[46px] w-[46px] place-items-center rounded-[14px] border border-line bg-white/[0.04]">
              <LineChart size={19} strokeWidth={2} className="text-ink2" />
            </span>
            <h3 className="mt-5 text-[16px] font-medium">Priced by a real book</h3>
            <p className="small mt-2.5 text-ink2">
              The premium comes from a live on-chain order book, not a house line. What you pay
              is the market read on the odds, and you can see the resting orders behind it.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
