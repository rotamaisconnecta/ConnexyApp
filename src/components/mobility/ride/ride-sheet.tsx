import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, X, type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

/* Identidade visual da mobilidade — Connexy.
   Lilás #A855F7 como assinatura; roxo #6D28D9 para contraste/profundidade.
   Superfícies permanecem neutras (branco/preto/cinza). */
export const RIDE_LILAC = "#A855F7";
export const RIDE_PURPLE = "#6D28D9";
export const RIDE_INK = "#111111";
export const RIDE_MUTED = "#6E6E73";

const spring = { type: "spring", damping: 32, stiffness: 300 } as const;

/* ─── Sheet base reutilizável do fluxo ──────────────────── */

export function RideSheet({
  children,
  footer,
  className = "",
}: {
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`absolute inset-x-0 bottom-0 z-30 flex max-h-[min(78dvh,640px)] flex-col overflow-hidden rounded-t-[26px] bg-white shadow-[0_-14px_44px_rgba(0,0,0,0.16)] ${className}`}
    >
      <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-zinc-200" aria-hidden />
      <div className="scroll-m-0 min-h-0 flex-1 overflow-y-auto no-scrollbar">{children}</div>
      {footer && (
        <div className="shrink-0 border-t border-zinc-100 bg-white px-5 pb-[max(env(safe-area-inset-bottom,0px),1rem)] pt-3">
          {footer}
        </div>
      )}
    </section>
  );
}

/* ─── Overlay sheet (pagamento, segurança, alterar...) ──── */

export function RideOverlaySheet({
  open,
  onClose,
  title,
  icon: Icon,
  children,
  full = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  icon?: LucideIcon;
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <motion.button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="absolute inset-0 bg-black/35"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={spring}
            className={`relative w-full rounded-t-[26px] bg-white px-5 shadow-[0_-14px_44px_rgba(0,0,0,0.2)] ${
              full ? "max-h-[92dvh] overflow-y-auto" : "max-h-[82dvh] overflow-y-auto"
            } no-scrollbar pb-[max(env(safe-area-inset-bottom,0px),1.25rem)] pt-2.5`}
          >
            <div className="mx-auto h-1 w-10 rounded-full bg-zinc-200" aria-hidden />
            {title && (
              <div className="mt-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-[16px] font-bold tracking-tight text-[#111111]">
                  {Icon && <Icon className="h-4 w-4 text-zinc-400" />}
                  {title}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fechar"
                  className="grid h-9 w-9 grid-cols-1 place-items-center rounded-full bg-zinc-100 text-zinc-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="mt-3">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ─── Modal central (emergência, cancelamento...) ───────── */

export function RideModal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-50 flex items-end justify-center">
          <motion.button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="absolute inset-0 bg-black/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative z-10 m-5 w-full max-w-[400px] rounded-[26px] bg-white p-5 shadow-2xl"
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ─── CTA primário (lilás Connexy) ──────────────────────── */

export function PrimaryCTA({
  children,
  onClick,
  disabled = false,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-[48px] w-full items-center justify-center gap-2 rounded-[16px] text-[14px] font-semibold text-white transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-800 active:scale-[0.98] ${
        disabled ? "opacity-45" : "hover:opacity-95"
      } ${className}`}
      style={{
        background: disabled ? "rgba(168,85,247,0.25)" : RIDE_LILAC,
      }}
    >
      {children}
    </button>
  );
}

export function SecondaryCTA({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[48px] w-full items-center justify-center gap-2 rounded-[16px] border-2 border-zinc-900/15 text-[14px] font-semibold text-[#111111] transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-800 ${className}`}
    >
      {children}
    </button>
  );
}

/* ─── Linhas / separadores extremamente discretos ────────── */

export function ListRow({
  title,
  subtitle,
  trailing,
  onClick,
  selected = false,
  leading,
}: {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onClick?: () => void;
  selected?: boolean;
  leading?: ReactNode;
}) {
  const content = (
    <>
      {leading && <span className="shrink-0">{leading}</span>}
      <span className="min-w-0 flex-1 text-left">
        <span
          className={`block truncate text-[14px] ${selected ? "font-bold text-[#111111]" : "font-semibold text-[#111111]"}`}
        >
          {title}
        </span>
        {subtitle && (
          <span className="mt-0.5 block truncate text-[11px] text-zinc-500">{subtitle}</span>
        )}
      </span>
      {selected ? (
        <span
          className="grid h-6 w-6 shrink-0 grid-cols-1 place-items-center rounded-full text-white"
          style={{ background: RIDE_LILAC }}
        >
          <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
        </span>
      ) : (
        (trailing ?? <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300" />)
      )}
    </>
  );

  const cls = `flex w-full items-center gap-3 ${onClick ? "cursor-pointer" : ""}`;
  return onClick ? (
    <button type="button" onClick={onClick} className={`${cls} py-3`}>
      {content}
    </button>
  ) : (
    <div className={`${cls} py-3`}>{content}</div>
  );
}

/* ─── Placa com bastante destaque ────────────────────────── */

export function PlateBadge({ plate }: { plate: string }) {
  return (
    <span className="inline-flex select-none items-center gap-1.5 rounded-[12px] border-2 border-zinc-900 bg-[#111111] px-3 py-1.5">
      <span className="h-2 w-2 rounded-[3px]" style={{ background: RIDE_LILAC }} aria-hidden />
      <span className="text-[18px] font-black tracking-[0.22em] text-white">{plate}</span>
    </span>
  );
}

/* ─── Código de embarque ─────────────────────────────────── */

export function BoardCode({ code }: { code: string }) {
  return (
    <div
      className="flex items-center justify-center gap-2.5 py-1"
      aria-label={`Código de embarque: ${code}`}
    >
      {code.split("").map((digit, index) => (
        <span
          key={`${digit}-${index}`}
          className="grid h-[52px] w-[52px] grid-cols-1 place-items-center rounded-[16px] border border-zinc-200 bg-zinc-50 text-[22px] font-extrabold tracking-tight text-[#111111]"
        >
          {digit}
        </span>
      ))}
    </div>
  );
}
