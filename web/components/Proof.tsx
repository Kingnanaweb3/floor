import { ArrowUpRight } from "lucide-react";

export default function Proof() {
  return (
    <section id="settlements" className="bg-lift">
      <div className="mx-auto max-w-[1160px] px-[clamp(32px,7vw,96px)] py-[clamp(72px,9vw,132px)]">
        <div className="grid items-start gap-[clamp(32px,5vw,64px)] lg:grid-cols-[1fr_1.05fr]">

          <div className="reveal min-w-0">
            <h2 className="font-display text-[clamp(28px,3.6vw,46px)] leading-[1.12] tracking-[-0.032em]">
              Every settlement
              <br />
              <span className="text-ink3">leaves a receipt.</span>
            </h2>
            <p className="body mt-4 max-w-[min(100%,52ch)] text-ink2">
              Markets resolve against a multi-source price reference, never a single exchange
              tick. The question, every source that answered it, the median, and the side it
              landed on are all published on chain. Nothing about a settlement is a black box.
            </p>
            <a href="https://prd.oracle.somnia.host/explore" target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.04] px-6 py-3 text-[14px] font-medium backdrop-blur-[8px] transition-transform duration-200 hover:-translate-y-px">
              Open the oracle explorer <ArrowUpRight size={13} strokeWidth={2} />
            </a>
          </div>

          <div className="reveal min-w-0">
            <div className="rounded-[18px] border border-line bg-card p-[26px]">
              <div className="mono-label text-ink3">Settled market</div>

              <div className="mt-5 space-y-0">
                <div className="flex items-center justify-between border-b border-line py-3">
                  <span className="small text-ink2">Market</span>
                  <span className="font-mono text-[13px]">BTC 15m</span>
                </div>
                <div className="flex items-center justify-between border-b border-line py-3">
                  <span className="small text-ink2">Question</span>
                  <span className="text-[13px]">closed at or above open</span>
                </div>
                <div className="flex items-center justify-between border-b border-line py-3">
                  <span className="small text-ink2">Outcome</span>
                  <span className="font-mono text-[13px]">Down</span>
                </div>
                <div className="flex items-center justify-between border-b border-line py-3">
                  <span className="small text-ink2">Contracts held</span>
                  <span className="font-mono text-[13px]">10</span>
                </div>
                <div className="flex items-center justify-between border-b border-line py-3">
                  <span className="small text-ink2">Premium paid</span>
                  <span className="font-mono text-[13px]">6.23</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="small text-ink2">Redeemed</span>
                  <span className="font-mono text-[13px]">10.00 tUSDC</span>
                </div>
              </div>

              <div className="mt-4 rounded-[10px] border border-line px-4 py-3">
                <div className="mono-label text-ink3">Redemption tx</div>
                <div className="mt-1.5 truncate font-mono text-[12px] text-ink2">0x335c16fdc07683d48286237d0f30954f5700e209ccb30e8ac829a7134db345a6</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
