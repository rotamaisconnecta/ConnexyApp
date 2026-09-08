import { useEffect, type ReactNode } from "react";

export function PhoneFrame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    const orientation = screen.orientation as
      | (ScreenOrientation & {
          lock?: (orientation: string) => Promise<void>;
        })
      | null;
    // Aplicativos instalados e navegadores compatíveis permanecem em retrato.
    // Em navegadores que não permitem bloqueio, o layout vertical continua preservado.
    void orientation?.lock?.("portrait").catch(() => undefined);
  }, []);

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full overflow-x-hidden bg-background md:flex md:items-center md:justify-center md:px-4 md:py-8"
      style={{
        background:
          "radial-gradient(900px 520px at 50% -12%, color-mix(in oklab, var(--primary) 16%, transparent), transparent 68%), var(--background)",
      }}
    >
      <div
        className={`relative h-[100dvh] min-h-0 w-full overflow-hidden bg-background md:h-auto md:w-[min(400px,calc((100dvh-4rem)*0.41212))] md:rounded-[2.5rem] md:border md:border-border/70 md:shadow-phone ${className}`}
        style={{ aspectRatio: "68 / 165" }}
      >
        <div className="absolute left-1/2 top-2 z-40 hidden h-6 w-28 -translate-x-1/2 rounded-full bg-foreground/90 md:block" />
        <div className="relative flex h-full min-h-0 flex-col overflow-y-auto overflow-x-hidden overscroll-contain">
          {children}
        </div>
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
