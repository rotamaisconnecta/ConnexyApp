import { useEffect, type ReactNode } from "react";

/**
 * Moldura de simulação: Samsung Galaxy A13.
 * Tela de 6,6" na proporção 20:9 (área útil equivalente a 360 x 800 pontos),
 * cantos pouco arredondados, carcaça de laterais retas e gota central (Infinity-V).
 *
 * No celular real a moldura desaparece e o app ocupa 100% da tela.
 * Em telas grandes a moldura encolhe proporcionalmente conforme a altura
 * disponível, nunca cortando conteúdo.
 */
export function PhoneFrame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    // Aplicativos instalados e navegadores compatíveis permanecem em retrato.
    // Em navegadores que não permitem bloqueio, o layout vertical continua preservado.
    void screen.orientation?.lock?.("portrait").catch(() => undefined);
  }, []);

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full bg-background md:flex md:items-center md:justify-center md:px-4 md:py-8"
      style={{
        background:
          "radial-gradient(900px 520px at 50% -12%, color-mix(in oklab, var(--primary) 16%, transparent), transparent 68%), var(--background)",
        // Altura da tela simulada; a largura deriva da proporção 9:20.
        ["--a13-h" as string]: "min(800px, calc(100dvh - 4rem))",
      }}
    >
      <div className="relative md:h-[var(--a13-h)] md:w-[calc(var(--a13-h)*0.45)] md:rounded-[1.85rem] md:bg-neutral-900 md:p-[7px] md:shadow-phone">
        <div
          className={`relative h-[100dvh] min-h-0 w-full min-w-[320px] overflow-hidden bg-background md:h-full md:rounded-[1.5rem] ${className}`}
        >
          {/* Gota central (Infinity-V) do Galaxy A13 */}
          <div
            aria-hidden
            className="absolute left-1/2 top-0 z-40 hidden h-[18px] w-[18px] -translate-x-1/2 rounded-b-full bg-neutral-900 md:block"
          />
          <div className="relative flex h-full min-h-0 flex-col">{children}</div>
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
        className={`hidden items-center justify-between px-4 pb-0.5 pt-[7px] text-[10px] font-semibold tabular-nums md:flex ${dark ? "text-white" : "text-foreground"}`}
      >
        <span>9:41</span>
        <div className="flex items-center gap-1.5" aria-hidden>
          {/* Sinal, Wi-Fi e bateria em estilo Android */}
          <svg viewBox="0 0 14 10" className="h-2.5 w-3.5 fill-current">
            <rect x="0" y="7" width="2.4" height="3" rx="0.6" />
            <rect x="3.6" y="5" width="2.4" height="5" rx="0.6" />
            <rect x="7.2" y="2.6" width="2.4" height="7.4" rx="0.6" />
            <rect x="10.8" y="0" width="2.4" height="10" rx="0.6" />
          </svg>
          <svg viewBox="0 0 14 10" className="h-2.5 w-3.5 fill-current">
            <path d="M7 10 0.4 3.1A9.3 9.3 0 0 1 13.6 3.1Z" />
          </svg>
          <svg viewBox="0 0 22 10" className="h-2.5 w-[18px]">
            <rect
              x="0.5"
              y="0.5"
              width="18"
              height="9"
              rx="2.2"
              className="fill-none stroke-current"
              strokeWidth="1"
            />
            <rect x="2" y="2" width="13" height="6" rx="1.2" className="fill-current" />
            <rect x="20" y="3.4" width="1.6" height="3.2" rx="0.8" className="fill-current" />
          </svg>
        </div>
      </div>
    </>
  );
}
