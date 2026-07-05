import type { ReactNode } from "react";

export function PhoneFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-6 md:py-10"
         style={{ background: "radial-gradient(1200px 600px at 50% -10%, color-mix(in oklab, var(--primary) 25%, transparent), transparent), var(--background)" }}>
      <div className={`relative w-full max-w-[420px] min-h-[860px] md:min-h-[820px] bg-surface rounded-[2.5rem] shadow-phone overflow-hidden border border-border ${className}`}>
        <div className="absolute top-2 left-1/2 -translate-x-1/2 h-6 w-32 bg-foreground/90 rounded-b-2xl z-40 hidden md:block" />
        <div className="relative h-full min-h-[860px] md:min-h-[820px] flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}

export function StatusBar({ dark = false }: { dark?: boolean }) {
  return (
    <div className={`px-6 pt-4 pb-1 flex items-center justify-between text-xs font-semibold ${dark ? "text-white" : "text-foreground"}`}>
      <span>9:41</span>
      <div className="flex items-center gap-1">
        <span>●●●●</span>
        <span>5G</span>
        <span>▮▮▮</span>
      </div>
    </div>
  );
}
