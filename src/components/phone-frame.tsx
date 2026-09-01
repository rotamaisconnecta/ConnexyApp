import type { ReactNode } from "react";

export function PhoneFrame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full bg-background md:flex md:items-center md:justify-center md:px-4 md:py-10"
      style={{
        background:
          "radial-gradient(900px 520px at 50% -12%, color-mix(in oklab, var(--primary) 16%, transparent), transparent 68%), var(--background)",
      }}
    >
      <div
        className={`relative h-[100dvh] w-full overflow-hidden bg-background md:h-[min(860px,calc(100dvh-5rem))] md:max-w-[420px] md:rounded-[2.5rem] md:border md:border-border/70 md:shadow-phone ${className}`}
      >
        <div className="absolute left-1/2 top-2 z-40 hidden h-6 w-28 -translate-x-1/2 rounded-full bg-foreground/90 md:block" />
        <div className="relative flex h-full min-h-0 flex-col">{children}</div>
      </div>
    </div>
  );
}

export function StatusBar({ dark = false }: { dark?: boolean }) {
  return (
    <>
      <div className="h-[env(safe-area-inset-top,0px)] md:hidden" aria-hidden />
      <div
        className={`hidden items-center justify-between px-6 pb-1 pt-4 text-xs font-semibold md:flex ${dark ? "text-white" : "text-foreground"}`}
      >
        <span>9:41</span>
        <div className="flex items-center gap-1" aria-hidden>
          <span>●●●●</span>
          <span>5G</span>
          <span>▮▮▮</span>
        </div>
      </div>
    </>
  );
}
