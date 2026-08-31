import { ArrowUpRight, Hexagon, Zap, ShieldCheck } from "lucide-react";
import Dashboard from "./Dashboard";

export default function Hero() {
  return (
    <section className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[720px] bg-[radial-gradient(ellipse_58%_46%_at_50%_0%,rgba(255,255,255,0.055),transparent_72%)]" />

      <div className="relative mx-auto max-w-[1160px] px-[clamp(32px,7vw,96px)] pt-[clamp(128px,15vw,180px)] text-center">
        <h1 className="reveal h1 mx-auto max-w-[min(100%,17ch)] font-display">
          Cap the Downside.
          <br />
          <span className="text-ink3">Keep the Position.</span>
        </h1>

        <p className="reveal lead mx-auto mt-[18px] max-w-[min(100%,52ch)] text-ink2">
          Floor buys downside coverage on dreamDEX Event Contracts and reopens it every
          window. Your worst case is the premium you paid, with nothing to liquidate.
        </p>

        <div className="reveal mt-10 flex flex-wrap items-center justify-center gap-3">
          <a href="/app" className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[14px] font-medium text-bg transition-transform duration-200 hover:-translate-y-px">
            Get started <ArrowUpRight size={13} strokeWidth={2} />
          </a>
          <a href="#how-it-works" className="inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.04] px-6 py-3 text-[14px] font-medium backdrop-blur-[8px] transition-transform duration-200 hover:-translate-y-px">
            How it works
          </a>
        </div>

        <div className="reveal mt-11">
          <div className="mono-label text-ink3">Live on Somnia Shannon</div>
          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5">
            <span className="small flex items-center gap-2 text-ink2">
              <Hexagon size={14} strokeWidth={2} className="text-accent" /> dreamDEX Event Contracts
            </span>
            <span className="small flex items-center gap-2 text-ink2">
              <Zap size={14} strokeWidth={2} className="text-accent" /> zero fees
            </span>
            <span className="small flex items-center gap-2 text-ink2">
              <ShieldCheck size={14} strokeWidth={2} className="text-accent" /> fully collateralized
            </span>
          </div>
        </div>
      </div>

      <div className="relative mx-auto mt-[clamp(56px,7vw,88px)] max-w-[1160px] px-[clamp(32px,7vw,96px)] pb-[clamp(72px,9vw,132px)]">
        <div className="pointer-events-none absolute left-1/2 top-[-58px] h-[150px] w-[70%] -translate-x-1/2 rounded-[50%] bg-white/[0.14] blur-[80px]" />
        <div className="pointer-events-none absolute left-1/2 top-[-1px] h-px w-[58%] -translate-x-1/2 bg-gradient-to-r from-transparent via-accent to-transparent opacity-60" />
        <div className="reveal">
          <Dashboard />
        </div>
      </div>
    </section>
  );
}
