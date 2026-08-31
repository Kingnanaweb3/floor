import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

export default function Closing() {
  return (
    <section className="bg-lift">
      <div className="mx-auto max-w-[1160px] px-[clamp(32px,7vw,96px)] py-[clamp(72px,9vw,132px)] text-center">
        <h2 className="reveal mx-auto max-w-[min(100%,20ch)] font-display text-[clamp(28px,3.6vw,46px)] leading-[1.12] tracking-[-0.032em]">
          Cover the next window.
        </h2>
        <p className="reveal lead mx-auto mt-4 max-w-[min(100%,52ch)] text-ink2">
          Pick an amount, see the premium and the worst case, sign once.
        </p>
        <div className="reveal mt-8 flex justify-center">
          <a href="/app" className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-[14px] font-medium text-bg transition-transform duration-200 hover:-translate-y-px">
            Get coverage <ArrowUpRight size={13} strokeWidth={2} />
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-[1160px] px-[clamp(32px,7vw,96px)] pb-10">
        <div className="rounded-[18px] border border-line bg-card p-[clamp(24px,4vw,44px)]">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">

            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <Image src="/logo.png" alt="" width={28} height={28} className="h-7 w-7" />
                <span className="font-display text-[18px] tracking-[-0.03em]">Floor</span>
              </div>
              <p className="small mt-3.5 max-w-[28ch] text-ink3">
                Downside coverage on dreamDEX Event Contracts.
              </p>
            </div>

            <div className="min-w-0">
              <div className="mono-label text-ink3">Product</div>
              <div className="mt-3.5 space-y-2.5">
                <a href="#how-it-works" className="small block text-ink2 transition-colors hover:text-ink">How it works</a>
                <a href="#settlements" className="small block text-ink2 transition-colors hover:text-ink">Settlements</a>
                <a href="#faq" className="small block text-ink2 transition-colors hover:text-ink">FAQ</a>
                <a href="/app" className="small block text-ink2 transition-colors hover:text-ink">Dashboard</a>
              </div>
            </div>

            <div className="min-w-0">
              <div className="mono-label text-ink3">Resources</div>
              <div className="mt-3.5 space-y-2.5">
                <a href="https://github.com/Kingnanaweb3/floor" target="_blank" rel="noreferrer" className="small block text-ink2 transition-colors hover:text-ink">GitHub</a>
                <a href="https://docs.dreamdex.io/developers/event-contracts" target="_blank" rel="noreferrer" className="small block text-ink2 transition-colors hover:text-ink">Event Contracts docs</a>
                <a href="https://prd.oracle.somnia.host/explore" target="_blank" rel="noreferrer" className="small block text-ink2 transition-colors hover:text-ink">Oracle explorer</a>
              </div>
            </div>

            <div className="min-w-0">
              <div className="mono-label text-ink3">Built on</div>
              <div className="mt-3.5 space-y-2.5">
                <span className="small block text-ink2">Somnia Shannon</span>
                <span className="small block text-ink2">dreamDEX</span>
                <span className="small block font-mono text-ink3">chain 50312</span>
              </div>
            </div>

          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
            <span className="small text-ink3">Testnet only. Not financial advice.</span>
            <span className="small text-ink3">Somnia x dreamDEX Event Contracts Hackathon</span>
          </div>
        </div>
      </div>
    </section>
  );
}
