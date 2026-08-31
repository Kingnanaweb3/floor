import Image from "next/image";

const LINKS = ["Why Floor", "Coverage", "How it works", "The agent", "FAQ"];

export default function Nav() {
  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <div className="mx-auto flex max-w-[1160px] items-center justify-between px-[clamp(32px,7vw,96px)] py-7">
        <a href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="" width={28} height={28} className="h-7 w-7" priority />
          <span className="font-display text-[18px] tracking-[-0.03em]">Floor</span>
        </a>
        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map(function (l) {
            return (
              <a key={l} href={"#" + l.toLowerCase().split(" ").join("-")} className="small text-ink2 transition-colors duration-200 hover:text-ink">
                {l}
              </a>
            );
          })}
        </nav>
        <a href="/app" className="inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.04] px-6 py-3 text-[14px] font-medium backdrop-blur-[8px] transition-transform duration-200 hover:-translate-y-px">
          Get coverage
        </a>
      </div>
    </header>
  );
}
