import { ArrowUpRight, Ruler, RefreshCw, Search, KeyRound } from "lucide-react";

export default function How() {
  return (
    <section id="how-it-works" className="bg-lift">
      <div className="mx-auto max-w-[1160px] px-[clamp(32px,7vw,96px)] py-[clamp(72px,9vw,132px)]">

        <div className="grid items-start gap-[clamp(32px,5vw,64px)] lg:grid-cols-[1fr_1.05fr]">
          <div className="reveal min-w-0">
            <h2 className="font-display text-[clamp(28px,3.6vw,46px)] leading-[1.12] tracking-[-0.032em]">
              Sized to the book.
              <br />
              <span className="text-ink3">Not to a guess.</span>
            </h2>
            <p className="body mt-4 max-w-[min(100%,52ch)] text-ink2">
              Floor reads the live Down side of the order book, works out how many contracts
              your cover amount buys, and shows the premium and the exact worst case before
              you sign anything.
            </p>
            <a href="/app" className="mt-8 inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.04] px-6 py-3 text-[14px] font-medium backdrop-blur-[8px] transition-transform duration-200 hover:-translate-y-px">
              See it live <ArrowUpRight size={13} strokeWidth={2} />
            </a>
          </div>

          <div className="reveal min-w-0">
            <div className="rounded-[18px] border border-line bg-card p-[26px] shadow-[0_10px_26px_-20px_rgba(0,0,0,0.6)]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-display text-[34px] leading-none tracking-[-0.032em]">0.526</div>
                  <div className="mono-label mt-2 text-ink3">Down price</div>
                </div>
                <div className="rounded-full border border-line px-3 py-1.5 text-[11px] text-ink2">BTC 15m</div>
              </div>

              <svg viewBox="0 0 420 130" className="mt-6 w-full" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="fadeArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.10" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0 96 C 46 96, 62 44, 104 44 S 158 104, 200 104 S 250 30, 296 30 S 352 88, 396 74 L 420 70 L 420 130 L 0 130 Z" fill="url(#fadeArea)" />
                <path d="M0 96 C 46 96, 62 44, 104 44 S 158 104, 200 104 S 250 30, 296 30 S 352 88, 396 74 L 420 70" fill="none" stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="1.4" />
                <circle cx="200" cy="104" r="3.5" fill="#FFFFFF" />
              </svg>

              <div className="mt-5 grid grid-cols-3 gap-4 border-t border-line pt-5">
                <div>
                  <div className="mono-label text-ink3">Premium</div>
                  <div className="mt-1.5 font-mono text-[15px]">52.60</div>
                </div>
                <div>
                  <div className="mono-label text-ink3">Pays if down</div>
                  <div className="mt-1.5 font-mono text-[15px]">100.00</div>
                </div>
                <div>
                  <div className="mono-label text-ink3">Closes in</div>
                  <div className="mt-1.5 font-mono text-[15px]">12:44</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-[clamp(48px,6vw,72px)] grid gap-x-8 gap-y-10 border-t border-line pt-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="reveal min-w-0">
            <div className="flex items-center gap-2.5">
              <Ruler size={17} strokeWidth={2} className="text-ink2" />
              <h3 className="text-[15px] font-medium">Book-sized</h3>
            </div>
            <p className="small mt-2.5 text-ink2">Walks resting orders and snaps to the venue lot grid, so what you see is what fills.</p>
          </div>
          <div className="reveal min-w-0">
            <div className="flex items-center gap-2.5">
              <RefreshCw size={17} strokeWidth={2} className="text-ink2" />
              <h3 className="text-[15px] font-medium">Auto-rolling</h3>
            </div>
            <p className="small mt-2.5 text-ink2">Detects the successor window and reopens coverage without being asked.</p>
          </div>
          <div className="reveal min-w-0">
            <div className="flex items-center gap-2.5">
              <Search size={17} strokeWidth={2} className="text-ink2" />
              <h3 className="text-[15px] font-medium">Self-sweeping</h3>
            </div>
            <p className="small mt-2.5 text-ink2">Finds settled markets that have left the live list and redeems what you won.</p>
          </div>
          <div className="reveal min-w-0">
            <div className="flex items-center gap-2.5">
              <KeyRound size={17} strokeWidth={2} className="text-ink2" />
              <h3 className="text-[15px] font-medium">Unsigned by default</h3>
            </div>
            <p className="small mt-2.5 text-ink2">Returns a transaction for you to sign. Floor never holds keys or collateral.</p>
          </div>
        </div>

      </div>
    </section>
  );
}
