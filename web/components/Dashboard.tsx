import { LayoutGrid, Layers, Bot, Receipt, Settings, LifeBuoy, User, Search, Bell } from "lucide-react";

const NAV = [[LayoutGrid,"Dashboard",true],[Layers,"Windows",false],[Bot,"The agent",false],[Receipt,"Settlements",false]] as const;
const FOOT = [[User,"Profile"],[Settings,"Settings"],[LifeBuoy,"Support"]] as const;

export default function Dashboard() {
  return (
    <div className="relative overflow-hidden rounded-[14px] border border-line bg-gradient-to-b from-lift to-bg">
      <div className="grid grid-cols-1 sm:grid-cols-[190px_1fr]">
        <aside className="hidden flex-col border-r border-line p-4 sm:flex">
          <div className="mb-6 flex items-center gap-2 px-1">
            <img src="/logo.png" alt="" className="h-6 w-6" />
            <span className="text-[14px] font-medium">Floor</span>
          </div>
          <div className="space-y-1">
            {NAV.map(([Icon,label,active]) => (
              <div key={label} className={"flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[12.5px] " + (active ? "bg-white/[0.06] text-ink" : "text-muted")}>
                <Icon size={14} strokeWidth={1.75} />{label}
              </div>
            ))}
          </div>
          <div className="mt-auto space-y-1 pt-8">
            {FOOT.map(([Icon,label]) => (
              <div key={label} className="flex items-center gap-2.5 px-2.5 py-2 text-[12.5px] text-muted"><Icon size={14} strokeWidth={1.75} />{label}</div>
            ))}
          </div>
        </aside>

        <div className="p-3.5 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
            <div>
              <div className="hidden text-[10.5px] text-ink3 sm:block">Coverage / Dashboard</div>
              <div className="whitespace-nowrap text-[13px] font-medium sm:text-[16px]">Active coverage</div>
            </div>
            <div className="hidden items-center gap-3 sm:flex">
              <Bell size={15} className="text-muted" />
              <div className="flex items-center gap-2 rounded-md border border-line px-3 py-1.5 text-[11px] text-muted"><Search size={12} /> Search</div>
            </div>
          </div>

          <div className="grid gap-3.5 sm:gap-4 lg:grid-cols-[1.6fr_1fr]">
            <div className="rounded-[10px] border border-line bg-card p-3.5 sm:p-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-[11px] text-muted">Covered</div>
                  <div className="mt-1 flex items-baseline gap-2"><span className="text-[20px] font-medium tracking-[-0.02em] sm:text-[26px]">100.00</span><span className="text-[12px] text-accent">tUSDC</span></div>
                </div>
                <div className="flex gap-1">
                  {["15m","1h","4h","1d"].map((t,i)=>(<span key={t} className={"rounded-full px-2.5 py-1 text-[10.5px] " + (i===0?"bg-white/10 text-ink":"text-muted")}>{t}</span>))}
                </div>
              </div>
              <svg viewBox="0 0 400 90" className="mt-4 w-full" preserveAspectRatio="none">
                <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" /><stop offset="100%" stopColor="var(--accent)" stopOpacity="0" /></linearGradient></defs>
                <path d="M0 72 L34 66 L68 70 L102 54 L136 60 L170 42 L204 48 L238 33 L272 40 L306 26 L340 31 L374 18 L400 22 L400 90 L0 90 Z" fill="url(#g)" />
                <path d="M0 72 L34 66 L68 70 L102 54 L136 60 L170 42 L204 48 L238 33 L272 40 L306 26 L340 31 L374 18 L400 22" fill="none" stroke="var(--accent)" strokeWidth="1.4" />
              </svg>
              <div className="mt-3 grid grid-cols-3 border-t border-line pt-3">
                {[["Premium","52.60"],["Pays if down","100.00"],["Worst case","-52.60"]].map(([k,v])=>(
                  <div key={k}><div className="text-[10.5px] text-muted">{k}</div><div className="mt-0.5 text-[14px]">{v}</div></div>
                ))}
              </div>
            </div>

            <div className="rounded-[10px] border border-line bg-card p-3.5 sm:p-4">
              <div className="text-[13px] font-medium">Next window</div>
              <div className="mt-3 rounded-[8px] border border-line p-3">
                <div className="flex items-center justify-between"><span className="text-[13px]">BTC 15m</span><span className="rounded border border-line px-1.5 py-0.5 text-[10px] text-muted">rolling</span></div>
                <div className="mt-1 text-[10.5px] text-muted">closes in 12:44</div>
              </div>
              <div className="mt-3 rounded-[8px] border border-line p-3">
                <div className="flex items-center justify-between"><span className="text-[13px]">Down 0.526</span><span className="text-[10px] text-accent">fillable</span></div>
                <div className="mt-1 text-[10.5px] text-muted">100 contracts available</div>
              </div>
              <div className="mt-3 flex items-center justify-center gap-1.5 rounded-[8px] border border-line py-2 text-[12px]">Renew coverage <span className="text-muted">&#8250;</span></div>
            </div>
          </div>

          <div className="mt-3.5 grid grid-cols-3 gap-2 sm:mt-4 sm:gap-4">
            {["Recent coverage","Settlements","Agent log"].map(t=>(
              <div key={t} className="flex min-w-0 items-center justify-center rounded-[10px] border border-line bg-card px-2 py-3 text-center text-[10px] leading-[1.3] sm:justify-start sm:px-4 sm:py-3.5 sm:text-left sm:text-[12.5px]">{t}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
