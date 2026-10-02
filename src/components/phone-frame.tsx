import { useEffect, type ReactNode } from "react";

/** Desktop Demo presentation: realistic ~6" smartphone viewport (CSS px). */
export const DEMO_PHONE_WIDTH = 390;
export const DEMO_PHONE_HEIGHT = 844;

export function PhoneFrame({
  children,
  className = "",
  contentScrollable = true,
}: {
  children: ReactNode;
  className?: string;
  contentScrollable?: boolean;
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
      className="min-h-[100dvh] w-full overflow-x-hidden bg-background md:flex md:items-center md:justify-center md:p-4"
      style={{
        background:
          "radial-gradient(900px 520px at 50% -12%, color-mix(in oklab, var(--primary) 16%, transparent), transparent 68%), var(--background)",
        ["--demo-phone-width" as string]: `${DEMO_PHONE_WIDTH}px`,
        ["--demo-phone-height" as string]: `${DEMO_PHONE_HEIGHT}px`,
        ["--demo-phone-scale" as string]: "min(1, (100vw - 2rem) / 390px, (100dvh - 2rem) / 844px)",
      }}
    >
      <div className="relative h-[100dvh] min-h-0 w-full md:h-[calc(var(--demo-phone-height)*var(--demo-phone-scale))] md:w-[calc(var(--demo-phone-width)*var(--demo-phone-scale))] md:max-w-full md:shrink-0">
        <div
          className={`relative h-full min-h-0 w-full overflow-hidden bg-background md:absolute md:left-0 md:top-0 md:h-[var(--demo-phone-height)] md:w-[var(--demo-phone-width)] md:origin-top-left md:rounded-[2.5rem] md:border md:border-border/70 md:shadow-phone md:[transform:scale(var(--demo-phone-scale))] ${className}`}
        >
          <div className="absolute left-1/2 top-2 z-40 hidden h-6 w-28 -translate-x-1/2 rounded-full bg-foreground/90 md:block" />
          <div
            data-phone-stage=""
            className={`relative flex h-full min-h-0 flex-col overflow-x-hidden overscroll-contain ${
              contentScrollable ? "overflow-y-auto" : "overflow-y-hidden"
            }`}
          >
            {children}
          </div>
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
